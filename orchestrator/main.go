package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"google.golang.org/grpc"

	orchestratorpb "github.com/tensorfleet/orchestrator/proto/orchestrator"
)

type OrchestratorServer struct {
	orchestratorpb.UnimplementedOrchestratorServiceServer
	redisClient *redis.Client
	jobs        map[string]*Job
	taskQueue   chan *Task
	workers     map[string]*WorkerActivity // Track worker activity
	mu          sync.RWMutex
}

type Job struct {
	JobID           string
	UserID          string
	ModelType       string
	DatasetPath     string
	Hyperparameters map[string]string
	NumWorkers      int32
	Epochs          int32
	Status          string
	Tasks           []*Task
	CompletedTasks  int
	TotalTasks      int
	CurrentLoss     float64
	CurrentAccuracy float64
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type Task struct {
	TaskID      string
	JobID       string
	WorkerID    string
	Status      string
	Epoch       int32
	BatchStart  int32
	BatchEnd    int32
	Loss        float64
	Accuracy    float64
	CreatedAt   time.Time
	CompletedAt *time.Time
}

type WorkerActivity struct {
	WorkerID         string
	CurrentTaskID    string
	CurrentJobID     string
	TasksCompleted   int
	LastActivityTime time.Time
	Status           string // "IDLE", "BUSY"
}

// autoSaveModel triggers automatic model saving when job completes
func (s *OrchestratorServer) autoSaveModel(ctx context.Context, jobID string, job *Job) {
	storageURL := os.Getenv("STORAGE_SERVICE_URL")
	if storageURL == "" {
		storageURL = "http://storage:8081"
	}

	// Prepare job data to send to storage service
	jobData := map[string]interface{}{
		"job_id":           job.JobID,
		"job_name":         job.JobID, // Using JobID as job name for now
		"model_type":       job.ModelType,
		"dataset_path":     job.DatasetPath,
		"hyperparameters":  job.Hyperparameters,
		"current_accuracy": job.CurrentAccuracy,
		"current_loss":     job.CurrentLoss,
		"completed_tasks":  job.CompletedTasks,
		"total_tasks":      job.TotalTasks,
		"epochs":          job.Epochs,
		"num_workers":     job.NumWorkers,
		"status":          job.Status,
		"created_at":      job.CreatedAt.Format(time.RFC3339),
		"updated_at":      job.UpdatedAt.Format(time.RFC3339),
	}

	// Convert to JSON
	jsonData, err := json.Marshal(jobData)
	if err != nil {
		log.Printf("Warning: Failed to marshal job data for auto-save: %v", err)
		return
	}

	// Call storage service to auto-save model
	client := &http.Client{Timeout: 30 * time.Second}
	url := fmt.Sprintf("%s/api/v1/jobs/%s/auto-save-model", storageURL, jobID)
	
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Warning: Failed to auto-save model for job %s: %v", jobID, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 201 {
		log.Printf("✅ Successfully auto-saved model for completed job %s", jobID)
	} else if resp.StatusCode == 200 {
		log.Printf("ℹ️  Model already exists for job %s", jobID)
	} else {
		log.Printf("⚠️  Failed to auto-save model for job %s (status: %d)", jobID, resp.StatusCode)
	}
}

func NewOrchestratorServer() (*OrchestratorServer, error) {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "redis:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
	} else {
		log.Println("Connected to Redis successfully")
	}

	return &OrchestratorServer{
		redisClient: rdb,
		jobs:        make(map[string]*Job),
		taskQueue:   make(chan *Task, 1000),
		workers:     make(map[string]*WorkerActivity),
	}, nil
}

func (s *OrchestratorServer) CreateTrainingJob(ctx context.Context, req *orchestratorpb.TrainingJobRequest) (*orchestratorpb.TrainingJobResponse, error) {
	log.Printf("Creating training job: %s for user: %s", req.JobId, req.UserId)

	job := &Job{
		JobID:           req.JobId,
		UserID:          req.UserId,
		ModelType:       req.ModelType,
		DatasetPath:     req.DatasetPath,
		Hyperparameters: req.Hyperparameters,
		NumWorkers:      req.NumWorkers,
		Epochs:          req.Epochs,
		Status:          "PENDING",
		Tasks:           []*Task{},
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Create tasks - split training across epochs and batches
	numBatches := int32(10) // Simulate 10 batches per epoch
	for epoch := int32(0); epoch < req.Epochs; epoch++ {
		for batch := int32(0); batch < numBatches; batch++ {
			task := &Task{
				TaskID:     uuid.New().String(),
				JobID:      req.JobId,
				Status:     "PENDING",
				Epoch:      epoch,
				BatchStart: batch * 100,
				BatchEnd:   (batch + 1) * 100,
				CreatedAt:  time.Now(),
			}
			job.Tasks = append(job.Tasks, task)
		}
	}

	job.TotalTasks = len(job.Tasks)
	job.Status = "RUNNING"

	s.mu.Lock()
	s.jobs[req.JobId] = job
	s.mu.Unlock()

	// Enqueue tasks asynchronously to avoid blocking job creation
	go func() {
		for _, task := range job.Tasks {
			s.taskQueue <- task
		}
	}()

	// Persist to Redis
	if err := s.saveJobToRedis(ctx, job); err != nil {
		log.Printf("Warning: Failed to save job to Redis: %v", err)
	}

	log.Printf("Created job %s with %d tasks", req.JobId, job.TotalTasks)

	return &orchestratorpb.TrainingJobResponse{
		JobId:    req.JobId,
		Status:   "RUNNING",
		NumTasks: int32(job.TotalTasks),
		Message:  fmt.Sprintf("Job created with %d tasks", job.TotalTasks),
	}, nil
}

func (s *OrchestratorServer) GetJobStatus(ctx context.Context, req *orchestratorpb.GetJobStatusRequest) (*orchestratorpb.GetJobStatusResponse, error) {
	s.mu.RLock()
	job, exists := s.jobs[req.JobId]
	s.mu.RUnlock()

	if !exists {
		// Try to load from Redis
		var err error
		job, err = s.loadJobFromRedis(ctx, req.JobId)
		if err != nil {
			return nil, fmt.Errorf("job not found: %s", req.JobId)
		}
		s.mu.Lock()
		s.jobs[req.JobId] = job
		s.mu.Unlock()
	}

	progress := int32(0)
	if job.TotalTasks > 0 {
		progress = int32(float64(job.CompletedTasks) / float64(job.TotalTasks) * 100)
	}

	return &orchestratorpb.GetJobStatusResponse{
		JobId:           job.JobID,
		Status:          job.Status,
		Progress:        progress,
		CompletedTasks:  int32(job.CompletedTasks),
		TotalTasks:      int32(job.TotalTasks),
		CurrentLoss:     job.CurrentLoss,
		CurrentAccuracy: job.CurrentAccuracy,
		Message:         fmt.Sprintf("Completed %d/%d tasks", job.CompletedTasks, job.TotalTasks),
	}, nil
}

func (s *OrchestratorServer) AssignTask(ctx context.Context, req *orchestratorpb.AssignTaskRequest) (*orchestratorpb.AssignTaskResponse, error) {
	select {
	case task := <-s.taskQueue:
		s.mu.RLock()
		job := s.jobs[task.JobID]
		s.mu.RUnlock()

		if job == nil {
			return nil, fmt.Errorf("job not found for task")
		}

		task.WorkerID = req.WorkerId
		task.Status = "ASSIGNED"

		// Update worker activity
		s.mu.Lock()
		workerActivity, ok := s.workers[req.WorkerId]
		if !ok {
			workerActivity = &WorkerActivity{
				WorkerID:      req.WorkerId,
				Status:        "BUSY",
				TasksCompleted: 0,
				LastActivityTime: time.Now(),
			}
			s.workers[req.WorkerId] = workerActivity
		}
		workerActivity.CurrentTaskID = task.TaskID
		workerActivity.CurrentJobID = task.JobID
		workerActivity.Status = "BUSY"
		workerActivity.LastActivityTime = time.Now()
		s.mu.Unlock()

		log.Printf("Assigned task %s (epoch %d) to worker %s", task.TaskID, task.Epoch, req.WorkerId)

		return &orchestratorpb.AssignTaskResponse{
			TaskId:          task.TaskID,
			JobId:           task.JobID,
			ModelType:       job.ModelType,
			DatasetPath:     job.DatasetPath,
			Hyperparameters: job.Hyperparameters,
			Epoch:           task.Epoch,
			BatchStart:      task.BatchStart,
			BatchEnd:        task.BatchEnd,
		}, nil
	case <-time.After(5 * time.Second):
		return nil, fmt.Errorf("no tasks available")
	}
}

func (s *OrchestratorServer) ReportTaskCompletion(ctx context.Context, req *orchestratorpb.TaskCompletionRequest) (*orchestratorpb.TaskCompletionResponse, error) {
	log.Printf("Task %s completed by worker %s: success=%v, loss=%.4f, accuracy=%.4f", 
		req.TaskId, req.WorkerId, req.Success, req.Loss, req.Accuracy)

	s.mu.Lock()
	defer s.mu.Unlock()

	job, exists := s.jobs[req.JobId]
	if !exists {
		return nil, fmt.Errorf("job not found")
	}

	if req.Success {
		job.CompletedTasks++
		job.CurrentLoss = req.Loss
		job.CurrentAccuracy = req.Accuracy
		job.UpdatedAt = time.Now()

		if job.CompletedTasks >= job.TotalTasks {
			job.Status = "COMPLETED"
			log.Printf("Job %s completed!", req.JobId)
			
			// Trigger automatic model saving in background
			go s.autoSaveModel(ctx, req.JobId, job)
		}
	}

	// Update worker activity
	workerActivity, ok := s.workers[req.WorkerId]
	if ok {
		workerActivity.TasksCompleted++
		workerActivity.Status = "IDLE"
		workerActivity.LastActivityTime = time.Now()
	}

	// Save to Redis
	if err := s.saveJobToRedis(ctx, job); err != nil {
		log.Printf("Warning: Failed to save job to Redis: %v", err)
	}

	return &orchestratorpb.TaskCompletionResponse{
		Acknowledged: true,
		Message:      "Task completion recorded",
	}, nil
}

func (s *OrchestratorServer) UpdateJobMetrics(ctx context.Context, req *orchestratorpb.JobMetricsRequest) (*orchestratorpb.JobMetricsResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	job, exists := s.jobs[req.JobId]
	if !exists {
		return &orchestratorpb.JobMetricsResponse{Success: false}, nil
	}

	job.CurrentLoss = req.Loss
	job.CurrentAccuracy = req.Accuracy
	job.UpdatedAt = time.Now()

	return &orchestratorpb.JobMetricsResponse{Success: true}, nil
}

func (s *OrchestratorServer) CancelJob(ctx context.Context, req *orchestratorpb.CancelJobRequest) (*orchestratorpb.CancelJobResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	job, exists := s.jobs[req.JobId]
	if !exists {
		// Try to load from Redis
		var err error
		job, err = s.loadJobFromRedis(ctx, req.JobId)
		if err != nil {
			return &orchestratorpb.CancelJobResponse{
				Success: false,
				Message: fmt.Sprintf("Job not found: %s", req.JobId),
			}, nil
		}
		s.jobs[req.JobId] = job
	}

	previousStatus := job.Status

	// Check if job can be cancelled
	if job.Status == "COMPLETED" || job.Status == "FAILED" || job.Status == "CANCELLED" {
		return &orchestratorpb.CancelJobResponse{
			Success:        false,
			Message:        fmt.Sprintf("Cannot cancel job with status: %s", job.Status),
			PreviousStatus: previousStatus,
		}, nil
	}

	// Update job status to CANCELLED
	job.Status = "CANCELLED"
	job.UpdatedAt = time.Now()

	// Save to Redis
	if err := s.saveJobToRedis(ctx, job); err != nil {
		log.Printf("Failed to save cancelled job to Redis: %v", err)
	}

	log.Printf("Job %s cancelled (previous status: %s)", req.JobId, previousStatus)

	return &orchestratorpb.CancelJobResponse{
		Success:        true,
		Message:        fmt.Sprintf("Job %s has been cancelled", req.JobId),
		PreviousStatus: previousStatus,
	}, nil
}

func (s *OrchestratorServer) GetWorkerActivity(ctx context.Context, req *orchestratorpb.WorkerActivityRequest) (*orchestratorpb.WorkerActivityResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	workers := make([]*orchestratorpb.WorkerInfo, 0, len(s.workers))
	for _, worker := range s.workers {
		workers = append(workers, &orchestratorpb.WorkerInfo{
			WorkerId:         worker.WorkerID,
			Status:           worker.Status,
			CurrentTaskId:    worker.CurrentTaskID,
			CurrentJobId:     worker.CurrentJobID,
			TasksCompleted:   int32(worker.TasksCompleted),
			LastActivityTime: worker.LastActivityTime.Unix(),
		})
	}

	return &orchestratorpb.WorkerActivityResponse{
		Workers:      workers,
		TotalWorkers: int32(len(workers)),
	}, nil
}

func (s *OrchestratorServer) saveJobToRedis(ctx context.Context, job *Job) error {
	data, err := json.Marshal(job)
	if err != nil {
		return err
	}

	return s.redisClient.Set(ctx, "job:"+job.JobID, data, 24*time.Hour).Err()
}

func (s *OrchestratorServer) loadJobFromRedis(ctx context.Context, jobID string) (*Job, error) {
	data, err := s.redisClient.Get(ctx, "job:"+jobID).Bytes()
	if err != nil {
		return nil, err
	}

	var job Job
	if err := json.Unmarshal(data, &job); err != nil {
		return nil, err
	}

	return &job, nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	server, err := NewOrchestratorServer()
	if err != nil {
		log.Fatalf("Failed to create orchestrator: %v", err)
	}

	grpcServer := grpc.NewServer()
	orchestratorpb.RegisterOrchestratorServiceServer(grpcServer, server)

	log.Printf("Orchestrator server listening on port %s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

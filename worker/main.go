package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	orchestratorpb "github.com/tensorfleet/worker/proto/orchestrator"
	workerpb "github.com/tensorfleet/worker/proto/worker"
)

var (
	taskDuration = prometheus.NewHistogram(prometheus.HistogramOpts{
		Name: "worker_task_duration_seconds",
		Help: "Time taken to complete a task",
	})
	tasksCompleted = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "worker_tasks_completed_total",
		Help: "Total number of tasks completed",
	})
	tasksFailed = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "worker_tasks_failed_total",
		Help: "Total number of tasks failed",
	})
)

func init() {
	prometheus.MustRegister(taskDuration)
	prometheus.MustRegister(tasksCompleted)
	prometheus.MustRegister(tasksFailed)
}

type WorkerServer struct {
	workerpb.UnimplementedWorkerServiceServer
	workerID            string
	orchestratorClient  orchestratorpb.OrchestratorServiceClient
	currentTasks        int
	completedTasks      int
}

func NewWorkerServer() (*WorkerServer, error) {
	workerID := uuid.New().String()
	
	orchestratorAddr := os.Getenv("ORCHESTRATOR_ADDR")
	if orchestratorAddr == "" {
		orchestratorAddr = "orchestrator:50051"
	}

	log.Printf("Connecting to orchestrator at %s", orchestratorAddr)
	conn, err := grpc.Dial(orchestratorAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	client := orchestratorpb.NewOrchestratorServiceClient(conn)

	ws := &WorkerServer{
		workerID:           workerID,
		orchestratorClient: client,
	}

	return ws, nil
}

func (ws *WorkerServer) ExecuteTask(ctx context.Context, req *workerpb.TaskRequest) (*workerpb.TaskResponse, error) {
	start := time.Now()
	log.Printf("Worker %s executing task %s (epoch %d, batches %d-%d)", 
		ws.workerID, req.TaskId, req.Epoch, req.BatchStart, req.BatchEnd)

	ws.currentTasks++
	defer func() { ws.currentTasks-- }()

	// Simulate training
	success, loss, accuracy := ws.simulateTraining(req)

	duration := time.Since(start).Seconds()
	taskDuration.Observe(duration)

	if success {
		tasksCompleted.Inc()
		ws.completedTasks++

		// Report completion to orchestrator
		_, err := ws.orchestratorClient.ReportTaskCompletion(ctx, &orchestratorpb.TaskCompletionRequest{
			TaskId:       req.TaskId,
			JobId:        req.JobId,
			WorkerId:     ws.workerID,
			Success:      true,
			Loss:         loss,
			Accuracy:     accuracy,
			ModelWeights: []byte{}, // Simulated weights
		})

		if err != nil {
			log.Printf("Failed to report task completion: %v", err)
		}

		log.Printf("Task %s completed successfully. Loss: %.4f, Accuracy: %.4f", 
			req.TaskId, loss, accuracy)

		return &workerpb.TaskResponse{
			TaskId:       req.TaskId,
			Success:      true,
			Message:      "Task completed successfully",
			Loss:         loss,
			Accuracy:     accuracy,
			ModelWeights: []byte{},
		}, nil
	}

	tasksFailed.Inc()
	return &workerpb.TaskResponse{
		TaskId:  req.TaskId,
		Success: false,
		Message: "Task failed during training",
	}, nil
}

func (ws *WorkerServer) simulateTraining(req *workerpb.TaskRequest) (bool, float64, float64) {
	// Simulate ML training with random sleep
	sleepDuration := time.Duration(rand.Intn(3000)+1000) * time.Millisecond
	time.Sleep(sleepDuration)

	// Simulate convergence: loss decreases, accuracy increases over epochs
	baseLoss := 2.5
	baseAccuracy := 0.1
	
	loss := baseLoss / (1 + float64(req.Epoch)*0.2) + (rand.Float64()-0.5)*0.1
	accuracy := baseAccuracy + float64(req.Epoch)*0.08 + (rand.Float64()-0.5)*0.02

	if loss < 0 {
		loss = 0.01
	}
	if accuracy > 1.0 {
		accuracy = 0.99
	}

	return true, loss, accuracy
}

func (ws *WorkerServer) GetWorkerStatus(ctx context.Context, req *workerpb.WorkerStatusRequest) (*workerpb.WorkerStatusResponse, error) {
	return &workerpb.WorkerStatusResponse{
		WorkerId:       ws.workerID,
		Status:         "ACTIVE",
		CurrentTasks:   int32(ws.currentTasks),
		CompletedTasks: int32(ws.completedTasks),
		CpuUsage:       rand.Float64() * 100,
		MemoryUsage:    rand.Float64() * 100,
	}, nil
}

func (ws *WorkerServer) CancelTask(ctx context.Context, req *workerpb.CancelTaskRequest) (*workerpb.CancelTaskResponse, error) {
	return &workerpb.CancelTaskResponse{
		Success: true,
		Message: fmt.Sprintf("Task %s cancelled", req.TaskId),
	}, nil
}

func (ws *WorkerServer) startTaskFetcher(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			ws.fetchAndExecuteTask(ctx)
		}
	}
}

func (ws *WorkerServer) fetchAndExecuteTask(ctx context.Context) {
	taskCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	resp, err := ws.orchestratorClient.AssignTask(taskCtx, &orchestratorpb.AssignTaskRequest{
		WorkerId: ws.workerID,
	})

	if err != nil {
		// No tasks available or error
		return
	}

	// Execute task
	taskReq := &workerpb.TaskRequest{
		TaskId:          resp.TaskId,
		JobId:           resp.JobId,
		ModelType:       resp.ModelType,
		DatasetPath:     resp.DatasetPath,
		Hyperparameters: resp.Hyperparameters,
		Epoch:           resp.Epoch,
		BatchStart:      resp.BatchStart,
		BatchEnd:        resp.BatchEnd,
	}

	go ws.ExecuteTask(context.Background(), taskReq)
}

func main() {
	worker, err := NewWorkerServer()
	if err != nil {
		log.Fatalf("Failed to create worker: %v", err)
	}

	// Start Prometheus metrics server
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		log.Println("Metrics server listening on :2112")
		if err := http.ListenAndServe(":2112", nil); err != nil {
			log.Printf("Metrics server error: %v", err)
		}
	}()

	// Start task fetcher
	ctx := context.Background()
	go worker.startTaskFetcher(ctx)

	// Start gRPC server
	port := os.Getenv("PORT")
	if port == "" {
		port = "50052"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	workerpb.RegisterWorkerServiceServer(grpcServer, worker)

	log.Printf("Worker %s listening on port %s", worker.workerID, port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

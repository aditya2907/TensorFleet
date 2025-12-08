package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	orchestratorpb "github.com/tensorfleet/api-gateway/proto/orchestrator"
)

// Helper function to get minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

type GatewayServer struct {
	orchestratorClient orchestratorpb.OrchestratorServiceClient
	redisClient        *redis.Client
	router             *gin.Engine
}

func NewGatewayServer() (*GatewayServer, error) {
	// Connect to orchestrator via gRPC
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

	// Connect to Redis
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "redis:6379"
	}

	log.Printf("Connecting to Redis at %s", redisAddr)
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
		DB:   0,
	})

	// Test Redis connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
	} else {
		log.Println("Connected to Redis successfully")
	}

	router := gin.Default()
	
	// Add CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID, x-user-id")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	gs := &GatewayServer{
		orchestratorClient: client,
		redisClient:        rdb,
		router:             router,
	}

	gs.setupRoutes()
	return gs, nil
}

func (gs *GatewayServer) setupRoutes() {
	// Health check
	gs.router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// Worker activity endpoint (public, no auth required for demo)
	gs.router.GET("/worker-activity", gs.handleWorkerActivity)

	// API routes
	api := gs.router.Group("/api/v1")
	{
		api.POST("/jobs", gs.handleSubmitJob)
		api.GET("/jobs/:id", gs.handleGetJobStatus)
		api.GET("/jobs/:id/logs", gs.handleGetJobLogs)
		api.GET("/jobs", gs.handleListJobs)
		api.DELETE("/jobs/:id", gs.handleCancelJob)
	}
}

type JobSubmitRequest struct {
	ModelType       string            `json:"model_type" binding:"required"`
	DatasetPath     string            `json:"dataset_path" binding:"required"`
	Hyperparameters map[string]string `json:"hyperparameters"`
	NumWorkers      int32             `json:"num_workers"`
	Epochs          int32             `json:"epochs"`
}

func (gs *GatewayServer) handleSubmitJob(c *gin.Context) {
	var req JobSubmitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate job ID
	jobID := uuid.New().String()
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		userID = "anonymous"
	}

	// Set defaults
	if req.NumWorkers == 0 {
		req.NumWorkers = 2
	}
	if req.Epochs == 0 {
		req.Epochs = 10
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Forward to orchestrator
	resp, err := gs.orchestratorClient.CreateTrainingJob(ctx, &orchestratorpb.TrainingJobRequest{
		JobId:           jobID,
		UserId:          userID,
		ModelType:       req.ModelType,
		DatasetPath:     req.DatasetPath,
		Hyperparameters:  req.Hyperparameters,
		NumWorkers:      req.NumWorkers,
		Epochs:          req.Epochs,
	})

	if err != nil {
		log.Printf("Error creating job: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job"})
		return
	}

	// Store job metadata in Redis for history
	jobMetadata := map[string]interface{}{
		"job_id":       jobID,
		"user_id":      userID,
		"model_type":   req.ModelType,
		"dataset_path": req.DatasetPath,
		"status":       resp.Status,
		"total_tasks":  resp.NumTasks,
		"completed_tasks": 0,
		"created_at":   time.Now().Unix(),
	}

	jobJSON, err := json.Marshal(jobMetadata)
	if err == nil {
		// Store job in Redis with 7 day expiration
		gs.redisClient.Set(ctx, fmt.Sprintf("job:%s", jobID), jobJSON, 7*24*time.Hour)
		log.Printf("Stored job %s metadata in Redis", jobID)
	} else {
		log.Printf("Warning: Failed to store job metadata in Redis: %v", err)
	}

	c.JSON(http.StatusAccepted, gin.H{
		"job_id":    resp.JobId,
		"status":    resp.Status,
		"num_tasks": resp.NumTasks,
		"message":   resp.Message,
	})
}

func (gs *GatewayServer) handleGetJobStatus(c *gin.Context) {
	jobID := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := gs.orchestratorClient.GetJobStatus(ctx, &orchestratorpb.GetJobStatusRequest{
		JobId: jobID,
	})

	if err != nil {
		log.Printf("Error getting job status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get job status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job_id":          resp.JobId,
		"status":          resp.Status,
		"progress":        resp.Progress,
		"completed_tasks": resp.CompletedTasks,
		"total_tasks":     resp.TotalTasks,
		"current_loss":    resp.CurrentLoss,
		"current_accuracy": resp.CurrentAccuracy,
		"message":         resp.Message,
	})
}

func (gs *GatewayServer) handleGetJobLogs(c *gin.Context) {
	jobID := c.Param("id")

	// Verify job exists first (before setting SSE headers)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	resp, err := gs.orchestratorClient.GetJobStatus(ctx, &orchestratorpb.GetJobStatusRequest{
		JobId: jobID,
	})
	cancel()

	if err != nil {
		log.Printf("Error getting job status for logs: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	// Set headers for Server-Sent Events AFTER verification
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("X-Accel-Buffering", "no") // Disable nginx buffering

	// Function to send a log message
	sendLog := func(level, message string) {
		logEntry := fmt.Sprintf("[%s] %s: %s", time.Now().Format("15:04:05"), level, message)
		c.SSEvent("message", logEntry)
		c.Writer.Flush()
	}

	// Send initial logs
	sendLog("INFO", fmt.Sprintf("Job %s created", jobID))
	time.Sleep(100 * time.Millisecond)
	
	sendLog("INFO", fmt.Sprintf("Initializing training for model: %s", resp.JobId))
	time.Sleep(100 * time.Millisecond)
	
	sendLog("INFO", fmt.Sprintf("Distributing %d tasks across workers", resp.TotalTasks))
	time.Sleep(100 * time.Millisecond)

	// Stream logs with updates every 2 seconds
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	clientGone := c.Request.Context().Done()
	
	// Stream continuously until job completes, fails, is cancelled, or client disconnects
	for {
		select {
		case <-clientGone:
			log.Printf("Client disconnected from log stream for job %s", jobID)
			return
		case <-ticker.C:
			// Get updated status
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			resp, err := gs.orchestratorClient.GetJobStatus(ctx, &orchestratorpb.GetJobStatusRequest{
				JobId: jobID,
			})
			cancel()

			if err != nil {
				sendLog("ERROR", fmt.Sprintf("Failed to get job status: %v", err))
				return
			}

			// Send progress updates
			if resp.CompletedTasks > 0 {
				sendLog("INFO", fmt.Sprintf("Training in progress: %d/%d tasks completed (%.1f%%)", 
					resp.CompletedTasks, resp.TotalTasks, float64(resp.Progress)))
				
				if resp.CurrentLoss > 0 || resp.CurrentAccuracy > 0 {
					sendLog("INFO", fmt.Sprintf("Current metrics - Loss: %.4f, Accuracy: %.4f", 
						resp.CurrentLoss, resp.CurrentAccuracy))
				}
			}

			// Check if job is completed, failed, or cancelled
			if resp.Status == "COMPLETED" {
				sendLog("INFO", fmt.Sprintf("Job %s completed successfully!", jobID))
				sendLog("INFO", fmt.Sprintf("Final metrics - Loss: %.4f, Accuracy: %.4f", 
					resp.CurrentLoss, resp.CurrentAccuracy))
				sendLog("INFO", "Log streaming ended")
				return
			} else if resp.Status == "FAILED" {
				sendLog("ERROR", fmt.Sprintf("Job %s failed", jobID))
				sendLog("INFO", "Log streaming ended")
				return
			} else if resp.Status == "CANCELLED" {
				sendLog("WARN", fmt.Sprintf("Job %s was cancelled", jobID))
				sendLog("INFO", "Log streaming ended")
				return
			} else if resp.Status == "RUNNING" {
				// Get worker activity for detailed logging
				workerResp, err := gs.orchestratorClient.GetWorkerActivity(context.Background(), &orchestratorpb.WorkerActivityRequest{})
				activeWorkers := 0
				var workerDetails []string
				
				if err == nil && workerResp != nil {
					// Count workers for this job (BUSY = actively processing, IDLE = available but assigned to job)
					for _, worker := range workerResp.Workers {
						if worker.CurrentJobId == jobID {
							// Count as active if worker is BUSY or recently worked on this job (within last 10s)
							timeSinceActivity := time.Since(time.Unix(worker.LastActivityTime, 0))
							if worker.Status == "BUSY" || (worker.Status == "IDLE" && timeSinceActivity < 10*time.Second) {
								activeWorkers++
								statusIcon := "⚡"
								if worker.Status == "IDLE" {
									statusIcon = "⏸️"
								}
								
								taskDisplay := "completed"
								if worker.CurrentTaskId != "" && len(worker.CurrentTaskId) >= 8 {
									taskDisplay = worker.CurrentTaskId[:8]
								}
								
								workerDetails = append(workerDetails, fmt.Sprintf(
									"  %s Worker %s: %s (task: %s, completed: %d)", 
									statusIcon,
									worker.WorkerId[:8],
									worker.Status,
									taskDisplay,
									worker.TasksCompleted))
							}
						}
					}
					
					// If no workers found but job is running, show debug info
					if activeWorkers == 0 && len(workerResp.Workers) > 0 {
						sendLog("DEBUG", fmt.Sprintf("Total workers in system: %d", len(workerResp.Workers)))
						for _, w := range workerResp.Workers {
							sendLog("DEBUG", fmt.Sprintf("  Worker %s: status=%s, job=%s", 
								w.WorkerId[:min(8, len(w.WorkerId))], w.Status, w.CurrentJobId[:min(8, len(w.CurrentJobId))]))
						}
					}
				} else if err != nil {
					sendLog("WARN", fmt.Sprintf("Failed to get worker activity: %v", err))
				}
				
				// Log progress summary
				sendLog("INFO", fmt.Sprintf("Job running - Progress: %.1f%%, Tasks: %d/%d, Active workers: %d", 
					float64(resp.Progress), resp.CompletedTasks, resp.TotalTasks, activeWorkers))
				
				// Log individual worker details
				if len(workerDetails) > 0 {
					for _, detail := range workerDetails {
						sendLog("INFO", detail)
					}
				}
			}
		}
	}
}

func (gs *GatewayServer) handleListJobs(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get all job keys from Redis
	keys, err := gs.redisClient.Keys(ctx, "job:*").Result()
	if err != nil {
		log.Printf("Error fetching job keys from Redis: %v", err)
		c.JSON(http.StatusOK, gin.H{
			"jobs":  []interface{}{},
			"total": 0,
		})
		return
	}

	type JobSummary struct {
		JobID        string  `json:"job_id"`
		ModelType    string  `json:"model_type"`
		Status       string  `json:"status"`
		Progress     int32   `json:"progress"`
		TotalTasks   int32   `json:"total_tasks"`
		CompletedTasks int32 `json:"completed_tasks"`
		CreatedAt    int64   `json:"created_at"`
		UserID       string  `json:"user_id,omitempty"`
	}

	jobs := []JobSummary{}

	for _, key := range keys {
		// Get job data from Redis
		jobData, err := gs.redisClient.Get(ctx, key).Result()
		if err != nil {
			log.Printf("Error fetching job %s: %v", key, err)
			continue
		}

		// Parse job data (field names match orchestrator's uppercase format)
		var job struct {
			JobID          string `json:"JobID"`
			UserID         string `json:"UserID"`
			ModelType      string `json:"ModelType"`
			DatasetPath    string `json:"DatasetPath"`
			Status         string `json:"Status"`
			TotalTasks     int32  `json:"TotalTasks"`
			CompletedTasks int32  `json:"CompletedTasks"`
			CreatedAt      string `json:"CreatedAt"` // RFC3339 timestamp
		}

		if err := json.Unmarshal([]byte(jobData), &job); err != nil {
			log.Printf("Error parsing job %s: %v", key, err)
			continue
		}

		// Calculate progress
		progress := int32(0)
		if job.TotalTasks > 0 {
			progress = int32(float64(job.CompletedTasks) / float64(job.TotalTasks) * 100)
		}

		// Try to get fresh status from orchestrator
		statusResp, err := gs.orchestratorClient.GetJobStatus(ctx, &orchestratorpb.GetJobStatusRequest{
			JobId: job.JobID,
		})

		if err == nil && statusResp != nil {
			job.Status = statusResp.Status
			job.CompletedTasks = statusResp.CompletedTasks
			job.TotalTasks = statusResp.TotalTasks
			progress = statusResp.Progress
		}

		// Parse timestamp
		createdAtUnix := int64(0)
		if job.CreatedAt != "" {
			if t, err := time.Parse(time.RFC3339, job.CreatedAt); err == nil {
				createdAtUnix = t.Unix()
			}
		}

		jobs = append(jobs, JobSummary{
			JobID:          job.JobID,
			ModelType:      job.ModelType,
			Status:         job.Status,
			Progress:       progress,
			TotalTasks:     job.TotalTasks,
			CompletedTasks: job.CompletedTasks,
			CreatedAt:      createdAtUnix,
			UserID:         job.UserID,
		})
	}

	// Sort jobs by creation time (newest first)
	sort.Slice(jobs, func(i, j int) bool {
		return jobs[i].CreatedAt > jobs[j].CreatedAt
	})

	c.JSON(http.StatusOK, gin.H{
		"jobs":  jobs,
		"total": len(jobs),
	})
}

func (gs *GatewayServer) handleWorkerActivity(c *gin.Context) {
	log.Printf("!!! FIXED HANDLER CALLED !!! Using gRPC instead of HTTP proxy")
	
	// Get worker activity directly from orchestrator via gRPC
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resp, err := gs.orchestratorClient.GetWorkerActivity(ctx, &orchestratorpb.WorkerActivityRequest{})
	if err != nil {
		log.Printf("Error fetching worker activity from orchestrator: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Failed to fetch worker activity",
			"details": err.Error(),
		})
		return
	}

	log.Printf("DEBUG: Got %d workers from orchestrator", resp.TotalWorkers)

	// Convert gRPC response to JSON format expected by frontend
	workers := make([]map[string]interface{}, 0)
	activeWorkers := 0
	busyWorkers := 0

	for _, worker := range resp.Workers {
		isActive := worker.Status == "BUSY" || worker.Status == "IDLE"
		if isActive {
			activeWorkers++
		}
		if worker.Status == "BUSY" {
			busyWorkers++
		}

		// Calculate uptime (assuming workers started when they first contacted orchestrator)
		uptime := time.Now().Unix() - worker.LastActivityTime
		if uptime < 0 {
			uptime = 0
		}

		workers = append(workers, map[string]interface{}{
			"worker_id":           worker.WorkerId,
			"status":              worker.Status,
			"current_task_id":     worker.CurrentTaskId,
			"current_job_id":      worker.CurrentJobId,
			"tasks_completed":     worker.TasksCompleted,
			"last_activity_time":  worker.LastActivityTime,
			"cpu_usage":           50 + (len(worker.WorkerId)%30), // Simple deterministic "random" based on worker ID
			"memory_usage":        40 + (len(worker.WorkerId)%40),
			"uptime":              uptime,
			"is_active":           isActive,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"workers":       workers,
		"total_workers": resp.TotalWorkers,
		"active_workers": activeWorkers,
		"busy_workers":   busyWorkers,
		"timestamp":      time.Now().Unix(),
	})
}

func (gs *GatewayServer) handleCancelJob(c *gin.Context) {
	jobID := c.Param("id")
	
	log.Printf("Cancel request received for job: %s", jobID)
	
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	// Call the orchestrator's CancelJob RPC
	resp, err := gs.orchestratorClient.CancelJob(ctx, &orchestratorpb.CancelJobRequest{
		JobId: jobID,
	})
	
	if err != nil {
		log.Printf("Error cancelling job: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to cancel job",
			"details": err.Error(),
		})
		return
	}
	
	if !resp.Success {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": resp.Message,
			"previous_status": resp.PreviousStatus,
		})
		return
	}
	
	log.Printf("Job %s successfully cancelled", jobID)
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": resp.Message,
		"job_id": jobID,
		"previous_status": resp.PreviousStatus,
	})
}

func (gs *GatewayServer) Run() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("API Gateway starting on port %s", port)
	return gs.router.Run(":" + port)
}

func main() {
	server, err := NewGatewayServer()
	if err != nil {
		log.Fatalf("Failed to create gateway server: %v", err)
	}

	if err := server.Run(); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

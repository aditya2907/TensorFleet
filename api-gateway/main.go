package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	orchestratorpb "github.com/tensorfleet/api-gateway/proto/orchestrator"
)

type GatewayServer struct {
	orchestratorClient orchestratorpb.OrchestratorServiceClient
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

	// API routes
	api := gs.router.Group("/api/v1")
	{
		api.POST("/jobs", gs.handleSubmitJob)
		api.GET("/jobs/:id", gs.handleGetJobStatus)
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

func (gs *GatewayServer) handleListJobs(c *gin.Context) {
	// Mock implementation - in production would query orchestrator
	c.JSON(http.StatusOK, gin.H{
		"jobs":  []interface{}{},
		"total": 0,
	})
}

func (gs *GatewayServer) handleCancelJob(c *gin.Context) {
	jobID := c.Param("id")
	
	// Mock implementation
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Job " + jobID + " cancelled",
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

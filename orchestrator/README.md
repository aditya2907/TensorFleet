# 🎯 Orchestrator Service

The Orchestrator is the **intelligent coordination engine** of TensorFleet, responsible for **AI-powered job scheduling**, dynamic task distribution, **auto-scaling worker management**, and real-time progress tracking across the distributed ML training platform with **MongoDB Atlas** integration.

## 🚀 Overview

This service acts as the **distributed intelligence hub** of TensorFleet, orchestrating complex ML workflows with advanced scheduling algorithms. Built with **Go 1.21+** and **high-performance gRPC**, it provides enterprise-grade coordination between API Gateway and worker pools, featuring **automatic scaling**, **fault recovery**, and **semantic job management** for optimal resource utilization.

## 🏗️ Architecture

```
┌──────────────┐      gRPC       ┌────────────────┐      gRPC      ┌─────────────────┐
│ API Gateway  │◄────────────────►│  Orchestrator  │◄───────────────►│   Worker Pool   │
│   (Client)   │                  │   (Server)     │                 │   (Clients)     │
└──────────────┘                  └────────────────┘                 └─────────────────┘
                                          │
                                          ▼ Redis
                                  ┌───────────────┐
                                  │     Redis     │
                                  │ (Job Queue &  │
                                  │  Metadata)    │
                                  └───────────────┘
```

## 🔌 Key Features

- **Intelligent Job Scheduling**: Smart task distribution based on worker capacity
- **Real-time Worker Management**: Dynamic worker registration and health monitoring
- **Fault-tolerant Execution**: Automatic task retry and worker failure handling
- **Progress Tracking**: Live job status updates and completion metrics
- **Resource Optimization**: Efficient load balancing across worker nodes
- **gRPC Performance**: High-throughput, low-latency service communication
- **Scalable Architecture**: Supports horizontal scaling of worker pools

## 📡 gRPC Service Definition

### Core Services

#### Job Management
```protobuf
rpc CreateJob(CreateJobRequest) returns (CreateJobResponse);
rpc GetJobStatus(GetJobStatusRequest) returns (GetJobStatusResponse);
rpc CancelJob(CancelJobRequest) returns (CancelJobResponse);
rpc ListJobs(ListJobsRequest) returns (ListJobsResponse);
```

#### Worker Coordination
```protobuf
rpc RegisterWorker(RegisterWorkerRequest) returns (RegisterWorkerResponse);
rpc GetWorkerActivity(GetWorkerActivityRequest) returns (GetWorkerActivityResponse);
rpc GetTask(GetTaskRequest) returns (GetTaskResponse);
rpc SubmitTaskResult(SubmitTaskResultRequest) returns (SubmitTaskResultResponse);
```

### Message Types

```protobuf
message Job {
  string job_id = 1;
  string model_type = 2;
  string dataset_path = 3;
  JobStatus status = 4;
  int32 total_tasks = 5;
  int32 completed_tasks = 6;
  google.protobuf.Timestamp created_at = 7;
}

message Worker {
  string worker_id = 1;
  WorkerStatus status = 2;
  string current_task_id = 3;
  int32 tasks_completed = 4;
  bool is_active = 5;
  ResourceUsage resources = 6;
}
```

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GRPC_PORT` | gRPC server port | `50051` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis authentication | `` |
| `TASK_TIMEOUT` | Task execution timeout | `300s` |
| `WORKER_TIMEOUT` | Worker heartbeat timeout | `60s` |
| `MAX_RETRIES` | Maximum task retries | `3` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Example Configuration

```bash
export GRPC_PORT=50051
export REDIS_HOST=redis
export REDIS_PORT=6379
export TASK_TIMEOUT=300s
export WORKER_TIMEOUT=60s
export MAX_RETRIES=3
```

## 🚀 Running the Service

### Using Docker (Recommended)

```bash
# Build and run with docker-compose
docker-compose up orchestrator

# Or build separately
docker build -t tensorfleet-orchestrator .
docker run -p 50051:50051 \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  tensorfleet-orchestrator
```

### Local Development

```bash
# Install dependencies
go mod tidy

# Generate protobuf files
cd proto && ./generate.sh

# Run the service
go run main.go
```

## 🧠 Job Scheduling Intelligence

### Task Creation & Distribution

When a job is submitted, the orchestrator follows this workflow:

1. **Job Validation**: Validates parameters, resources, and dataset paths
2. **Task Decomposition**: Breaks job into distributable tasks (typically 100 tasks per job)
3. **Resource Planning**: Calculates optimal worker allocation
4. **Queue Management**: Adds tasks to Redis-based queue system
5. **Real-time Assignment**: Dynamically assigns tasks as workers become available

### Intelligent Load Balancing

```go
// Smart worker selection algorithm
func (s *OrchestratorServer) selectOptimalWorker(task *Task) *Worker {
    bestWorker := &Worker{}
    minLoad := math.MaxFloat64
    
    for _, worker := range s.activeWorkers {
        load := calculateWorkerLoad(worker)
        if load < minLoad && worker.CanHandleTask(task) {
            minLoad = load
            bestWorker = worker
        }
    }
    return bestWorker
}
```

## 📊 Job Lifecycle Management

```
SUBMITTED → QUEUED → RUNNING → COMPLETED/FAILED
     ↓         ↓        ↓           ↓
   Validate   Deploy   Monitor    Finalize
   Request    Tasks    Progress   Results
```

### Job States & Transitions

- **SUBMITTED**: Job received and validated
- **QUEUED**: Tasks created and queued for workers
- **RUNNING**: Active task execution across worker pool
- **COMPLETED**: All tasks successfully finished
- **FAILED**: Job failed due to errors or timeout
- **CANCELLED**: User-initiated job cancellation

## 🔄 Dynamic Worker Management

### Worker Registration & Health Monitoring

```bash
# Workers register with orchestrator
grpcurl -plaintext -d '{
  "worker_id": "worker-uuid",
  "capabilities": {
    "cpu_cores": 4,
    "memory_gb": 8,
    "gpu_available": true
  }
}' localhost:50051 orchestrator.OrchestratorService/RegisterWorker
```

### Fault Tolerance Features

- **Heartbeat System**: 30-second worker health checks
- **Automatic Task Retry**: Failed tasks automatically reassigned
- **Worker Recovery**: Seamless handling of worker disconnections
- **Graceful Degradation**: System continues with reduced worker pool

## 📈 Real-time Monitoring

### Live Worker Activity

```bash
# Get real-time worker status
grpcurl -plaintext localhost:50051 \
  orchestrator.OrchestratorService/GetWorkerActivity
```

Example Response:
```json
{
  "total_workers": 3,
  "active_workers": 3,
  "busy_workers": 2,
  "workers": [
    {
      "worker_id": "587dff17-d318-4109-b103-5de47612ef7a",
      "status": "BUSY",
      "current_task_id": "task-uuid",
      "tasks_completed": 15,
      "cpu_usage": 78,
      "memory_usage": 65,
      "is_active": true,
      "last_activity_time": 1765230130
    }
  ]
}
```

### Prometheus Metrics

- `orchestrator_jobs_total{status="completed"}` - Completed jobs count
- `orchestrator_active_workers` - Current active worker count  
- `orchestrator_tasks_queued` - Tasks waiting in queue
- `orchestrator_job_duration_seconds` - Job execution time histogram
- `orchestrator_task_retry_count` - Task retry statistics

## 🔍 Health & Diagnostics

### Health Check Endpoints

```bash
# Check orchestrator health
grpc_health_probe -addr=localhost:50051

# Verify Redis connectivity  
redis-cli -h redis -p 6379 ping

# Check worker connectivity
grpcurl -plaintext localhost:50051 \
  orchestrator.OrchestratorService/GetWorkerActivity
```

## 🐛 Debugging & Troubleshooting

### Common Issues

1. **Workers Not Registering**
   ```bash
   # Check orchestrator logs
   docker logs tensorfleet-orchestrator
   
   # Verify gRPC connectivity
   telnet orchestrator 50051
   ```

2. **Tasks Stuck in Queue**
   ```bash
   # Check Redis queue
   docker exec -it redis redis-cli
   > LLEN "job:queue:uuid"
   ```

3. **Job Timeout Issues**
   ```bash
   # Adjust timeout configuration
   export TASK_TIMEOUT=600s
   export WORKER_TIMEOUT=120s
   ```

## 🧪 Testing & Validation

```bash
# Run unit tests
go test ./...

# Integration tests
go test -tags=integration ./...

# gRPC service tests
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext localhost:50051 describe orchestrator.OrchestratorService

# Load testing
./scripts/load-test-orchestrator.sh
```

## � Dependencies

- **Go gRPC**: High-performance RPC framework
- **Redis**: Job queue and metadata storage
- **Protobuf**: Message serialization
- **UUID**: Unique identifier generation
- **Prometheus**: Metrics and monitoring

## � Related Services

- [API Gateway](../api-gateway/README.md) - HTTP/REST interface
- [Worker](../worker/README.md) - Task execution nodes
- [Monitoring](../monitoring/README.md) - System observability
- [Frontend](../frontend/README.md) - User interface
- **Redis**: Stores job metadata and task queues
- **Monitoring**: Collects orchestrator metrics

## 🛠️ Development

### Project Structure

```
orchestrator/
├── main.go              # Main service implementation
├── go.mod               # Go module dependencies
├── Dockerfile           # Container build configuration
└── proto/               # gRPC proto definitions (generated)
```

### Protocol Buffer Generation

```bash
# Generate gRPC stubs
cd ../proto
./generate.sh

# Manual generation
protoc --go_out=. --go-grpc_out=. orchestrator.proto
```

### Building

```bash
# Local build
go build -o orchestrator main.go

# Cross-platform builds
GOOS=linux GOARCH=amd64 go build -o orchestrator-linux main.go
GOOS=darwin GOARCH=arm64 go build -o orchestrator-darwin main.go
```

## 🐛 Debugging

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check Redis connectivity
   redis-cli -h redis -p 6379 ping
   ```

2. **gRPC Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :50051
   ```

3. **Worker Registration Failures**
   ```bash
   # Check worker logs
   docker logs tensorfleet-worker
   ```

### Logging

```bash
# Enable debug logging
export LOG_LEVEL=debug

# View logs in real-time
docker logs -f tensorfleet-orchestrator
```

## 🔒 Security

- **gRPC TLS**: Enable for production deployments
- **Authentication**: Implement JWT token validation
- **Authorization**: Role-based access control
- **Rate Limiting**: Prevent API abuse

## 📄 License

Part of the TensorFleet project - see root LICENSE file.

# 🌐 API Gateway Service

The API Gateway is the central entry point for the TensorFleet distributed ML training platform. It provides a unified RESTful HTTP interface that communicates with backend microservices via gRPC, handles authentication, job orchestration, and real-time monitoring with support for MongoDB Atlas and semantic model naming.

## 🚀 Overview

Built with **Go 1.21+** and **Gin framework**, this service acts as the intelligent proxy between the React frontend and distributed gRPC backend services. It provides comprehensive APIs for ML job lifecycle management, worker scaling, real-time monitoring, and integrates with MongoDB Atlas for persistent data storage.

### ✨ Recent Updates (Dec 2025)
- **MongoDB Atlas Integration**: Full cloud database support
- **Semantic Model Naming**: Clean, readable model names instead of UUID-based naming
- **Enhanced Job Management**: Improved job submission with better error handling
- **Real-time Worker Scaling**: Dynamic worker management with auto-scaling capabilities

## 🏗️ Architecture

```
┌─────────────┐     HTTP/REST     ┌──────────────┐     gRPC      ┌────────────────┐
│   Frontend  │◄─────────────────►│ API Gateway  │◄─────────────►│  Orchestrator  │
│  (React)    │                   │  (Go/Gin)    │               │   (Go/gRPC)    │
└─────────────┘                   └──────────────┘               └────────────────┘
                                         │
                                         ▼ Redis
                                  ┌──────────────┐
                                  │    Redis     │
                                  │  (Sessions)  │
                                  └──────────────┘
```

## 🔌 Key Features

- **RESTful API**: Complete HTTP/REST interface for all TensorFleet operations
- **gRPC Client**: Direct communication with orchestrator for real-time data
- **Job Management**: Submit, monitor, and manage ML training jobs
- **Worker Monitoring**: Real-time worker activity and resource usage
- **Authentication**: User session management and API authentication
- **Health Checks**: Service health monitoring and status reporting
- **CORS Support**: Cross-origin resource sharing for frontend integration

## 📡 API Endpoints

### Job Management
- `GET /api/v1/jobs` - List all jobs
- `POST /api/v1/jobs` - Create a new training job
- `GET /api/v1/jobs/:id` - Get job details
- `DELETE /api/v1/jobs/:id` - Delete a job

### Worker Monitoring
- `GET /worker-activity` - Real-time worker activity and status
- `GET /api/v1/workers` - List all workers
- `GET /api/v1/workers/:id` - Get specific worker details

### System Health
- `GET /health` - Service health check
- `GET /api/health` - Extended health information

### User Management
- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `GET /api/profile` - Get user profile

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `8080` |
| `ORCHESTRATOR_ADDRESS` | gRPC orchestrator endpoint | `localhost:50051` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password | `` |
| `GIN_MODE` | Gin framework mode | `debug` |
| `CORS_ORIGINS` | Allowed CORS origins | `*` |

### Example Configuration

```bash
export PORT=8080
export ORCHESTRATOR_ADDRESS=orchestrator:50051
export REDIS_HOST=redis
export REDIS_PORT=6379
export GIN_MODE=release
```

## 🚀 Running the Service

### Using Docker (Recommended)

```bash
# Build and run with docker-compose
docker-compose up api-gateway

# Or build separately
docker build -t tensorfleet-api-gateway .
docker run -p 8080:8080 \
  -e ORCHESTRATOR_ADDRESS=orchestrator:50051 \
  -e REDIS_HOST=redis \
  tensorfleet-api-gateway
```

### Local Development

```bash
# Install dependencies
go mod tidy

# Generate protobuf files (if needed)
protoc --go_out=. --go-grpc_out=. proto/*.proto

# Run the service
go run main.go
```

## 🔍 Health Monitoring

The API Gateway exposes several health check endpoints:

```bash
# Basic health check
curl http://localhost:8080/health

# Extended health with dependencies
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T21:30:00Z",
  "version": "1.0.0",
  "dependencies": {
    "orchestrator": "connected",
    "redis": "connected"
  }
}
```

## 🐛 Debugging

### Logging

The service uses structured logging with different levels:

```bash
# Enable debug logging
export GIN_MODE=debug

# View logs
docker logs tensorfleet-api-gateway
```

### Common Issues

1. **gRPC Connection Failed**
   ```bash
   # Check orchestrator connectivity
   curl http://localhost:8080/worker-activity
   ```

2. **Redis Connection Issues**
   ```bash
   # Test Redis connection
   docker exec -it redis redis-cli ping
   ```

3. **CORS Errors**
   ```bash
   # Check CORS configuration
   curl -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS http://localhost:8080/api/v1/jobs
   ```

## 📊 Metrics

The service collects and exposes various metrics:

- HTTP request counts and latencies
- gRPC connection status
- Redis connection health
- Active job counts
- Worker activity statistics

## 🔒 Security

- **Authentication**: JWT-based session management
- **CORS**: Configurable cross-origin policies
- **Rate Limiting**: Request rate limiting (configurable)
- **Input Validation**: Comprehensive request validation

## 🧪 Testing

```bash
# Run unit tests
go test ./...

# Run integration tests
go test -tags=integration ./...

# Test API endpoints
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{"model_type":"xgboost","dataset_path":"sample.csv"}'
```

## 📚 Dependencies

- **Gin**: HTTP web framework
- **gRPC**: Communication with backend services  
- **Redis**: Session storage and caching
- **UUID**: Unique identifier generation
- **Prometheus**: Metrics collection

## 🔄 Related Services

- [Orchestrator](../orchestrator/README.md) - Job scheduling and worker coordination
- [Worker](../worker/README.md) - ML task execution nodes
- [Frontend](../frontend/README.md) - React web interface
- [Monitoring](../monitoring/README.md) - System metrics and health

```bash
# Run unit tests
go test ./...

# Run with race detection
go test -race ./...

# Integration test
curl http://localhost:8080/health
```

## 🔗 Dependencies

- **Gin**: HTTP web framework
- **gRPC**: Service communication
- **Redis Client**: Caching layer
- **UUID**: Job ID generation
- **Prometheus**: Metrics collection

## 📖 Related Services

- **Orchestrator**: Receives gRPC calls for job management
- **Frontend**: Consumes REST API endpoints
- **Monitoring**: Aggregates metrics from this service
- **Redis**: Provides caching and session storage

## 🛠️ Development

### Project Structure

```
api-gateway/
├── main.go              # Main application entry point
├── go.mod               # Go module definition  
├── Dockerfile           # Container build instructions
├── main.py              # Python fallback (legacy)
├── requirements.txt     # Python dependencies (legacy)
└── proto/               # Generated gRPC stubs (auto-generated)
```

### Building

```bash
# Generate gRPC stubs (if proto files change)
cd ../proto && ./generate.sh

# Build for different architectures
GOOS=linux GOARCH=amd64 go build -o api-gateway-linux main.go
GOOS=darwin GOARCH=amd64 go build -o api-gateway-darwin main.go
```

## 📄 License

Part of the TensorFleet project - see root LICENSE file.

# 🚀 TensorFleet - Distributed ML Training Platform

TensorFleet is a production-ready distributed machine learning training platform that orchestrates ML workloads across multiple compute nodes using gRPC, microservices architecture, and Kubernetes.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Project Reproducibility Instructions](#project-reproducibility-instructions)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Kubernetes Deployment](#kubernetes-deployment)
- [API Documentation](#api-documentation)
- [Monitoring](#monitoring)
- [Project Structure](#project-structure)

## 🏗️ Architecture

```
┌─────────────┐      REST       ┌──────────────┐     gRPC      ┌────────────────┐
│   Frontend  │◄────────────────►│ API Gateway  │◄──────────────►│  Orchestrator  │
│  (React)    │                  │  (Go/HTTP)   │                │   (Go/gRPC)    │
└─────────────┘                  └──────────────┘                └────────────────┘
                                                                         │ gRPC
                                                                         ▼
                                                              ┌────────────────────┐
                                                              │   Worker Nodes     │
                                                              │   (Go/gRPC)        │
                                                              │  - Training Tasks  │
                                                              │  - Metrics Export  │
                                                              └────────────────────┘
                                                                         │
                      ┌──────────────────┬────────────────┬─────────────┴──────┐
                      ▼                  ▼                ▼                    ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
            │    Redis     │   │    MinIO     │   │  Monitoring  │   │  Prometheus  │
            │  (Metadata)  │   │  (Storage)   │   │   (Flask)    │   │  (Metrics)   │
            └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

### Components

1. **API Gateway** (Go + Gin) - REST API for job submission, authentication, and routing
2. **Orchestrator** (Go + gRPC) - Coordinates distributed training, task scheduling
3. **Worker** (Go + gRPC) - Executes training tasks, reports metrics
4. **ML Worker** (Python + Flask) - Machine learning training with MongoDB integration
5. **Model Service** (Python + Flask) - Model management, download, and metadata APIs
6. **Storage** (Python + Flask) - S3-compatible object storage for models/datasets
7. **Monitoring** (Python + Flask) - Metrics aggregation and health checks
8. **Frontend** (React + Material-UI) - Web interface for job management
9. **MongoDB** - NoSQL database for datasets and trained model persistence
10. **Redis** - Job metadata and task queue management
11. **MinIO** - S3-compatible object storage for large files

## ✨ Features

### Core Functionality
- ✅ **Distributed Training** - Split ML workloads across multiple worker nodes
- ✅ **MongoDB Integration** - Dataset storage and trained model persistence with GridFS
- ✅ **Model Management** - Download, version, and manage trained ML models
- ✅ **ML Algorithms** - Support for RandomForest, LogisticRegression, SVM, DecisionTree
- ✅ **gRPC Communication** - High-performance inter-service communication
- ✅ **Task Queuing** - Orchestrator manages task distribution
- ✅ **Auto-scaling** - Kubernetes HPA for worker nodes
- ✅ **Object Storage** - MinIO for models, datasets, and checkpoints
- ✅ **Real-time Metrics** - Prometheus + Grafana monitoring
- ✅ **Health Checks** - Liveness and readiness probes
- ✅ **Horizontal Scaling** - Workers scale from 2-10 pods

### Production Features
- 🔒 **Secure Defaults** - No hardcoded credentials
- 📊 **Observability** - Structured logging, metrics, traces
- 🐳 **Containerized** - Docker images for all services
- ☸️ **Kubernetes-native** - Complete K8s manifests
- 🔄 **High Availability** - Stateful sets for infrastructure
- 🎯 **Load Balancing** - Service discovery and routing

## 📦 Prerequisites

### Local Development
- Docker 20.10+
- Docker Compose 2.0+
- Go 1.21+ (for proto generation)
- Node.js 16+ (for frontend development)

### Kubernetes Deployment
- Kubernetes cluster 1.24+
- kubectl configured
- Helm 3.0+ (optional, for Prometheus/Grafana)
- Container registry access (Docker Hub, GitHub Container Registry, etc.)

## � Project Reproducibility Instructions

### System Requirements
Ensure your system meets the following requirements for consistent reproduction:

**Hardware:**
- Minimum: 4 GB RAM, 2 CPU cores
- Recommended: 8 GB RAM, 4 CPU cores
- Disk Space: 5 GB free space

**Operating System:**
- macOS 10.15+ / Ubuntu 18.04+ / Windows 10+ with WSL2
- Docker Desktop or Docker Engine installed and running

### Step-by-Step Reproduction Guide

#### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-username/TensorFleet.git
cd TensorFleet

# Verify Docker installation
docker --version
docker-compose --version

# Ensure Docker is running
docker ps
```

#### 2. Build Protocol Buffers (Optional)

```bash
# Install Protocol Buffer compiler (if modifying .proto files)
# macOS
brew install protobuf protoc-gen-go protoc-gen-go-grpc

# Ubuntu
sudo apt-get install -y protobuf-compiler
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate proto files (only if modified)
cd proto && ./generate.sh && cd ..
```

#### 3. Initial Setup & Validation

```bash
# Pull all required Docker images
docker-compose pull

# Build all services (this may take 5-10 minutes on first run)
docker-compose build

# Verify all images are built
docker images | grep tensorfleet
```

#### 4. Start the Platform

```bash
# Start all services
docker-compose up -d

# Wait for all services to be healthy (30-60 seconds)
# You should see all services as "healthy"
docker-compose ps

# Verify health status
curl http://localhost:8080/health  # API Gateway
curl http://localhost:8081/health  # Storage Service  
curl http://localhost:8082/health  # Monitoring Service
```

#### 5. Smoke Test - Verify Everything Works

```bash
# Run the automated demo (tests all endpoints)
./quick-api-demo.sh

# Expected output should show:
# ✓ All services healthy
# ✓ Storage operations working
# ✓ Job submission and monitoring working
# ✓ Metrics collection working
```

#### 6. Access Web Interfaces

Open these URLs in your browser:
- **Frontend Dashboard**: http://localhost:3000
- **Grafana Monitoring**: http://localhost:3001 (admin/admin)
- **Prometheus Metrics**: http://localhost:9090
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

### Troubleshooting Common Issues

#### Issue: Services fail to start
```bash
# Check logs for specific service
docker-compose logs <service-name>

# Common solutions:
# 1. Restart Docker Desktop
# 2. Clear Docker cache: docker system prune -a
# 3. Check port conflicts: lsof -i :8080
```

#### Issue: "Connection refused" errors
```bash
# Wait for health checks to pass
watch docker-compose ps

# Services need 30-60 seconds to fully initialize
# Redis and MinIO must be healthy before other services start
```

#### Issue: Port conflicts
```bash
# Check what's using the ports
lsof -i :3000 -i :8080 -i :8081 -i :8082 -i :9000 -i :9001

# Stop conflicting services or modify docker-compose.yml ports
```

#### Issue: Out of disk space
```bash
# Clean up Docker resources
docker system prune -a --volumes

# Remove old containers and images
docker container prune
docker image prune -a
```

### Reproducible Demo Scenarios

#### Scenario 1: Submit and Monitor Training Job
```bash
# Submit a ResNet50 training job
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "resnet50",
    "dataset_path": "s3://tensorfleet/datasets/imagenet",
    "hyperparameters": {"learning_rate": "0.001"},
    "num_workers": 3,
    "epochs": 10
  }'

# Monitor progress in real-time
# Save the job_id from above response, then:
watch -n 2 "curl -s http://localhost:8080/api/v1/jobs/YOUR_JOB_ID | jq"
```

#### Scenario 2: Upload and Download Files
```bash
# Create a sample dataset
echo "epoch,loss,accuracy" > sample_dataset.csv
echo "1,2.5,0.3" >> sample_dataset.csv
echo "2,1.8,0.5" >> sample_dataset.csv

# Upload to storage
curl -X POST http://localhost:8081/api/v1/upload/datasets/sample.csv \
  -F "file=@sample_dataset.csv"

# List files
curl http://localhost:8081/api/v1/list/datasets | jq

# Download file
curl http://localhost:8081/api/v1/download/datasets/sample.csv
```

#### Scenario 3: View Monitoring Dashboard
1. Open http://localhost:3001 in browser
2. Login with admin/admin
3. Navigate to "TensorFleet Dashboard"
4. Submit some jobs and watch metrics update

### Environment Variables for Customization

Create a `.env` file to customize settings:
```bash
# Optional: Customize ports
API_GATEWAY_PORT=8080
STORAGE_PORT=8081
MONITORING_PORT=8082
FRONTEND_PORT=3000

# Optional: Customize MinIO credentials
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=password123

# Optional: Worker scaling
WORKER_REPLICAS=3
```

### Data Persistence

All data is persisted in Docker volumes:
```bash
# View volumes
docker volume ls | grep tensorfleet

# To reset all data (WARNING: destroys all jobs/files)
docker-compose down -v

# To backup data
docker run --rm -v tensorfleet_minio_data:/data -v $(pwd):/backup ubuntu tar czf /backup/minio_backup.tar.gz /data
```

### Cleanup Instructions

```bash
# Stop all services
docker-compose down

# Remove all data (optional)
docker-compose down -v

# Clean up Docker resources
docker system prune -a

# Remove built images
docker rmi $(docker images | grep tensorfleet | awk '{print $3}')
```

### Testing Reproducibility

To verify the setup works on a clean system:
```bash
# Test script for CI/CD or clean environment
#!/bin/bash
set -e

echo "Testing TensorFleet reproducibility..."
docker-compose up -d
sleep 60  # Wait for services to initialize

# Test health endpoints
curl -f http://localhost:8080/health
curl -f http://localhost:8081/health  
curl -f http://localhost:8082/health

# Test job submission
JOB_ID=$(curl -s -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{"model_type":"test","dataset_path":"test","num_workers":1,"epochs":1}' | jq -r .job_id)

# Verify job was created
curl -f "http://localhost:8080/api/v1/jobs/$JOB_ID"

echo "✅ Reproducibility test passed!"
```

## �🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd TensorFleet
```

### 2. Generate gRPC Stubs

```bash
make proto
```

### 3. Run Locally with Docker Compose

```bash
# Build and start all services
make compose-up

# Or manually:
docker-compose up --build
```

### 4. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| API Gateway | http://localhost:8080 | - |
| Storage API | http://localhost:8081 | - |
| Monitoring API | http://localhost:8082 | - |
| Model Service API | http://localhost:8083 | - |
| ML Worker API | http://localhost:8000 | - |
| Grafana | http://localhost:3001 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| MinIO Console | http://localhost:9001 | minioadmin/minioadmin |
| MongoDB | localhost:27017 | admin/password123 |

## 💻 Local Development

### Start Services

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
make compose-down
```

### Submit a Training Job

```bash
# Using curl
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user" \
  -d '{
    "model_type": "cnn",
    "dataset_path": "/data/mnist",
    "num_workers": 3,
    "epochs": 10,
    "hyperparameters": {
      "learning_rate": "0.001",
      "batch_size": "64"
    }
  }'

# Response
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RUNNING",
  "num_tasks": 100,
  "message": "Job created with 100 tasks"
}
```

### Check Job Status

```bash
curl http://localhost:8080/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000
```

### View Metrics

```bash
# Dashboard metrics
curl http://localhost:8082/api/v1/dashboard

# Prometheus metrics
curl http://localhost:8082/metrics
```

## 🤖 MongoDB ML Training

TensorFleet now supports machine learning training with MongoDB for dataset storage and model persistence.

### Quick ML Training Demo

```bash
# Run the automated ML training demo
./demo-mongodb-ml.sh
```

This demo will:
1. ✅ Train 3 different ML models (RandomForest, LogisticRegression, SVM)
2. ✅ Store trained models in MongoDB using GridFS
3. ✅ Save model metadata (hyperparameters, metrics, version)
4. ✅ Download and save models locally
5. ✅ Display model statistics

### Manual ML Training

#### 1. List Available Datasets

```bash
curl http://localhost:8000/datasets | jq
```

**Response:**
```json
{
  "datasets": [
    {
      "name": "iris",
      "description": "Iris flower dataset",
      "n_samples": 150,
      "n_features": 4,
      "target_column": "species"
    },
    {
      "name": "wine",
      "description": "Wine classification dataset",
      "n_samples": 178,
      "n_features": 13,
      "target_column": "wine_class"
    }
  ]
}
```

#### 2. Train a Model

```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "my_training_job_001",
    "dataset_name": "iris",
    "algorithm": "random_forest",
    "target_column": "species",
    "model_name": "iris_rf_model",
    "hyperparameters": {
      "n_estimators": 100,
      "max_depth": 5,
      "random_state": 42
    }
  }' | jq
```

**Response:**
```json
{
  "job_id": "my_training_job_001",
  "model_id": "507f1f77bcf86cd799439011",
  "status": "completed",
  "metrics": {
    "train_accuracy": 0.9833,
    "test_accuracy": 0.9667,
    "training_time": 0.234
  },
  "model_name": "iris_rf_model",
  "version": "v1701964800"
}
```

#### 3. List Trained Models

```bash
curl "http://localhost:8083/api/v1/models?page=1&limit=10" | jq
```

**Response:**
```json
{
  "models": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "iris_rf_model",
      "algorithm": "random_forest",
      "metrics": {
        "test_accuracy": 0.9667,
        "train_accuracy": 0.9833
      },
      "version": "v1701964800",
      "created_at": "2025-12-07T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### 4. Get Model Metadata

```bash
curl http://localhost:8083/api/v1/models/<model_id> | jq
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "iris_rf_model",
  "algorithm": "random_forest",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 5,
    "random_state": 42
  },
  "metrics": {
    "train_accuracy": 0.9833,
    "test_accuracy": 0.9667,
    "training_time": 0.234
  },
  "version": "v1701964800",
  "dataset_name": "iris",
  "target_column": "species",
  "features": ["sepal length", "sepal width", "petal length", "petal width"],
  "created_at": "2025-12-07T10:30:00Z"
}
```

#### 5. Download a Model

```bash
# Download model file
curl http://localhost:8083/api/v1/models/<model_id>/download \
  -o my_model.pkl

# Verify download
ls -lh my_model.pkl
```

#### 6. Use Downloaded Model (Python)

```python
import pickle
import numpy as np

# Load the model
with open('my_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Make predictions
sample_data = np.array([[5.1, 3.5, 1.4, 0.2]])
prediction = model.predict(sample_data)
print(f"Prediction: {prediction}")
```

### Supported ML Algorithms

| Algorithm | Description | Best For |
|-----------|-------------|----------|
| `random_forest` | Random Forest Classifier | Classification, robust to overfitting |
| `logistic_regression` | Logistic Regression | Binary/multi-class classification |
| `svm` | Support Vector Machine | Non-linear classification |
| `decision_tree` | Decision Tree Classifier | Interpretable models |

### Model Hyperparameters

**Random Forest:**
```json
{
  "n_estimators": 100,
  "max_depth": null,
  "min_samples_split": 2,
  "random_state": 42
}
```

**Logistic Regression:**
```json
{
  "max_iter": 1000,
  "C": 1.0,
  "random_state": 42
}
```

**SVM:**
```json
{
  "kernel": "rbf",
  "C": 1.0,
  "gamma": "scale",
  "random_state": 42
}
```

**Decision Tree:**
```json
{
  "max_depth": null,
  "min_samples_split": 2,
  "random_state": 42
}
```

### Python Client for ML Operations

Use the provided Python client for easy interaction:

```bash
# Run complete demo
python ml_client.py demo

# List all models
python ml_client.py list

# Get statistics
python ml_client.py stats

# Download a specific model
python ml_client.py download <model_id> output.pkl
```

### Model Storage Architecture

- **Datasets**: Stored in MongoDB collections or GridFS for large files
- **Trained Models**: Serialized with pickle and stored in GridFS
- **Metadata**: Model information stored in MongoDB collections
  - Model name, algorithm, hyperparameters
  - Training metrics (accuracy, loss)
  - Version information
  - Dataset reference
  - Feature names
  - Training timestamp

### Model Versioning

Each trained model is automatically versioned using a timestamp:
- Format: `v{unix_timestamp}`
- Example: `v1701964800`
- Allows multiple versions of the same model
- Easy rollback to previous versions

## ☸️ Kubernetes Deployment

### 1. Build and Push Images

```bash
# Set your registry
export REGISTRY=ghcr.io/your-username/tensorfleet

# Build all images
make build

# Push to registry
make push
```

### 2. Update Image References

Edit `k8s/*.yaml` files and replace `ghcr.io/your-username/tensorfleet` with your actual registry.

### 3. Deploy to Kubernetes

```bash
# Deploy everything
make k8s-deploy

# Or step-by-step:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/infrastructure.yaml
kubectl apply -f k8s/orchestrator.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/storage.yaml
kubectl apply -f k8s/monitoring.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

### 4. Verify Deployment

```bash
# Check all pods
kubectl get pods -n tensorfleet

# Check services
kubectl get svc -n tensorfleet

# View logs
make logs

# Or specific service:
kubectl logs -n tensorfleet -l app=orchestrator -f
```

### 5. Access Services

```bash
# Get API Gateway external IP
kubectl get svc -n tensorfleet api-gateway-service

# Get Frontend external IP
kubectl get svc -n tensorfleet frontend-service

# Port-forward for local access
kubectl port-forward -n tensorfleet svc/api-gateway-service 8080:80
kubectl port-forward -n tensorfleet svc/frontend-service 3000:80
```

## 📚 API Documentation

### Job Submission

**POST** `/api/v1/jobs`

Request:
```json
{
  "model_type": "cnn",
  "dataset_path": "/data/mnist",
  "num_workers": 2,
  "epochs": 10,
  "hyperparameters": {
    "learning_rate": "0.001",
    "batch_size": "64"
  }
}
```

Response:
```json
{
  "job_id": "uuid",
  "status": "RUNNING",
  "num_tasks": 50,
  "message": "Job created successfully"
}
```

### Job Status

**GET** `/api/v1/jobs/:id`

Response:
```json
{
  "job_id": "uuid",
  "status": "RUNNING",
  "progress": 45,
  "completed_tasks": 23,
  "total_tasks": 50,
  "current_loss": 0.234,
  "current_accuracy": 0.897
}
```

### Storage API

**POST** `/api/v1/upload/:bucket/:path`
- Upload file to storage

**GET** `/api/v1/download/:bucket/:path`
- Download file from storage

**GET** `/api/v1/list/:bucket`
- List all objects in bucket

### MongoDB ML APIs

#### Train Model
**POST** `/train` (ML Worker - Port 8000)

Request:
```json
{
  "job_id": "unique_job_id",
  "dataset_name": "iris",
  "algorithm": "random_forest",
  "target_column": "species",
  "model_name": "my_model",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 5
  }
}
```

Response:
```json
{
  "job_id": "unique_job_id",
  "model_id": "507f1f77bcf86cd799439011",
  "status": "completed",
  "metrics": {
    "train_accuracy": 0.98,
    "test_accuracy": 0.96
  }
}
```

#### List Models
**GET** `/api/v1/models?page=1&limit=20&algorithm=random_forest` (Model Service - Port 8083)

Response:
```json
{
  "models": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Model Metadata
**GET** `/api/v1/models/:model_id` (Model Service - Port 8083)

#### Download Model
**GET** `/api/v1/models/:model_id/download` (Model Service - Port 8083)

Returns: Binary model file (pickle format)

#### Delete Model
**DELETE** `/api/v1/models/:model_id` (Model Service - Port 8083)

#### Get Statistics
**GET** `/api/v1/statistics` (Model Service - Port 8083)

Response:
```json
{
  "total_models": 45,
  "algorithm_stats": [
    {
      "_id": "random_forest",
      "count": 20,
      "avg_accuracy": 0.95
    }
  ],
  "recent_models": [...]
}
```

## 📊 Monitoring

### Prometheus Metrics

Worker metrics (`:2112/metrics`):
- `worker_task_duration_seconds` - Task execution time
- `worker_tasks_completed_total` - Completed tasks counter
- `worker_tasks_failed_total` - Failed tasks counter

Monitoring service metrics (`:8082/metrics`):
- `tensorfleet_job_submissions_total` - Total job submissions
- `tensorfleet_active_jobs` - Currently active jobs
- `tensorfleet_active_workers` - Active worker nodes
- `tensorfleet_training_loss` - Training loss by job_id
- `tensorfleet_training_accuracy` - Training accuracy by job_id

### Grafana Dashboards

Access Grafana at `http://localhost:3001` (admin/admin) to view:
- System overview dashboard
- Worker node metrics
- Training progress visualization

## 📁 Project Structure

```
tensorfleet/
├── api-gateway/          # REST API gateway (Go)
│   ├── main.go
│   ├── go.mod
│   ├── Dockerfile
│   └── proto/           # Generated gRPC stubs
├── orchestrator/         # Job orchestrator (Go)
│   ├── main.go
│   ├── go.mod
│   ├── Dockerfile
│   └── proto/
├── worker/               # Training worker (Go)
│   ├── main.go
│   ├── go.mod
│   ├── Dockerfile
│   └── proto/
├── worker-ml/            # ML training worker (Python)
│   ├── main.py          # ML training logic
│   ├── api_server.py    # Flask API server
│   ├── requirements.txt
│   └── Dockerfile
├── model-service/        # Model management service (Python)
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── storage/              # Object storage service (Python)
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── monitoring/           # Metrics service (Python)
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # Web UI (React)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── proto/                # Protocol buffer definitions
│   ├── gateway.proto
│   ├── orchestrator.proto
│   ├── worker.proto
│   └── generate.sh
├── k8s/                  # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── infrastructure.yaml
│   ├── mongodb-ml.yaml
│   ├── api-gateway.yaml
│   ├── orchestrator.yaml
│   ├── worker.yaml
│   ├── storage.yaml
│   ├── monitoring.yaml
│   ├── frontend.yaml
│   └── ingress.yaml
├── ml_client.py         # Python client for ML operations
├── demo-mongodb-ml.sh   # MongoDB ML training demo
├── docker-compose.yml   # Local development
├── Makefile             # Build automation
└── README.md            # This file
```

## 🛠️ Development

### Running Individual Services

```bash
# API Gateway
cd api-gateway && go run main.go

# Orchestrator
cd orchestrator && go run main.go

# Worker
cd worker && go run main.go

# Storage
cd storage && python main.py

# Monitoring
cd monitoring && python main.py

# Frontend
cd frontend && npm start
```

### Testing

```bash
# Unit tests (Go services)
cd api-gateway && go test ./...
cd orchestrator && go test ./...
cd worker && go test ./...

# Integration tests
./scripts/integration-test.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## � Additional Documentation

- **[MongoDB ML Setup Guide](MONGODB_ML_GUIDE.md)** - Complete setup and deployment guide
- **[MongoDB ML Summary](MONGODB_ML_SUMMARY.md)** - Summary of MongoDB integration
- **[Quick Reference](QUICK_REFERENCE.md)** - Command reference card
- **[Demo README](DEMO_README.md)** - API demo scripts documentation

## �📞 Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [repository-url]/wiki

---

**Built with ❤️ using Go, Python, gRPC, MongoDB, and modern DevOps practices**


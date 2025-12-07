# TensorFleet MongoDB ML Integration - Complete Setup Guide

## 📋 Overview

This guide provides step-by-step instructions to build, deploy, and run TensorFleet with MongoDB integration for ML model training and persistence.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TensorFleet Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │   API    │    │   Orchestr│    │  Worker  │    │  Frontend│    │
│  │ Gateway  │◄──►│  -ator   │◄──►│  (Go)    │    │  (React) │    │
│  │  (Go)    │    │  (Go)    │    │          │    │          │    │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    │
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │  ML      │    │  Model   │    │ Storage  │    │Monitoring│    │
│  │ Worker   │    │ Service  │    │  Service │    │  Service │    │
│  │ (Python) │    │ (Python) │    │ (Python) │    │ (Python) │    │
│  └────┬─────┘    └────┬─────┘    └──────────┘    └──────────┘    │
│       │               │                                             │
└───────┼───────────────┼─────────────────────────────────────────────┘
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐
│   MongoDB    │  │    Redis     │  │    MinIO     │  │Prometheus│
│  (Datasets   │  │  (Metadata)  │  │  (Storage)   │  │(Metrics) │
│  & Models)   │  │              │  │              │  │          │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Verify Docker installation
docker --version  # Should be 20.10+
docker-compose --version  # Should be 2.0+

# Ensure Docker is running
docker ps
```

### 2. Clone and Build

```bash
# Clone repository
git clone https://github.com/your-username/TensorFleet.git
cd TensorFleet

# Build all services
docker-compose build

# This will build:
# - MongoDB (pulled from Docker Hub)
# - ML Worker service
# - Model Service
# - All existing services
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Wait for services to be healthy (30-60 seconds)
docker-compose ps

# Check service health
curl http://localhost:8000/health  # ML Worker
curl http://localhost:8083/health  # Model Service
curl http://localhost:8080/health  # API Gateway
```

### 4. Run ML Training Demo

```bash
# Make script executable
chmod +x demo-mongodb-ml.sh

# Run the demo
./demo-mongodb-ml.sh
```

## 📦 Detailed Component Setup

### MongoDB Setup

**Docker Compose (Local Development):**
```yaml
mongodb:
  image: mongo:7.0
  ports:
    - "27017:27017"
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD=password123
    - MONGO_INITDB_DATABASE=tensorfleet
  volumes:
    - mongodb_data:/data/db
```

**Connection String:**
```
mongodb://admin:password123@localhost:27017/tensorfleet?authSource=admin
```

**Sample Datasets:**
- Iris Dataset (150 samples, 4 features)
- Wine Dataset (178 samples, 13 features)
- Auto-loaded on ML Worker startup

### ML Worker Service

**Location:** `worker-ml/`

**Features:**
- Train ML models (RandomForest, LogisticRegression, SVM, DecisionTree)
- Fetch datasets from MongoDB
- Save trained models to MongoDB GridFS
- Store model metadata with versioning
- Prometheus metrics export

**API Endpoints:**
- `POST /train` - Submit training job
- `GET /datasets` - List available datasets
- `GET /algorithms` - List supported algorithms
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

**Environment Variables:**
```bash
MONGODB_URL=mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin
MONGODB_DB=tensorfleet
PORT=8000
```

### Model Service

**Location:** `model-service/`

**Features:**
- List trained models with pagination
- Get model metadata
- Download models for deployment
- Delete models
- Model statistics and analytics

**API Endpoints:**
- `GET /api/v1/models` - List models
- `GET /api/v1/models/:id` - Get model metadata
- `GET /api/v1/models/:id/download` - Download model
- `DELETE /api/v1/models/:id` - Delete model
- `GET /api/v1/statistics` - Get statistics
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

**Environment Variables:**
```bash
MONGODB_URL=mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin
MONGODB_DB=tensorfleet
PORT=8083
```

## 🔧 Build Instructions

### Building Individual Services

```bash
# Build ML Worker
cd worker-ml
docker build -t tensorfleet-worker-ml:latest .

# Build Model Service
cd model-service
docker build -t tensorfleet-model-service:latest .
```

### Building All Services

```bash
# From project root
docker-compose build

# Or build specific service
docker-compose build worker-ml
docker-compose build model-service
```

## ☸️ Kubernetes Deployment

### 1. Prepare Kubernetes Cluster

```bash
# Ensure kubectl is configured
kubectl cluster-info

# Create namespace
kubectl create namespace tensorfleet
```

### 2. Update ConfigMap

```bash
# Edit k8s/configmap.yaml with your MongoDB credentials
kubectl apply -f k8s/configmap.yaml
```

### 3. Deploy Infrastructure

```bash
# Deploy MongoDB and other infrastructure
kubectl apply -f k8s/infrastructure.yaml
kubectl apply -f k8s/mongodb-ml.yaml

# Wait for MongoDB to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n tensorfleet --timeout=300s
```

### 4. Deploy Application Services

```bash
# Deploy all services
kubectl apply -f k8s/orchestrator.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/storage.yaml
kubectl apply -f k8s/monitoring.yaml
kubectl apply -f k8s/frontend.yaml

# The mongodb-ml.yaml includes ML Worker and Model Service
# Already applied in step 3
```

### 5. Verify Deployment

```bash
# Check all pods
kubectl get pods -n tensorfleet

# Check services
kubectl get svc -n tensorfleet

# View logs
kubectl logs -n tensorfleet -l app=worker-ml -f
kubectl logs -n tensorfleet -l app=model-service -f
```

### 6. Access Services

```bash
# Port-forward Model Service
kubectl port-forward -n tensorfleet svc/model-service 8083:8083

# Port-forward ML Worker
kubectl port-forward -n tensorfleet svc/worker-ml-service 8000:8000

# Access from local machine
curl http://localhost:8083/api/v1/models
curl http://localhost:8000/datasets
```

## 🧪 Testing the System

### Test 1: Train a Model

```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "test_job_001",
    "dataset_name": "iris",
    "algorithm": "random_forest",
    "target_column": "species",
    "model_name": "test_iris_model",
    "hyperparameters": {
      "n_estimators": 100,
      "max_depth": 5,
      "random_state": 42
    }
  }'
```

Expected output:
```json
{
  "job_id": "test_job_001",
  "model_id": "507f1f77bcf86cd799439011",
  "status": "completed",
  "metrics": {
    "train_accuracy": 0.9833,
    "test_accuracy": 0.9667,
    "training_time": 0.234
  }
}
```

### Test 2: List Models

```bash
curl http://localhost:8083/api/v1/models | jq
```

### Test 3: Download Model

```bash
# Get model_id from previous step
MODEL_ID="507f1f77bcf86cd799439011"

curl http://localhost:8083/api/v1/models/${MODEL_ID}/download \
  -o downloaded_model.pkl

# Verify download
ls -lh downloaded_model.pkl
```

### Test 4: Use Model

```python
import pickle
import numpy as np

# Load model
with open('downloaded_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Make prediction
sample = np.array([[5.1, 3.5, 1.4, 0.2]])
prediction = model.predict(sample)
print(f"Prediction: {prediction}")
```

## 📊 Monitoring

### Prometheus Metrics

**ML Worker Metrics (port 8000):**
```
worker_task_duration_seconds - Training duration
worker_tasks_completed_total - Completed jobs
worker_tasks_failed_total - Failed jobs
worker_model_accuracy{job_id, model_type} - Model accuracy
worker_models_trained_total{model_type} - Total trained models
```

**Model Service Metrics (port 8083):**
```
model_downloads_total{model_id} - Download count per model
model_listings_total - List requests
api_requests_total{endpoint, method} - API request count
request_duration_seconds{endpoint} - Request latency
```

### Accessing Metrics

```bash
# ML Worker metrics
curl http://localhost:8000/metrics

# Model Service metrics
curl http://localhost:8083/metrics

# View in Prometheus
open http://localhost:9090
```

### Grafana Dashboards

```bash
# Access Grafana
open http://localhost:3001

# Login: admin/admin

# Import dashboard for ML metrics
```

## 🔍 Troubleshooting

### Issue: MongoDB connection failed

```bash
# Check MongoDB is running
docker ps | grep mongodb

# Check MongoDB logs
docker logs tensorfleet-mongodb

# Test MongoDB connection
docker exec -it tensorfleet-mongodb mongosh \
  -u admin -p password123 --authenticationDatabase admin
```

### Issue: ML Worker not starting

```bash
# Check logs
docker logs tensorfleet-worker-ml

# Common issues:
# 1. MongoDB not ready - wait 30 seconds
# 2. Missing Python dependencies - rebuild image
# 3. Port conflict - check port 8000

# Restart service
docker-compose restart worker-ml
```

### Issue: Model download fails

```bash
# Check model exists
curl http://localhost:8083/api/v1/models/<model_id>

# Check Model Service logs
docker logs tensorfleet-model-service

# Verify MongoDB GridFS
docker exec -it tensorfleet-mongodb mongosh \
  -u admin -p password123 --authenticationDatabase admin \
  tensorfleet --eval "db.fs.files.find().pretty()"
```

## 🧹 Cleanup

```bash
# Stop all services
docker-compose down

# Remove all data (WARNING: destroys all models and datasets)
docker-compose down -v

# Remove built images
docker rmi tensorfleet-worker-ml tensorfleet-model-service

# Kubernetes cleanup
kubectl delete namespace tensorfleet
```

## 📝 Notes

- **Model Storage**: Models stored in MongoDB GridFS (supports files >16MB)
- **Dataset Limit**: Recommended max dataset size: 100MB in MongoDB
- **Large Datasets**: Use MinIO for datasets >100MB
- **Model Versioning**: Automatic versioning using timestamps
- **Backup**: Use MongoDB backup tools for model persistence

## 🎯 Next Steps

1. **Integrate with API Gateway**: Connect ML Worker to orchestrator
2. **Add Authentication**: Secure model downloads
3. **Implement Model Registry**: Centralized model catalog
4. **Add Model Evaluation**: Automated model testing
5. **Create Frontend UI**: Web interface for model management
6. **Add Dataset Upload**: API for custom dataset upload
7. **Implement Model Serving**: Deploy models for inference

## 📚 Additional Resources

- [MongoDB GridFS Documentation](https://docs.mongodb.com/manual/core/gridfs/)
- [Scikit-learn Model Persistence](https://scikit-learn.org/stable/model_persistence.html)
- [Prometheus Monitoring](https://prometheus.io/docs/introduction/overview/)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)

---

**Built with ❤️ for distributed ML training**

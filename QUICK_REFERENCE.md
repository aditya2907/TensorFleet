# TensorFleet MongoDB ML - Quick Reference Card

## 🚀 Quick Commands

### Start Services
```bash
docker-compose up -d
```

### Run Demo
```bash
./demo-mongodb-ml.sh
```

### Train Model
```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job_001",
    "dataset_name": "iris",
    "algorithm": "random_forest",
    "model_name": "my_model"
  }'
```

### List Models
```bash
curl http://localhost:8083/api/v1/models | jq
```

### Download Model
```bash
curl http://localhost:8083/api/v1/models/{model_id}/download -o model.pkl
```

## 📊 Service Ports

| Service | Port | URL |
|---------|------|-----|
| ML Worker | 8000 | http://localhost:8000 |
| Model Service | 8083 | http://localhost:8083 |
| MongoDB | 27017 | mongodb://admin:password123@localhost:27017 |
| API Gateway | 8080 | http://localhost:8080 |
| Frontend | 3000 | http://localhost:3000 |
| Grafana | 3001 | http://localhost:3001 |

## 🔧 Supported Algorithms

- `random_forest` - Best for: Classification, robust
- `logistic_regression` - Best for: Simple classification  
- `svm` - Best for: Non-linear classification
- `decision_tree` - Best for: Interpretable models

## 📚 Available Datasets

- `iris` - 150 samples, 4 features, 3 classes
- `wine` - 178 samples, 13 features, 3 classes

## 🎯 Common Tasks

### 1. Train Random Forest on Iris
```bash
curl -X POST http://localhost:8000/train -H "Content-Type: application/json" -d '{"job_id":"rf_iris","dataset_name":"iris","algorithm":"random_forest","model_name":"iris_rf"}'
```

### 2. Get Model Stats
```bash
curl http://localhost:8083/api/v1/statistics | jq
```

### 3. List Datasets
```bash
curl http://localhost:8000/datasets | jq
```

### 4. Check Health
```bash
curl http://localhost:8000/health
curl http://localhost:8083/health
```

## 🐍 Python Client

```bash
# Run full demo
python ml_client.py demo

# List models
python ml_client.py list

# Get stats
python ml_client.py stats

# Download model
python ml_client.py download <model_id> output.pkl
```

## 📦 Docker Commands

```bash
# View logs
docker logs tensorfleet-worker-ml
docker logs tensorfleet-model-service
docker logs tensorfleet-mongodb

# Restart service
docker-compose restart worker-ml

# Stop all
docker-compose down

# Remove all data
docker-compose down -v
```

## ☸️ Kubernetes Commands

```bash
# Deploy
kubectl apply -f k8s/

# Check status
kubectl get pods -n tensorfleet

# Port forward
kubectl port-forward -n tensorfleet svc/model-service 8083:8083

# Logs
kubectl logs -n tensorfleet -l app=worker-ml -f
```

## 📊 Metrics Endpoints

```bash
curl http://localhost:8000/metrics  # ML Worker
curl http://localhost:8083/metrics  # Model Service
curl http://localhost:9090          # Prometheus
```

## 🔍 Troubleshooting

```bash
# Check MongoDB
docker exec -it tensorfleet-mongodb mongosh -u admin -p password123

# Check services
docker-compose ps

# View all logs
docker-compose logs -f
```

## 📝 Model Training Template

```json
{
  "job_id": "unique_job_id",
  "dataset_name": "iris|wine",
  "algorithm": "random_forest|logistic_regression|svm|decision_tree",
  "target_column": "auto-detected",
  "model_name": "my_model_name",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 5,
    "random_state": 42
  }
}
```

## 🎓 Response Examples

### Training Response
```json
{
  "job_id": "job_001",
  "model_id": "507f...",
  "status": "completed",
  "metrics": {
    "test_accuracy": 0.96
  }
}
```

### Model List Response
```json
{
  "models": [{
    "id": "507f...",
    "name": "my_model",
    "algorithm": "random_forest",
    "metrics": {"test_accuracy": 0.96}
  }],
  "pagination": {"page": 1, "total": 10}
}
```

---

**Keep this card handy for quick reference! 📌**

# 🧠 Model Service

The Model Service provides comprehensive model registry and lifecycle management for TensorFleet, offering secure model storage, metadata management, version control, and distribution capabilities with MongoDB GridFS integration.

## 🚀 Overview

This service acts as the central model repository for TensorFleet, managing trained ML models from creation to deployment. It provides APIs for model registration, metadata management, secure downloads, versioning, and analytics with seamless integration to MongoDB for scalable storage.

## 🏗️ Architecture

```
┌─────────────────┐     REST API     ┌─────────────────┐     GridFS      ┌─────────────────┐
│   ML Training   │◄────────────────►│  Model Service  │◄───────────────►│   MongoDB       │
│   Workflows     │  Register/Query  │  (Flask/Python) │  Large Files    │   (GridFS)      │
└─────────────────┘                  └─────────────────┘                 └─────────────────┘
                                             │
                                             ▼ Metadata
                                     ┌─────────────────┐
                                     │  Model Registry │
                                     │  (Collections)  │
                                     └─────────────────┘
```

## 🔌 Key Features

- **Centralized Model Registry**: Complete metadata storage and management
- **GridFS Integration**: Efficient large model file storage in MongoDB
- **Version Control**: Automatic model versioning and lifecycle tracking
- **Secure Downloads**: Authenticated model file distribution
- **Search & Discovery**: Advanced model search with filtering
- **Performance Analytics**: Model usage statistics and metrics
- **Batch Operations**: Bulk model operations and management
- **Health Monitoring**: Service availability and performance tracking

## 📡 API Endpoints

### Model Management
- `POST /api/v1/models` - Register new model
- `GET /api/v1/models` - List models with pagination
- `GET /api/v1/models/{id}` - Get model metadata
- `PUT /api/v1/models/{id}` - Update model metadata
- `DELETE /api/v1/models/{id}` - Delete model

### Model Downloads
- `GET /api/v1/models/{id}/download` - Download model file
- `GET /api/v1/models/{id}/info` - Get model file info
- `POST /api/v1/models/{id}/upload` - Upload model file

### Analytics & Statistics
- `GET /api/v1/models/statistics` - Model registry statistics
- `GET /api/v1/models/popular` - Most downloaded models
- `GET /api/v1/models/recent` - Recently added models

### Health & Monitoring
- `GET /health` - Service health check
- `GET /metrics` - Prometheus metrics endpoint

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `8084` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin` |
| `MONGODB_DB` | MongoDB database name | `tensorfleet` |
| `GRIDFS_BUCKET` | GridFS bucket name | `models` |
| `MAX_FILE_SIZE` | Maximum model file size | `500MB` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |
| `ENABLE_AUTH` | Enable authentication | `false` |

### Example Configuration

```bash
export PORT=8084
export MONGODB_URL="mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin"
export MONGODB_DB="tensorfleet"
export GRIDFS_BUCKET="models"
export MAX_FILE_SIZE="1GB"
export LOG_LEVEL="INFO"
```

## 🚀 Running the Service

### Using Docker (Recommended)

```bash
# Build and run with docker-compose (includes MongoDB)
docker-compose up model-service mongodb

# Or build separately
docker build -t tensorfleet-model-service .
docker run -p 8084:8084 \
  -e MONGODB_URL="mongodb://mongodb:27017/tensorfleet" \
  tensorfleet-model-service
```

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start MongoDB (if not using Docker)
mongod --dbpath /data/db

# Run the service
python main.py

```

## 🗄️ Data Models & Schema

### Model Registry Schema

```python
{
    "_id": ObjectId("507f1f77bcf86cd799439011"),
    "name": "fraud_detection_xgboost_v2",
    "algorithm": "xgboost",
    "hyperparameters": {
        "max_depth": 6,
        "learning_rate": 0.1,
        "n_estimators": 200,
        "subsample": 0.8,
        "colsample_bytree": 0.8
    },
    "metrics": {
        "train_accuracy": 0.9845,
        "test_accuracy": 0.9712,
        "precision": 0.9823,
        "recall": 0.9654,
        "f1_score": 0.9738,
        "auc_score": 0.9876
    },
    "version": "v2.1",
    "dataset_info": {
        "name": "credit_card_transactions",
        "size": "150MB",
        "features": 284,
        "samples": 500000
    },
    "file_metadata": {
        "file_id": ObjectId("507f1f77bcf86cd799439012"),
        "size_bytes": 45672840,
        "checksum": "sha256:abc123...",
        "format": "pickle"
    },
    "created_at": "2024-12-08T12:00:00Z",
    "updated_at": "2024-12-08T12:00:00Z",
    "created_by": "ml_engineer_01",
    "tags": ["production", "fraud-detection", "v2"],
    "status": "active",
    "download_count": 47
}
```

### GridFS Integration

```python
class ModelService:
    def store_model_file(self, model_data: bytes, metadata: dict) -> str:
        """Store model file in GridFS"""
        try:
            file_id = self.gridfs.put(
                model_data,
                filename=metadata['name'],
                metadata={
                    'algorithm': metadata['algorithm'],
                    'version': metadata['version'],
                    'upload_date': datetime.utcnow(),
                    'content_type': 'application/octet-stream'
                }
            )
            return str(file_id)
        except Exception as e:
            logger.error(f"Failed to store model file: {e}")
            raise
```

## 📡 API Operations

### Model Registration

**POST /api/v1/models** - Register a new model
```bash
curl -X POST http://localhost:8084/api/v1/models \
  -H "Content-Type: application/json" \
  -d '{
    "name": "customer_churn_rf_v1",
    "algorithm": "random_forest",
    "hyperparameters": {
      "n_estimators": 150,
      "max_depth": 8,
      "random_state": 42
    },
    "metrics": {
      "accuracy": 0.9234,
      "precision": 0.8956,
      "recall": 0.9123,
      "f1_score": 0.9038
    },
    "dataset_info": {
      "name": "customer_data_2024",
      "features": ["age", "tenure", "monthly_charges", "total_charges"]
    },
    "tags": ["churn-prediction", "production"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Model registered successfully",
  "model_id": "507f1f77bcf86cd799439013",
  "version": "v1.0",
  "download_url": "/api/v1/models/507f1f77bcf86cd799439013/download"
}
```

### Model Queries

**GET /api/v1/models** - List models with filtering
```bash
# Get all models
curl "http://localhost:8084/api/v1/models"

# Filter by algorithm
curl "http://localhost:8084/api/v1/models?algorithm=xgboost"

# Paginated results
curl "http://localhost:8084/api/v1/models?page=1&limit=10"

# Search by tags
curl "http://localhost:8084/api/v1/models?tags=production,fraud-detection"
```

**Response:**
```json
{
  "models": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "fraud_detection_xgboost_v2",
      "algorithm": "xgboost",
      "version": "v2.1",
      "metrics": {
        "test_accuracy": 0.9712,
        "f1_score": 0.9738
      },
      "created_at": "2024-12-08T12:00:00Z",
      "status": "active",
      "download_count": 47
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "pages": 16
  }
}
```

### Model Downloads

**GET /api/v1/models/{id}/download** - Download model file
```bash
# Download model
curl -O "http://localhost:8084/api/v1/models/507f1f77bcf86cd799439011/download"

# Get download info without downloading
curl -I "http://localhost:8084/api/v1/models/507f1f77bcf86cd799439011/download"
```

**Response Headers:**
```
Content-Type: application/octet-stream
Content-Length: 45672840
Content-Disposition: attachment; filename="fraud_detection_xgboost_v2.pkl"
X-Model-Algorithm: xgboost
X-Model-Version: v2.1
X-File-Checksum: sha256:abc123...
```

### Model Analytics

**GET /api/v1/models/statistics** - Registry statistics
```json
{
  "total_models": 156,
  "algorithms": {
    "xgboost": 45,
    "random_forest": 38,
    "neural_network": 31,
    "svm": 22,
    "logistic_regression": 20
  },
  "status_distribution": {
    "active": 142,
    "deprecated": 12,
    "archived": 2
  },
  "total_downloads": 3247,
  "storage_usage": {
    "total_size_gb": 12.4,
    "average_model_size_mb": 83.2
  },
  "recent_activity": {
    "models_added_last_7_days": 8,
    "downloads_last_24_hours": 23
  }
}
```

## 🔍 Advanced Features

### Model Search & Discovery

```python
@app.route('/api/v1/models/search', methods=['GET'])
def search_models():
    """Advanced model search with multiple criteria"""
    query = {}
    
    # Text search
    if 'q' in request.args:
        query['$text'] = {'$search': request.args['q']}
    
    # Algorithm filter
    if 'algorithm' in request.args:
        query['algorithm'] = request.args['algorithm']
    
    # Accuracy threshold
    if 'min_accuracy' in request.args:
        query['metrics.test_accuracy'] = {'$gte': float(request.args['min_accuracy'])}
    
    # Tag filtering
    if 'tags' in request.args:
        tags = request.args['tags'].split(',')
        query['tags'] = {'$in': tags}
    
    results = model_service.search_models(query)
    return jsonify(results)
```

### Model Versioning

```python
def create_model_version(model_id: str, updates: dict) -> str:
    """Create a new version of an existing model"""
    base_model = model_service.get_model(model_id)
    
    # Generate new version number
    version_parts = base_model['version'].lstrip('v').split('.')
    major, minor = int(version_parts[0]), int(version_parts[1])
    
    # Increment version based on change type
    if updates.get('breaking_changes', False):
        major += 1
        minor = 0
    else:
        minor += 1
    
    new_version = f"v{major}.{minor}"
    
    # Create new model entry with version
    new_model = {**base_model, **updates}
    new_model['version'] = new_version
    new_model['parent_model_id'] = model_id
    new_model['created_at'] = datetime.utcnow()
    
    return model_service.create_model(new_model)
```

## 📊 Monitoring & Analytics

### Prometheus Metrics

```python
# Model service metrics
model_downloads_total = Counter('model_downloads_total', 'Total downloads', ['model_id', 'algorithm'])
model_registrations_total = Counter('model_registrations_total', 'Total registrations', ['algorithm'])
active_models_gauge = Gauge('active_models_total', 'Active models count')
storage_usage_bytes = Gauge('storage_usage_bytes', 'Storage usage in bytes')
api_request_duration = Histogram('api_request_duration_seconds', 'Request duration', ['endpoint'])

@app.route('/metrics')
def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)
```

### Health Monitoring

```python
@app.route('/health/detailed')
def detailed_health():
    """Comprehensive health check"""
    health_status = {
        'service': 'model-service',
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'checks': {
            'mongodb': check_mongodb_connection(),
            'gridfs': check_gridfs_availability(),
            'disk_space': check_storage_space(),
            'model_registry': check_registry_integrity()
        },
        'metrics': {
            'total_models': get_model_count(),
            'active_models': get_active_model_count(),
            'storage_usage_gb': get_storage_usage() / (1024**3)
        }
    }
    
    # Determine overall health
    unhealthy_checks = [k for k, v in health_status['checks'].items() if v != 'healthy']
    if unhealthy_checks:
        health_status['status'] = 'unhealthy'
        health_status['issues'] = unhealthy_checks
    
    return jsonify(health_status)
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
python -m pytest tests/ -v

# Test with coverage
python -m pytest tests/ --cov=model_service --cov-report=html

# Integration tests
python -m pytest tests/integration/ -v
```

### API Testing

```bash
# Test model registration
curl -X POST http://localhost:8084/api/v1/models \
  -H "Content-Type: application/json" \
  -d @test_model.json

# Test model listing
curl "http://localhost:8084/api/v1/models?limit=5"

# Test model download
curl -O "http://localhost:8084/api/v1/models/test-model-id/download"
```

### Performance Testing

```python
import asyncio
import aiohttp

async def load_test_downloads():
    """Load test model downloads"""
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(100):
            task = session.get('http://localhost:8084/api/v1/models')
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks)
        print(f"Completed {len(responses)} requests")

asyncio.run(load_test_downloads())
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build production image
docker build -t tensorfleet/model-service:latest .

# Run with environment variables
docker run -d \
  --name model-service \
  -p 8084:8084 \
  -e MONGODB_URL="mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin" \
  -e MONGODB_DB="tensorfleet" \
  -e LOG_LEVEL="INFO" \
  --restart unless-stopped \
  tensorfleet/model-service:latest

# Check logs
docker logs model-service -f
```

### Docker Compose Integration

```yaml
version: '3.8'
services:
  model-service:
    build: ./model-service
    ports:
      - "8084:8084"
    environment:
      - MONGODB_URL=mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin
      - MONGODB_DB=tensorfleet
      - LOG_LEVEL=INFO
      - MAX_PAGE_SIZE=100
    depends_on:
      - mongodb
    networks:
      - tensorfleet
    volumes:
      - model_cache:/app/cache
    restart: unless-stopped

volumes:
  model_cache:

networks:
  tensorfleet:
    external: true
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-service
  namespace: tensorfleet
spec:
  replicas: 3
  selector:
    matchLabels:
      app: model-service
  template:
    metadata:
      labels:
        app: model-service
    spec:
      containers:
      - name: model-service
        image: tensorfleet/model-service:latest
        ports:
        - containerPort: 8084
        env:
        - name: MONGODB_URL
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: connection-string
        - name: MONGODB_DB
          value: "tensorfleet"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 8084
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 8084
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: model-service
  namespace: tensorfleet
spec:
  selector:
    app: model-service
  ports:
  - protocol: TCP
    port: 8084
    targetPort: 8084
  type: ClusterIP
```

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Errors**
```bash
# Check MongoDB connectivity
python -c "
import pymongo
client = pymongo.MongoClient('mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin')
print('Connection successful:', client.admin.command('ping'))
"

# Verify database access
mongo mongodb://admin:password123@localhost:27017/tensorfleet?authSource=admin
> show collections
> db.models.findOne()
```

**GridFS Storage Issues**
```python
# Check GridFS integrity
from pymongo import MongoClient
from gridfs import GridFS

client = MongoClient("mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin")
db = client.tensorfleet
fs = GridFS(db)

# List all stored files
for file in fs.find():
    print(f"File: {file.filename}, Size: {file.length} bytes")

# Verify file integrity
file_id = ObjectId("your_file_id")
file_data = fs.get(file_id)
print(f"File exists: {file_data is not None}")
```

**Memory and Performance Issues**
```bash
# Monitor memory usage
docker stats model-service

# Check Python memory profiling
pip install memory-profiler
python -m memory_profiler main.py

# Optimize MongoDB queries
# Add indexes for frequent queries
db.models.createIndex({"algorithm": 1, "status": 1})
db.models.createIndex({"created_at": -1})
db.models.createIndex({"tags": 1})
```

### Debug Mode

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Flask debug mode
app.run(debug=True, host='0.0.0.0', port=8084)

# MongoDB query profiling
db.setProfilingLevel(2)  # Profile all operations
db.system.profile.find().pretty()
```

### Log Analysis

```bash
# View service logs
docker logs model-service -f

# Filter specific log levels
docker logs model-service 2>&1 | grep ERROR

# Monitor API requests
tail -f logs/model-service.log | grep "api_request"
```

## 📈 Performance Optimization

### Database Optimization

```javascript
// MongoDB indexes for optimal performance
db.models.createIndex({
  "algorithm": 1,
  "status": 1,
  "created_at": -1
}, {name: "algorithm_status_created_idx"})

db.models.createIndex({
  "tags": 1,
  "metrics.test_accuracy": -1
}, {name: "tags_accuracy_idx"})

db.models.createIndex({
  "$**": "text"
}, {name: "full_text_search_idx"})

// GridFS optimization
db.fs.files.createIndex({
  "metadata.algorithm": 1,
  "uploadDate": -1
})
```

### Caching Strategy

```python
from functools import lru_cache
import redis

# Redis cache for frequently accessed models
redis_client = redis.Redis(host='redis', port=6379, db=0)

@lru_cache(maxsize=100)
def get_model_metadata(model_id: str):
    """Cache model metadata in memory"""
    return model_service.get_model(model_id)

def cache_popular_models():
    """Pre-cache popular models in Redis"""
    popular_models = model_service.get_popular_models(limit=50)
    for model in popular_models:
        cache_key = f"model:{model['_id']}"
        redis_client.setex(cache_key, 3600, json.dumps(model, default=str))
```

## 🔐 Security

### Model File Security

```python
import hashlib
import hmac

def verify_model_integrity(file_data: bytes, expected_checksum: str) -> bool:
    """Verify model file integrity"""
    actual_checksum = hashlib.sha256(file_data).hexdigest()
    return hmac.compare_digest(expected_checksum, actual_checksum)

def sanitize_model_name(name: str) -> str:
    """Sanitize model names for security"""
    import re
    return re.sub(r'[^a-zA-Z0-9_\-.]', '', name)[:100]
```

### Access Control

```python
from functools import wraps
import jwt

def require_api_key(f):
    """Decorator to require API key authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or not validate_api_key(api_key):
            return jsonify({'error': 'Invalid API key'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/v1/models', methods=['POST'])
@require_api_key
def register_model():
    # Protected model registration
    pass
```

## 🔗 Integration Examples

### Python Client Usage

```python
import requests
import json

class ModelServiceClient:
    def __init__(self, base_url="http://localhost:8084"):
        self.base_url = base_url
    
    def register_model(self, model_data: dict) -> str:
        """Register a new model"""
        response = requests.post(
            f"{self.base_url}/api/v1/models",
            json=model_data
        )
        response.raise_for_status()
        return response.json()['model_id']
    
    def download_model(self, model_id: str, output_path: str):
        """Download model file"""
        response = requests.get(
            f"{self.base_url}/api/v1/models/{model_id}/download",
            stream=True
        )
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    
    def search_models(self, **filters) -> list:
        """Search models with filters"""
        response = requests.get(
            f"{self.base_url}/api/v1/models",
            params=filters
        )
        response.raise_for_status()
        return response.json()['models']

# Usage example
client = ModelServiceClient()

# Register model
model_id = client.register_model({
    "name": "sentiment_analysis_bert",
    "algorithm": "transformer",
    "metrics": {"accuracy": 0.94}
})

# Search and download
models = client.search_models(algorithm="transformer", min_accuracy=0.9)
client.download_model(model_id, "./downloaded_model.pkl")
```

## 📞 Support & Maintenance

### Backup Procedures

```bash
# Backup MongoDB models collection
mongodump --host mongodb:27017 \
  --username admin \
  --password password123 \
  --authenticationDatabase admin \
  --db tensorfleet \
  --collection models \
  --out ./backups/

# Backup GridFS files
mongodump --host mongodb:27017 \
  --username admin \
  --password password123 \
  --authenticationDatabase admin \
  --db tensorfleet \
  --collection fs.files \
  --collection fs.chunks \
  --out ./backups/gridfs/
```

### Maintenance Tasks

```python
# Cleanup script for old models
def cleanup_old_models(days_old=90):
    """Remove models older than specified days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    
    old_models = model_service.find_models({
        'created_at': {'$lt': cutoff_date},
        'status': 'archived'
    })
    
    for model in old_models:
        # Remove GridFS file
        if model.get('file_metadata', {}).get('file_id'):
            gridfs.delete(ObjectId(model['file_metadata']['file_id']))
        
        # Remove model record
        model_service.delete_model(model['_id'])
    
    logger.info(f"Cleaned up {len(old_models)} old models")

# Run maintenance
if __name__ == "__main__":
    cleanup_old_models(days_old=90)
```

---

For additional support or questions about the Model Service, please refer to the main [TensorFleet documentation](../README.md) or contact the development team.
```
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Model Metadata

**GET /api/v1/models/{id}** - Get detailed model information
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "iris_random_forest_v1",
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
  "dataset_info": {
    "name": "iris",
    "target_column": "species",
    "features": ["sepal length", "sepal width", "petal length", "petal width"]
  },
  "version": "v1701964800",
  "created_at": "2024-01-01T12:00:00Z",
  "model_size": "1.0 MB"
}
```

### Model Downloads

**GET /api/v1/models/{id}/download** - Download model file
```bash
# Download model
curl -O "http://localhost:8083/api/v1/models/507f1f77bcf86cd799439011/download"

# Save with custom filename
curl -o my_model.pkl "http://localhost:8083/api/v1/models/507f1f77bcf86cd799439011/download"
```

**Response Headers:**
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="iris_random_forest_v1.pkl"
Content-Length: 1024576
```

### Model Management

**DELETE /api/v1/models/{id}** - Delete model
```json
{
  "success": true,
  "message": "Model deleted successfully",
  "deleted_id": "507f1f77bcf86cd799439011"
}
```

### Statistics & Analytics

**GET /api/v1/statistics** - Get platform statistics
```json
{
  "total_models": 156,
  "models_by_algorithm": {
    "random_forest": 45,
    "logistic_regression": 32,
    "svm": 28,
    "decision_tree": 51
  },
  "models_by_status": {
    "active": 150,
    "archived": 6
  },
  "storage_stats": {
    "total_size": "2.3 GB",
    "average_model_size": "15.4 MB"
  },
  "recent_activity": {
    "models_created_today": 5,
    "models_downloaded_today": 23
  }
}
```

### Health & Monitoring

**GET /health** - Service health check
```json
{
  "status": "healthy",
  "service": "model-service",
  "mongodb_connected": true,
  "gridfs_available": true,
  "total_models": 156,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**GET /metrics** - Prometheus metrics
```
# Model service metrics
model_service_models_total 156
model_service_downloads_total{model_id="507f..."} 5
model_service_api_requests_total{endpoint="/api/v1/models",method="GET"} 234

# Performance metrics
model_service_request_duration_seconds_bucket{endpoint="/download",le="1.0"} 45
model_service_mongodb_operations_total{operation="find"} 1250
```

## 🗄️ Model Storage Architecture

### GridFS Integration

```python
class ModelService:
    def store_model(self, model_data, metadata):
        """Store model in GridFS with metadata"""
        # Store binary data in GridFS
        file_id = self.gridfs.put(
            model_data,
            filename=f"{metadata['name']}.pkl",
            content_type="application/octet-stream",
            metadata={
                'model_name': metadata['name'],
                'algorithm': metadata['algorithm'],
                'version': metadata['version'],
                'created_at': datetime.utcnow()
            }
        )
        
        # Store metadata in collection
        metadata['file_id'] = file_id
        result = self.db.model_registry.insert_one(metadata)
        
        return result.inserted_id
```

### Model Retrieval

```python
def download_model(self, model_id):
    """Download model from GridFS"""
    # Get model metadata
    model = self.db.model_registry.find_one(
        {'_id': ObjectId(model_id)}
    )
    
    if not model:
        raise ModelNotFoundError(f"Model {model_id} not found")
    
    # Get model file from GridFS
    try:
        grid_out = self.gridfs.get(model['file_id'])
        return grid_out.read(), model['name']
    except Exception as e:
        raise ModelDownloadError(f"Failed to download model: {e}")
```

## 📊 Model Analytics

### Usage Tracking

```python
# Track model downloads
MODEL_DOWNLOADS.labels(model_id=model_id).inc()

# Track API usage
API_REQUESTS.labels(
    endpoint=request.endpoint,
    method=request.method
).inc()
```

### Performance Monitoring

```python
# Request duration tracking
with REQUEST_DURATION.labels(endpoint='/download').time():
    model_data = download_model(model_id)

# Database operation monitoring
with mongodb_timer:
    models = list(db.model_registry.find(query))
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests
python -m pytest tests/

# Test with coverage
python -m pytest --cov=model_service tests/
```

### API Testing
```bash
# Test model listing
curl http://localhost:8083/api/v1/models

# Test model metadata
curl http://localhost:8083/api/v1/models/507f1f77bcf86cd799439011

# Test download endpoint
curl -I http://localhost:8083/api/v1/models/507f1f77bcf86cd799439011/download

# Test statistics
curl http://localhost:8083/api/v1/statistics
```

### Load Testing
```python
# Example load test with locust
from locust import HttpUser, task, between

class ModelServiceUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def list_models(self):
        self.client.get("/api/v1/models")
    
    @task(3)
    def get_model_metadata(self):
        # Use existing model ID
        self.client.get("/api/v1/models/507f1f77bcf86cd799439011")
```

## 🔗 Dependencies

### Python Packages

```txt
Flask==2.3.3
Flask-CORS==4.0.0
pymongo==4.5.0
prometheus-client==0.17.1
bson==0.5.10
```

### External Services

- **MongoDB**: Model metadata and GridFS storage
- **ML Worker**: Provides trained models to manage
- **API Gateway**: Routes requests to model service
- **Monitoring**: Aggregates service metrics

## 🛠️ Development

### Project Structure

```
model-service/
├── main.py              # Flask application and API endpoints (354 lines)
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container configuration
└── tests/              # Unit tests (optional)
    ├── test_api.py
    ├── test_storage.py
    └── conftest.py
```

### Development Setup

```bash
# Create development environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pytest pytest-cov  # Testing tools

# Start MongoDB (if local)
mongod --dbpath /data/db

# Run service with auto-reload
export FLASK_ENV=development
python main.py
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Test MongoDB connection
   mongosh "mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin"
   ```

2. **GridFS File Not Found**
   ```python
   # Check GridFS collections
   db.fs.files.find().count()
   db.fs.chunks.find().count()
   ```

3. **Model Download Timeouts**
   ```bash
   # Increase timeout
   export DOWNLOAD_TIMEOUT=600
   ```

4. **Large Model Downloads**
   ```python
   # Stream large files
   def stream_model_download(grid_out):
       def generate():
           while True:
               chunk = grid_out.read(8192)  # 8KB chunks
               if not chunk:
                   break
               yield chunk
       return generate()
   ```

### Debug Mode

```python
# Enable Flask debug mode
app.debug = True

# Enable verbose MongoDB logging
import logging
logging.getLogger('pymongo').setLevel(logging.DEBUG)
```

## 🔒 Security

### Access Control

```python
# Add authentication middleware
@app.before_request
def require_auth():
    if request.endpoint in protected_endpoints:
        token = request.headers.get('Authorization')
        if not validate_token(token):
            return jsonify({'error': 'Unauthorized'}), 401
```

### Input Validation

```python
def validate_model_id(model_id):
    """Validate MongoDB ObjectId format"""
    try:
        ObjectId(model_id)
        return True
    except InvalidId:
        return False
```

### Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(
    app,
    key_func=lambda: request.remote_addr,
    default_limits=["100 per hour"]
)

@app.route('/api/v1/models/<model_id>/download')
@limiter.limit("10 per minute")
def download_model(model_id):
    # Download logic
```

## 📄 License

Part of the TensorFleet project - see root LICENSE file.

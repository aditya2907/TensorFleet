# 🤖 ML Worker Service

The ML Worker service provides advanced machine learning training capabilities with **MongoDB Atlas integration**, supporting multiple algorithms, semantic model naming, and real dataset processing for the TensorFleet distributed platform.

## 🏗️ Architecture

The ML Worker serves as the specialized ML computation node with enhanced capabilities:

### 🔄 **Core Services**
- **Smart Dataset Management**: Fetches datasets from MongoDB Atlas with caching
- **Multi-Algorithm Training**: Scikit-learn, TensorFlow, PyTorch model support
- **Semantic Model Naming**: Clean, descriptive model names instead of UUIDs
- **Intelligent Model Persistence**: MinIO + MongoDB Atlas hybrid storage
- **Advanced Metadata Management**: Rich model metadata with performance tracking
- **RESTful API Server**: Flask-based API for job submission and monitoring

### ☁️ **Cloud Integration** 
- **MongoDB Atlas**: Cloud-native database with auto-scaling
- **MinIO S3**: Distributed object storage for model artifacts
- **Prometheus Metrics**: Advanced monitoring and alerting

## ✨ Enhanced Features

### 🧠 **Machine Learning Capabilities**
- **Algorithms**: RandomForest, LogisticRegression, SVM, DecisionTree, Neural Networks
- **Deep Learning**: TensorFlow/Keras integration for DNN, CNN models
- **AutoML**: Hyperparameter optimization with grid search
- **Model Evaluation**: Comprehensive metrics (accuracy, precision, recall, F1)

### 📦 **Data & Storage**
- **MongoDB Atlas**: Distributed dataset storage with real-time sync
- **MinIO Integration**: S3-compatible object storage for large model files
- **Semantic Naming**: Models named as `JobName_Algorithm_Dataset_Timestamp`
- **Version Control**: Automatic model versioning with rollback capabilities

### 📊 **Monitoring & Observability**
- **Real-time Metrics**: Training progress, resource usage, performance
- **Health Monitoring**: Service availability and database connectivity
- **Performance Analytics**: Model comparison and benchmark tracking
- **Distributed Logging**: Structured logging with correlation IDs

## 📦 Technologies

- **Language**: Python 3.11+
- **Framework**: Flask (REST API), scikit-learn (ML)
- **Database**: MongoDB with GridFS
- **Monitoring**: Prometheus client
- **Containerization**: Docker

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run ML worker
python main.py

# Run API server
python api_server.py
```

### Docker

```bash
# Build image
docker build -t tensorfleet-worker-ml .

# Run container
docker run -p 8000:8000 \
  -e MONGODB_URL=mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin \
  -e MONGODB_DB=tensorfleet \
  tensorfleet-worker-ml
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | Flask API server port |
| `MONGODB_URL` | `mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin` | MongoDB connection string |
| `MONGODB_DB` | `tensorfleet` | MongoDB database name |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `MAX_TRAINING_TIME` | `300` | Maximum training time (seconds) |
| `MODEL_REGISTRY_COLLECTION` | `model_registry` | Model metadata collection |

### MongoDB Collections

```javascript
// Model metadata collection
{
  "_id": ObjectId("..."),
  "name": "iris_rf_model",
  "algorithm": "random_forest", 
  "hyperparameters": {...},
  "metrics": {...},
  "version": "v1701964800",
  "dataset_name": "iris",
  "features": [...],
  "target_column": "species",
  "file_id": ObjectId("..."),  // GridFS file reference
  "created_at": ISODate("..."),
  "training_time": 0.234
}

// GridFS files collection (automatic)
fs.files, fs.chunks  // Stores serialized model files
```

## 🤖 Supported ML Algorithms

### 1. Random Forest
```python
{
  "algorithm": "random_forest",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 5,
    "random_state": 42,
    "min_samples_split": 2
  }
}
```

### 2. Logistic Regression  
```python
{
  "algorithm": "logistic_regression", 
  "hyperparameters": {
    "C": 1.0,
    "max_iter": 1000,
    "solver": "liblinear",
    "random_state": 42
  }
}
```

### 3. Support Vector Machine
```python
{
  "algorithm": "svm",
  "hyperparameters": {
    "C": 1.0,
    "kernel": "rbf", 
    "gamma": "scale",
    "random_state": 42
  }
}
```

### 4. Decision Tree
```python
{
  "algorithm": "decision_tree",
  "hyperparameters": {
    "max_depth": 5,
    "min_samples_split": 2,
    "random_state": 42
  }
}
```

## 📚 API Endpoints

### Training

**POST /train** - Submit training job
```json
{
  "algorithm": "random_forest",
  "dataset_name": "iris", 
  "target_column": "species",
  "model_name": "iris_rf_model",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "model_id": "507f1f77bcf86cd799439011",
  "message": "Model trained successfully",
  "metrics": {
    "train_accuracy": 0.9833,
    "test_accuracy": 0.9667,
    "training_time": 0.234
  }
}
```

### Data Management

**GET /datasets** - List available datasets
```json
{
  "datasets": [
    {
      "name": "iris",
      "rows": 150,
      "columns": ["sepal length", "sepal width", "petal length", "petal width", "species"],
      "target": "species",
      "classes": ["setosa", "versicolor", "virginica"]
    }
  ]
}
```

**GET /algorithms** - List supported algorithms
```json
{
  "algorithms": [
    {
      "name": "random_forest",
      "description": "Random Forest Classifier",
      "type": "classification",
      "hyperparameters": ["n_estimators", "max_depth", "random_state"]
    }
  ]
}
```

### Health & Metrics

**GET /health** - Health check
```json
{
  "status": "healthy",
  "service": "ml-worker",
  "mongodb_connected": true,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**GET /metrics** - Prometheus metrics
```
# Training metrics
ml_worker_models_trained_total{algorithm="random_forest"} 5
ml_worker_training_duration_seconds 1.234
ml_worker_model_accuracy{model_type="classification"} 0.967

# System metrics  
ml_worker_active_training_jobs 2
ml_worker_mongodb_operations_total 150
```

## 🧠 Training Pipeline

### 1. Data Loading
```python
def load_dataset(dataset_name):
    """Load dataset from MongoDB or built-in datasets"""
    if dataset_name in ['iris', 'wine']:
        return load_builtin_dataset(dataset_name)
    else:
        return load_mongodb_dataset(dataset_name)
```

### 2. Data Preprocessing
```python
def preprocess_data(X, y):
    """Preprocess features and labels"""
    # Scale numerical features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Encode categorical labels
    if y.dtype == 'object':
        encoder = LabelEncoder()
        y_encoded = encoder.fit_transform(y)
    
    return X_scaled, y_encoded, scaler, encoder
```

### 3. Model Training
```python
def train_model(algorithm, X_train, y_train, hyperparameters):
    """Train ML model with specified algorithm"""
    model_classes = {
        'random_forest': RandomForestClassifier,
        'logistic_regression': LogisticRegression,
        'svm': SVC,
        'decision_tree': DecisionTreeClassifier
    }
    
    ModelClass = model_classes[algorithm]
    model = ModelClass(**hyperparameters)
    
    start_time = time.time()
    model.fit(X_train, y_train)
    training_time = time.time() - start_time
    
    return model, training_time
```

### 4. Model Persistence
```python
def save_model(model, metadata, gridfs):
    """Save model to MongoDB GridFS"""
    # Serialize model
    model_data = pickle.dumps(model)
    
    # Store in GridFS
    file_id = gridfs.put(
        model_data,
        filename=f"{metadata['name']}.pkl",
        metadata=metadata
    )
    
    # Store metadata in collection
    metadata['file_id'] = file_id
    db.model_registry.insert_one(metadata)
    
    return file_id
```

## 📊 Monitoring & Metrics

### Prometheus Metrics

```python
# Training metrics
MODELS_TRAINED = Counter('ml_models_trained_total', 'Total models trained', ['algorithm'])
TRAINING_DURATION = Histogram('ml_training_duration_seconds', 'Training duration')
MODEL_ACCURACY = Gauge('ml_model_accuracy', 'Model accuracy', ['model_id'])

# System metrics
ACTIVE_JOBS = Gauge('ml_active_training_jobs', 'Active training jobs')
MONGODB_OPS = Counter('ml_mongodb_operations_total', 'MongoDB operations', ['operation'])
```

### Health Monitoring

```python
def health_check():
    """Comprehensive health check"""
    try:
        # Test MongoDB connection
        db.admin.command('ping')
        mongodb_status = True
    except Exception:
        mongodb_status = False
    
    return {
        'status': 'healthy' if mongodb_status else 'unhealthy',
        'mongodb_connected': mongodb_status,
        'active_jobs': get_active_job_count(),
        'models_trained': get_total_model_count()
    }
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests
python -m pytest tests/

# Coverage report  
python -m pytest --cov=ml_worker tests/
```

### API Testing
```bash
# Test training endpoint
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{
    "algorithm": "random_forest",
    "dataset_name": "iris",
    "target_column": "species", 
    "model_name": "test_model"
  }'

# Test datasets endpoint
curl http://localhost:8000/datasets
```

## 🔗 Dependencies

### Python Packages

```txt
Flask==2.3.3
Flask-CORS==4.0.0
pymongo==4.5.0
scikit-learn==1.3.0
pandas==2.0.3
numpy==1.24.3
prometheus-client==0.17.1
python-dotenv==1.0.0
```

### External Services

- **MongoDB**: Dataset and model storage
- **Model Service**: Model download and metadata APIs
- **Monitoring Service**: Metrics aggregation
- **API Gateway**: Request routing

## 🛠️ Development

### Project Structure

```
worker-ml/
├── main.py              # Core ML training logic (630 lines)
├── api_server.py        # Flask REST API server (170 lines)  
├── requirements.txt     # Python dependencies
├── Dockerfile           # Container configuration
├── .env                 # Environment variables (local)
└── tests/               # Unit tests (optional)
```

### Local Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export MONGODB_URL="mongodb://localhost:27017/tensorfleet"
export MONGODB_DB="tensorfleet"
export PORT="8000"

# Run services
python api_server.py  # Start Flask API server
python main.py       # Start ML worker daemon
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Test MongoDB connectivity
   mongosh "mongodb://admin:password123@localhost:27017/tensorfleet?authSource=admin"
   ```

2. **Model Training Timeout**
   ```bash
   # Increase timeout in environment
   export MAX_TRAINING_TIME=600
   ```

3. **GridFS Upload Errors**
   ```bash
   # Check MongoDB disk space and permissions
   db.runCommand({dbStats: 1})
   ```

### Debug Logging

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# MongoDB debug
import pymongo
pymongo.monitoring.register(CommandLogger())
```

## 🔒 Security

- **Input Validation**: Sanitize all training parameters
- **Resource Limits**: Prevent memory/CPU exhaustion  
- **MongoDB Security**: Use authentication and SSL
- **Model Isolation**: Separate model storage by user/project

## 📄 License

Part of the TensorFleet project - see root LICENSE file.

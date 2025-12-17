# ML Worker Module Structure

This directory contains the modularized ML Worker service for TensorFleet.

## File Structure

```
worker-ml/
├── main.py              # Entry point for the application
├── config.py            # Configuration and environment variables
├── metrics.py           # Prometheus metrics definitions
├── mongodb_manager.py   # MongoDB operations and data management
├── storage_client.py    # MinIO/S3 storage service client
├── model_trainer.py     # ML model training logic (sklearn, TensorFlow)
├── sample_data.py       # Sample dataset generators
├── worker_service.py    # Main worker service orchestration
├── requirements.txt     # Python dependencies
└── Dockerfile          # Container configuration
```

## Module Descriptions

### `main.py`
Entry point for the ML Worker service. Initializes and starts the worker service.

### `config.py`
Centralized configuration management:
- Environment variable handling
- Logging configuration
- MongoDB and storage service URLs
- Metrics port configuration

### `metrics.py`
Prometheus metrics definitions:
- Task duration tracking
- Success/failure counters
- Model accuracy gauges
- Models trained counters

### `mongodb_manager.py`
MongoDB operations:
- Connection management
- Dataset fetching from GridFS
- Model persistence (save/load)
- Model metadata management

### `storage_client.py`
Storage service client:
- Dataset download from MinIO/S3
- Model upload to storage service
- Path parsing (s3:// and bucket/path formats)

### `model_trainer.py`
ML model training:
- Data preparation and preprocessing
- scikit-learn model training (Random Forest, SVM, Logistic Regression, Decision Tree)
- TensorFlow model training (DNN, CNN)
- Metrics calculation (accuracy, precision, recall, F1-score)
- Default hyperparameters management

### `sample_data.py`
Sample dataset generation:
- Iris dataset creation
- Wine dataset creation
- MongoDB persistence for samples

### `worker_service.py`
Main service orchestration:
- Job processing coordination
- Dataset loading (storage or MongoDB fallback)
- Model training workflow
- Result persistence (MongoDB + MinIO)
- Metrics reporting

## Usage

### Running the Service

```bash
python main.py
```

### Environment Variables

```bash
# MongoDB Configuration
MONGODB_URL=mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin
MONGODB_DB=tensorfleet

# Storage Service
STORAGE_SERVICE_URL=http://storage:8081
```

### Processing a Training Job

The worker service expects job data in the following format:

```python
job_data = {
    'job_id': 'unique-job-id',
    'job_name': 'MyTrainingJob',
    'model_name': 'MyModel',  # Optional
    'dataset_path': 'datasets/iris.csv',  # or 's3://bucket/path'
    'algorithm': 'random_forest',  # or 'svm', 'logistic_regression', 'decision_tree', 'dnn', 'cnn'
    'target_column': 'species',  # Optional, will auto-detect if not provided
    'hyperparameters': {
        'n_estimators': 100,
        'max_depth': None
    }
}

# Process the job
result = service.process_training_job(job_data)
```

## Benefits of Modular Structure

1. **Maintainability**: Each module has a single responsibility, making code easier to understand and modify
2. **Testability**: Individual modules can be tested in isolation
3. **Reusability**: Modules can be imported and used in other parts of the system
4. **Scalability**: Easy to add new model types or storage backends
5. **Debugging**: Issues can be isolated to specific modules
6. **Code Organization**: Related functionality is grouped together

## Adding New Features

### Adding a New Algorithm

Edit `model_trainer.py`:

```python
# In MLModelTrainer.train_sklearn_model()
elif algorithm == 'gradient_boosting':
    from sklearn.ensemble import GradientBoostingClassifier
    model = GradientBoostingClassifier(**hyperparameters)

# Add default hyperparameters
# In get_default_hyperparameters()
'gradient_boosting': {
    'n_estimators': 100,
    'learning_rate': 0.1,
    'random_state': 42
}
```

### Adding a New Storage Backend

Create a new storage client module or extend `storage_client.py`:

```python
def download_from_azure(blob_path):
    # Azure Blob Storage implementation
    pass
```

### Adding New Metrics

Edit `metrics.py`:

```python
MODEL_SIZE = Gauge('worker_model_size_bytes', 'Model size in bytes', ['model_type'])
```

Then use in `worker_service.py`:

```python
from metrics import MODEL_SIZE

# In process_training_job()
MODEL_SIZE.labels(model_type=algorithm).set(len(model_bytes))
```

## Dependencies

All Python dependencies are listed in `requirements.txt`. Install with:

```bash
pip install -r requirements.txt
```

## Docker

The service is containerized using Docker. Build and run with:

```bash
docker build -t tensorfleet-worker-ml .
docker run -e MONGODB_URL=... -e STORAGE_SERVICE_URL=... tensorfleet-worker-ml
```

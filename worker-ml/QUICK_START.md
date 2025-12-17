# Quick Start Guide - Modular ML Worker

## Overview
This guide helps you understand and use the modularized ML Worker service.

## Installation

```bash
cd worker-ml
pip install -r requirements.txt
```

## Running the Service

### Standalone
```bash
python main.py
```

### With Docker
```bash
docker-compose up worker-ml
```

## Using Individual Modules

### 1. Configuration
```python
from config import get_logger, MONGODB_URL, STORAGE_SERVICE_URL

logger = get_logger(__name__)
logger.info(f"MongoDB URL: {MONGODB_URL}")
```

### 2. MongoDB Operations
```python
from mongodb_manager import MongoDBManager

# Initialize
manager = MongoDBManager()

# Fetch a dataset
data = manager.fetch_dataset('iris')

# Save a trained model
model_id = manager.save_model(model, metadata={
    'job_id': 'job-123',
    'name': 'IrisClassifier',
    'algorithm': 'random_forest',
    'version': 'v1',
    'metrics': {'accuracy': 0.95}
})

# List all models
models = manager.list_models(limit=10)

# Load a model
model, metadata = manager.load_model(model_id)
```

### 3. Storage Operations
```python
from storage_client import download_dataset, save_model_to_storage
import pickle

# Download dataset from MinIO
local_path = download_dataset('datasets/iris.csv')
# or with s3:// format
local_path = download_dataset('s3://datasets/iris.csv')

# Save model to storage
model_bytes = pickle.dumps(trained_model)
result = save_model_to_storage(model_bytes, metadata={
    'job_id': 'job-123',
    'name': 'MyModel',
    'algorithm': 'random_forest'
})
```

### 4. Model Training
```python
from model_trainer import MLModelTrainer, get_default_hyperparameters
import pandas as pd

# Initialize trainer
trainer = MLModelTrainer()

# Load your data
data = pd.read_csv('dataset.csv')

# Prepare data
X_train, X_test, y_train, y_test, features = trainer.prepare_data(
    data, 
    target_column='species'
)

# Get default hyperparameters
hyperparams = get_default_hyperparameters('random_forest')

# Train model
model, metrics = trainer.train_model(
    algorithm='random_forest',
    X_train=X_train,
    X_test=X_test,
    y_train=y_train,
    y_test=y_test,
    hyperparameters=hyperparams
)

print(f"Accuracy: {metrics['accuracy']:.4f}")
print(f"F1 Score: {metrics['f1_score']:.4f}")
```

### 5. Full Training Job
```python
from worker_service import MLWorkerService

# Initialize service
service = MLWorkerService()

# Define job
job_data = {
    'job_id': 'job-123',
    'job_name': 'IrisClassification',
    'model_name': 'IrisRandomForest',
    'dataset_path': 'datasets/iris.csv',
    'algorithm': 'random_forest',
    'target_column': 'species',
    'hyperparameters': {
        'n_estimators': 150,
        'max_depth': 10
    }
}

# Process job
result = service.process_training_job(job_data)

if result['status'] == 'completed':
    print(f"Model ID: {result['model_id']}")
    print(f"Accuracy: {result['metrics']['accuracy']:.4f}")
else:
    print(f"Error: {result['error']}")
```

## Supported Algorithms

### Scikit-Learn
```python
# Random Forest
job_data = {
    'algorithm': 'random_forest',
    'hyperparameters': {
        'n_estimators': 100,
        'max_depth': None,
        'random_state': 42
    }
}

# Support Vector Machine
job_data = {
    'algorithm': 'svm',
    'hyperparameters': {
        'kernel': 'rbf',
        'C': 1.0,
        'random_state': 42
    }
}

# Logistic Regression
job_data = {
    'algorithm': 'logistic_regression',
    'hyperparameters': {
        'max_iter': 1000,
        'random_state': 42
    }
}

# Decision Tree
job_data = {
    'algorithm': 'decision_tree',
    'hyperparameters': {
        'max_depth': None,
        'random_state': 42
    }
}
```

### TensorFlow
```python
# Deep Neural Network
job_data = {
    'algorithm': 'dnn',
    'hyperparameters': {
        'epochs': 50,
        'batch_size': 32,
        'learning_rate': 0.001,
        'optimizer': 'adam'
    }
}

# Convolutional Neural Network (requires square input features)
job_data = {
    'algorithm': 'cnn',
    'hyperparameters': {
        'epochs': 50,
        'batch_size': 32,
        'learning_rate': 0.001,
        'optimizer': 'adam'
    }
}
```

## Sample Data Generation

```python
from sample_data import SampleDataGenerator
from mongodb_manager import MongoDBManager

manager = MongoDBManager()

# Create Iris dataset
SampleDataGenerator.create_iris_dataset(manager)

# Create Wine dataset
SampleDataGenerator.create_wine_dataset(manager)
```

## Monitoring

### Prometheus Metrics

Access metrics at: `http://localhost:8000/metrics`

Available metrics:
- `worker_task_duration_seconds` - Task execution time histogram
- `worker_tasks_completed_total` - Completed tasks counter
- `worker_tasks_failed_total` - Failed tasks counter
- `worker_model_accuracy` - Model accuracy gauge (by job_id and model_type)
- `worker_models_trained_total` - Total models trained counter (by model_type)

### Using Metrics Programmatically
```python
from metrics import MODELS_TRAINED, MODEL_ACCURACY, TASK_DURATION

# Increment counter
MODELS_TRAINED.labels(model_type='random_forest').inc()

# Set gauge value
MODEL_ACCURACY.labels(job_id='job-123', model_type='svm').set(0.95)

# Time a function
@TASK_DURATION.time()
def process_job():
    # Your code here
    pass
```

## Environment Variables

Create a `.env` file or set environment variables:

```bash
# MongoDB
MONGODB_URL=mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin
MONGODB_DB=tensorfleet

# Storage Service
STORAGE_SERVICE_URL=http://storage:8081

# Optional: Metrics Port
METRICS_PORT=8000
```

## Error Handling

### Dataset Not Found
```python
try:
    result = service.process_training_job(job_data)
except ValueError as e:
    if "Dataset not found" in str(e):
        # Upload dataset first or check path
        pass
```

### Model Training Failures
```python
result = service.process_training_job(job_data)

if result['status'] == 'failed':
    error = result['error']
    if "Target column" in error:
        # Specify target_column in job_data
        pass
    elif "Invalid" in error:
        # Check hyperparameters
        pass
```

## Testing

### Unit Test Example
```python
import unittest
from model_trainer import MLModelTrainer
import pandas as pd
import numpy as np

class TestModelTrainer(unittest.TestCase):
    def setUp(self):
        self.trainer = MLModelTrainer()
        
    def test_prepare_data(self):
        # Create sample data
        data = pd.DataFrame({
            'feature1': np.random.rand(100),
            'feature2': np.random.rand(100),
            'target': np.random.choice(['A', 'B'], 100)
        })
        
        X_train, X_test, y_train, y_test, features = \
            self.trainer.prepare_data(data, 'target')
        
        self.assertEqual(len(features), 2)
        self.assertEqual(len(X_train), 80)  # 80% train
        self.assertEqual(len(X_test), 20)   # 20% test
```

### Integration Test Example
```python
def test_full_training_workflow():
    from worker_service import MLWorkerService
    
    service = MLWorkerService()
    
    job_data = {
        'job_id': 'test-job',
        'algorithm': 'random_forest',
        'dataset_path': 'datasets/iris.csv',
        'target_column': 'species'
    }
    
    result = service.process_training_job(job_data)
    
    assert result['status'] == 'completed'
    assert 'model_id' in result
    assert result['metrics']['accuracy'] > 0.8
```

## Common Use Cases

### 1. Train Multiple Models
```python
algorithms = ['random_forest', 'svm', 'decision_tree', 'logistic_regression']

for algo in algorithms:
    job_data = {
        'job_id': f'job-{algo}',
        'algorithm': algo,
        'dataset_path': 'datasets/iris.csv',
        'target_column': 'species'
    }
    
    result = service.process_training_job(job_data)
    print(f"{algo}: {result['metrics']['accuracy']:.4f}")
```

### 2. Hyperparameter Tuning
```python
for n_estimators in [50, 100, 150, 200]:
    job_data = {
        'job_id': f'job-rf-{n_estimators}',
        'algorithm': 'random_forest',
        'dataset_path': 'datasets/iris.csv',
        'hyperparameters': {
            'n_estimators': n_estimators
        }
    }
    
    result = service.process_training_job(job_data)
    print(f"n_estimators={n_estimators}: {result['metrics']['accuracy']:.4f}")
```

### 3. Compare Model Performance
```python
from mongodb_manager import MongoDBManager

manager = MongoDBManager()
models = manager.list_models(limit=50)

# Sort by accuracy
sorted_models = sorted(
    models, 
    key=lambda m: m.get('metrics', {}).get('accuracy', 0),
    reverse=True
)

for model in sorted_models[:5]:
    print(f"{model['name']}: {model['metrics']['accuracy']:.4f}")
```

## Troubleshooting

### Import Errors
```bash
# Make sure you're in the worker-ml directory
cd worker-ml

# Ensure packages are installed
pip install -r requirements.txt
```

### Connection Errors
```python
# Test MongoDB connection
from mongodb_manager import MongoDBManager
manager = MongoDBManager()  # Will log connection status

# Test storage connection
from storage_client import download_dataset
try:
    download_dataset('test/path')
except Exception as e:
    print(f"Storage error: {e}")
```

### Memory Issues
```python
# For large models, use TensorFlow with smaller batch sizes
job_data = {
    'algorithm': 'dnn',
    'hyperparameters': {
        'batch_size': 16,  # Reduce from default 32
        'epochs': 10
    }
}
```

## Best Practices

1. **Always specify target_column** for clarity
2. **Use descriptive model_name** for easy identification
3. **Monitor metrics** regularly via Prometheus
4. **Test on sample data** before production datasets
5. **Log everything** using the provided logger
6. **Handle errors gracefully** with try-except blocks
7. **Version your models** using timestamps or semantic versioning

## Next Steps

- Read [MODULE_STRUCTURE.md](MODULE_STRUCTURE.md) for detailed module documentation
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for system architecture
- Read [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) for refactoring details
- Explore individual module source code for advanced usage

# TensorFleet ML Worker - Module Architecture

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           main.py                                │
│                      (Entry Point - 27 lines)                    │
│                                                                   │
│  • Initializes MLWorkerService                                   │
│  • Starts the service                                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ imports
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     worker_service.py                            │
│                (Service Orchestration - 236 lines)               │
│                                                                   │
│  • MLWorkerService class                                         │
│  • process_training_job() - main workflow                        │
│  • Coordinates all components                                    │
└──┬────────────────┬──────────────┬───────────────┬──────────────┘
   │                │              │               │
   │ imports        │ imports      │ imports       │ imports
   ▼                ▼              ▼               ▼
┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐
│ config.py│  │model_trainer │  │ mongodb_   │  │storage_client│
│          │  │    .py       │  │ manager.py │  │    .py       │
│ (26 ln)  │  │  (416 ln)    │  │  (225 ln)  │  │  (102 ln)    │
└──────────┘  └──────────────┘  └────────────┘  └──────────────┘
   │              │                  │                │
   │              │                  │                │
   ▼              ▼                  ▼                ▼
┌────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────────┐
│ Logger │  │ ML Training │  │ MongoDB  │  │ MinIO/S3      │
│        │  │ • sklearn   │  │ GridFS   │  │ Storage       │
│        │  │ • TensorFlow│  │          │  │               │
└────────┘  └─────────────┘  └──────────┘  └───────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        metrics.py                                │
│                   (Monitoring - 13 lines)                        │
│                                                                   │
│  • Prometheus metrics definitions                                │
│  • Used by worker_service.py                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      sample_data.py                              │
│                 (Demo Data - 123 lines)                          │
│                                                                   │
│  • SampleDataGenerator class                                     │
│  • Creates Iris and Wine datasets                                │
│  • Used during initialization                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interactions

### Training Job Flow

```
1. Job Request
   │
   ▼
2. worker_service.process_training_job()
   │
   ├─▶ storage_client.download_dataset()
   │   └─▶ MinIO/S3 Storage
   │
   ├─▶ model_trainer.prepare_data()
   │   └─▶ Data preprocessing
   │
   ├─▶ model_trainer.train_model()
   │   ├─▶ sklearn models
   │   └─▶ TensorFlow models
   │
   ├─▶ mongodb_manager.save_model()
   │   └─▶ MongoDB GridFS
   │
   ├─▶ storage_client.save_model_to_storage()
   │   └─▶ MinIO/S3 Storage
   │
   └─▶ metrics.* (Update Prometheus metrics)
```

## Module Dependencies

```
main.py
  ├─▶ config.py
  └─▶ worker_service.py
       ├─▶ config.py
       ├─▶ metrics.py
       ├─▶ mongodb_manager.py
       │    └─▶ config.py
       ├─▶ model_trainer.py
       │    └─▶ config.py
       ├─▶ storage_client.py
       │    └─▶ config.py
       └─▶ sample_data.py
            ├─▶ config.py
            └─▶ mongodb_manager.py
```

## External Dependencies

```
┌────────────────────────────────────────────────────────────┐
│                    External Services                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   MongoDB    │  │   MinIO/S3   │  │   Prometheus    │ │
│  │              │  │              │  │                 │ │
│  │ • Datasets   │  │ • Datasets   │  │ • Metrics       │ │
│  │ • Models     │  │ • Models     │  │ • Monitoring    │ │
│  │ • Metadata   │  │ • Storage    │  │                 │ │
│  └──────────────┘  └──────────────┘  └─────────────────┘ │
│         ▲                ▲                    ▲            │
└─────────┼────────────────┼────────────────────┼────────────┘
          │                │                    │
          │                │                    │
┌─────────┼────────────────┼────────────────────┼────────────┐
│         │                │                    │             │
│  mongodb_manager    storage_client        metrics.py       │
│                                                             │
│              TensorFleet ML Worker                         │
└─────────────────────────────────────────────────────────────┘
```

## Class Hierarchy

```
MLWorkerService
  ├─▶ mongodb_manager: MongoDBManager
  │    ├─▶ client: MongoClient
  │    ├─▶ db: Database
  │    └─▶ fs: GridFS
  │
  └─▶ trainer: MLModelTrainer
       └─▶ (stateless - no instance variables)

MongoDBManager
  ├─▶ connect()
  ├─▶ fetch_dataset()
  ├─▶ save_model()
  ├─▶ load_model()
  ├─▶ list_models()
  └─▶ get_model_metadata()

MLModelTrainer
  ├─▶ prepare_data()
  ├─▶ train_model()
  ├─▶ train_sklearn_model()
  ├─▶ train_tensorflow_model()
  └─▶ _build_tf_model()

SampleDataGenerator (static)
  ├─▶ create_iris_dataset()
  └─▶ create_wine_dataset()
```

## Data Flow

### Dataset Loading
```
Job Request
  │
  ├─▶ [Primary] storage_client.download_dataset()
  │   └─▶ GET /api/v1/download/{bucket}/{object}
  │       └─▶ Returns: /tmp/dataset.csv
  │
  └─▶ [Fallback] mongodb_manager.fetch_dataset()
      └─▶ GridFS file retrieval
          └─▶ Returns: pandas.DataFrame
```

### Model Persistence
```
Trained Model
  │
  ├─▶ mongodb_manager.save_model()
  │   ├─▶ pickle.dumps(model)
  │   ├─▶ GridFS.put(model_bytes)
  │   └─▶ models collection.insert_one(metadata)
  │
  └─▶ storage_client.save_model_to_storage()
      ├─▶ pickle.dumps(model)
      └─▶ POST /api/v1/models
          └─▶ Returns: MinIO path + MongoDB ID
```

## Configuration Flow

```
Environment Variables
  │
  ▼
config.py
  ├─▶ MONGODB_URL
  ├─▶ MONGODB_DB
  ├─▶ STORAGE_SERVICE_URL
  └─▶ METRICS_PORT
  │
  └─▶ get_logger(name)
       │
       └─▶ Used by all modules
```

## Key Interfaces

### Training Job Interface
```python
job_data = {
    'job_id': str,              # Required
    'algorithm': str,           # Required
    'dataset_path': str,        # Required
    'job_name': str,            # Optional
    'model_name': str,          # Optional
    'target_column': str,       # Optional (auto-detect)
    'hyperparameters': dict     # Optional (defaults provided)
}

result = {
    'job_id': str,
    'model_id': str,            # MongoDB ID
    'minio_model_id': str,      # MinIO reference
    'status': 'completed'|'failed',
    'metrics': dict,
    'model_name': str,
    'version': str,
    'error': str                # If failed
}
```

## Summary

The modular architecture provides:

1. **Clear Separation**: Each module has a single responsibility
2. **Loose Coupling**: Modules interact through well-defined interfaces
3. **High Cohesion**: Related functionality is grouped together
4. **Easy Testing**: Mock dependencies at module boundaries
5. **Maintainability**: Changes localized to specific modules
6. **Scalability**: Add features without modifying existing code

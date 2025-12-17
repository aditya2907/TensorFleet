"""
ML Worker Service - main service logic
"""
import time
import pickle
import traceback
from datetime import datetime
from typing import Dict, Any

import pandas as pd
from prometheus_client import start_http_server

from config import get_logger, METRICS_PORT
from metrics import (
    TASK_DURATION, TASKS_COMPLETED, TASKS_FAILED,
    MODEL_ACCURACY, MODELS_TRAINED
)
from mongodb_manager import MongoDBManager
from model_trainer import MLModelTrainer, get_default_hyperparameters
from storage_client import download_dataset, save_model_to_storage
from sample_data import SampleDataGenerator

logger = get_logger(__name__)


class MLWorkerService:
    """Main ML Worker Service"""
    
    def __init__(self):
        self.mongodb_manager = MongoDBManager()
        self.trainer = MLModelTrainer()
        self.running = False
        
        # Create sample datasets on startup
        self.initialize_sample_datasets()
    
    def initialize_sample_datasets(self):
        """Initialize sample datasets"""
        try:
            SampleDataGenerator.create_iris_dataset(self.mongodb_manager)
            SampleDataGenerator.create_wine_dataset(self.mongodb_manager)
            logger.info("Sample datasets initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize sample datasets: {e}")
    
    @TASK_DURATION.time()
    def process_training_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a training job
        
        Args:
            job_data: Dictionary containing job parameters
            
        Returns:
            Dictionary containing job results
        """
        try:
            job_id = job_data.get('job_id')
            dataset_path = job_data.get('dataset_path', 'datasets/iris.csv')
            algorithm = job_data.get('algorithm', 'random_forest')
            hyperparameters = job_data.get('hyperparameters', {})
            target_column = job_data.get('target_column')
            
            # Extract dataset name from path (remove file extension)
            dataset_name = dataset_path.split('/')[-1]
            if '.' in dataset_name:
                dataset_name = dataset_name.split('.')[0]
            
            # Get job name and create descriptive model name
            job_name = job_data.get('job_name', 'DefaultJob').replace(' ', '_')
            # Ensure we don't use UUID as job_name
            if len(job_name) == 36 and job_name.count('-') == 4:  # Detect UUID pattern
                job_name = 'DefaultJob'
            
            default_model_name = f"{job_name}_{algorithm}_{dataset_name}"
            
            # Get model name - prefer user-provided name, fallback to generated name
            model_name = job_data.get('model_name')
            if not model_name:
                model_name = default_model_name
            
            logger.info(
                f"Using model name: {model_name} "
                f"(dataset: {dataset_name}, algorithm: {algorithm})"
            )
            
            logger.info(f"Processing training job {job_id}: {algorithm} on {dataset_path}")
            
            # Download dataset from MinIO storage
            try:
                local_dataset_path = download_dataset(dataset_path)
                data = pd.read_csv(local_dataset_path)
                logger.info(f"Loaded dataset from {dataset_path} with shape {data.shape}")
            except Exception as e:
                logger.error(f"Failed to download dataset from storage: {e}")
                # Fallback: try to fetch from MongoDB
                dataset_name = dataset_path.split('/')[-1].replace('.csv', '')
                logger.info(
                    f"Attempting to fetch dataset '{dataset_name}' from MongoDB as fallback"
                )
                data = self.mongodb_manager.fetch_dataset(dataset_name)
                if data is None:
                    raise ValueError(
                        f"Dataset not found in storage or MongoDB: {dataset_path}"
                    )
            
            # Auto-detect target column if not specified
            if not target_column:
                # Use last column as target
                target_column = data.columns[-1]
                logger.info(f"Auto-detected target column: {target_column}")
            
            # Set default hyperparameters based on algorithm
            default_params = get_default_hyperparameters(algorithm)
            default_params.update(hyperparameters)
            hyperparameters = default_params
            
            # Prepare data
            X_train, X_test, y_train, y_test, features = self.trainer.prepare_data(
                data, target_column
            )
            
            # Train model
            model, metrics = self.trainer.train_model(
                algorithm, X_train, X_test, y_train, y_test, hyperparameters
            )
            
            # Generate version
            version = f"v{int(time.time())}"
            
            # Determine model type based on algorithm
            model_type = 'tensorflow' if algorithm in ['cnn', 'dnn'] else 'sklearn'
            
            # Prepare metadata
            metadata = {
                'job_id': job_id,
                'job_name': job_name,
                'name': model_name,
                'algorithm': algorithm,
                'dataset_name': dataset_name,
                'hyperparameters': hyperparameters,
                'metrics': metrics,
                'version': version,
                'dataset_path': dataset_path,
                'target_column': target_column,
                'features': features,
                'training_duration': metrics['training_time'],
                'model_type': model_type,
                'timestamp': datetime.now().strftime('%Y%m%d_%H%M%S'),
                'created_at': datetime.now().isoformat(),
                'epochs': hyperparameters.get('epochs', 0),
                'batch_size': hyperparameters.get('batch_size', 32),
                'learning_rate': hyperparameters.get('learning_rate', 0.001),
                'optimizer': hyperparameters.get(
                    'optimizer', 
                    'adam' if algorithm in ['cnn', 'dnn'] else 'N/A'
                )
            }
            
            # Save model to MongoDB (legacy)
            model_id = self.mongodb_manager.save_model(model, metadata)
            
            # Automatically save model to MinIO storage service
            try:
                model_bytes = pickle.dumps(model)
                storage_result = save_model_to_storage(model_bytes, metadata)
                logger.info(
                    f"Model automatically saved to MinIO: "
                    f"{storage_result.get('result', {}).get('minio_path')}"
                )
                minio_model_id = storage_result.get('result', {}).get('mongo_id')
            except Exception as e:
                logger.warning(
                    f"Failed to save model to MinIO storage "
                    f"(will continue with MongoDB only): {e}"
                )
                minio_model_id = None
            
            # Update Prometheus metrics
            MODEL_ACCURACY.labels(job_id=job_id, model_type=algorithm).set(
                metrics['test_accuracy']
            )
            MODELS_TRAINED.labels(model_type=algorithm).inc()
            TASKS_COMPLETED.inc()
            
            result = {
                'job_id': job_id,
                'model_id': model_id,
                'minio_model_id': minio_model_id,
                'status': 'completed',
                'metrics': metrics,
                'model_name': model_name,
                'version': version
            }
            
            logger.info(f"Training job {job_id} completed successfully")
            return result
        
        except Exception as e:
            TASKS_FAILED.inc()
            logger.error(f"Training job {job_data.get('job_id')} failed: {e}")
            logger.error(traceback.format_exc())
            return {
                'job_id': job_data.get('job_id'),
                'status': 'failed',
                'error': str(e)
            }
    
    def start(self):
        """Start the worker service"""
        self.running = True
        
        # Start Prometheus metrics server
        start_http_server(METRICS_PORT)
        logger.info(f"Started Prometheus metrics server on port {METRICS_PORT}")
        
        logger.info("ML Worker Service started and ready to process jobs")
        
        # Keep service running
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down ML Worker Service")
            self.running = False

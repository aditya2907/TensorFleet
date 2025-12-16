#!/usr/bin/env python3
"""
TensorFleet ML Worker Node with MongoDB Integration
Handles ML training jobs with MongoDB dataset fetching and model persistence
"""

import os
import json
import pickle
import logging
import time
import io
import requests
from datetime import datetime
from typing import Dict, Any, Optional, List
# Environment variables will be loaded by docker-compose from project .env file
# No need for dotenv since docker-compose handles it
from io import BytesIO
import numpy as np
import pandas as pd
from pymongo import MongoClient
from gridfs import GridFS
from bson import ObjectId
import tensorflow as tf
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, mean_squared_error, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from prometheus_client import start_http_server, Gauge, Counter, Histogram
import grpc
from concurrent import futures
import traceback
import threading

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Prometheus metrics
TASK_DURATION = Histogram('worker_task_duration_seconds', 'Task execution time')
TASKS_COMPLETED = Counter('worker_tasks_completed_total', 'Completed tasks')
TASKS_FAILED = Counter('worker_tasks_failed_total', 'Failed tasks')
MODEL_ACCURACY = Gauge('worker_model_accuracy', 'Model accuracy', ['job_id', 'model_type'])
MODELS_TRAINED = Counter('worker_models_trained_total', 'Total models trained', ['model_type'])

# Storage Service Configuration
STORAGE_SERVICE_URL = os.getenv('STORAGE_SERVICE_URL', 'http://storage:8081')

def get_db():
    """Get MongoDB database and GridFS collection"""
    mongo_url = os.getenv('MONGODB_URL', 'mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin')
    db_name = os.getenv('MONGODB_DB', 'tensorfleet')
    
    client = MongoClient(mongo_url)
    db = client[db_name]
    fs = GridFS(db)
    
    return db, fs

def download_dataset(dataset_path):
    """Download dataset from storage service."""
    try:
        # Handle S3-style paths: s3://bucket/path/to/object
        if dataset_path.startswith('s3://'):
            parts = dataset_path[5:].split('/', 1)
            bucket = parts[0]
            object_name = parts[1] if len(parts) > 1 else ''
        else:
            # Handle simple 'bucket/path' format
            parts = dataset_path.split('/', 1)
            bucket = parts[0]
            object_name = parts[1] if len(parts) > 1 else ''

        if not bucket or not object_name:
            raise ValueError("Invalid dataset path format. Expected 's3://<bucket>/<object_name>' or '<bucket>/<object_name>'.")

        url = f"{STORAGE_SERVICE_URL}/api/v1/download/{bucket}/{object_name}"
        logger.info(f"Downloading dataset from: {url}")
        
        response = requests.get(url)
        response.raise_for_status()
        
        # Save to a temporary file
        file_path = f"/tmp/{object_name.split('/')[-1]}"
        with open(file_path, 'wb') as f:
            f.write(response.content)
            
        logger.info(f"Dataset downloaded to: {file_path}")
        return file_path
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to download dataset: {e}")
        raise
    except Exception as e:
        logger.error(f"An error occurred during dataset download: {e}")
        raise

def save_model_to_storage(model_data: bytes, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Save trained model to MinIO storage service."""
    try:
        url = f"{STORAGE_SERVICE_URL}/api/v1/models"
        logger.info(f"Saving model to storage service: {url}")
        
        # Prepare multipart form data
        files = {
            'file': ('model.pkl', BytesIO(model_data), 'application/octet-stream')
        }
        data = {
            'metadata': json.dumps(metadata)
        }
        
        response = requests.post(url, files=files, data=data, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"Model saved to MinIO storage: {result.get('result', {}).get('minio_path')}")
        return result
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to save model to storage service: {e}")
        raise
    except Exception as e:
        logger.error(f"An error occurred during model save: {e}")
        raise

class MongoDBManager:
    """Handles MongoDB connections and operations"""
    
    def __init__(self):
        self.mongo_url = os.getenv('MONGODB_URL', 'mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin')
        self.db_name = os.getenv('MONGODB_DB', 'tensorfleet')
        self.client = None
        self.db = None
        self.fs = None
        self.connect()
    
    def connect(self):
        """Establish MongoDB connection"""
        try:
            self.client = MongoClient(self.mongo_url)
            self.db = self.client[self.db_name]
            self.fs = GridFS(self.db)
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB at {self.mongo_url}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def fetch_dataset(self, dataset_name: str) -> Optional[pd.DataFrame]:
        """Fetch dataset from MongoDB"""
        try:
            collection = self.db['datasets']
            dataset_doc = collection.find_one({"name": dataset_name})
            
            if not dataset_doc:
                logger.warning(f"Dataset {dataset_name} not found")
                return None
            
            # If dataset is stored as GridFS file
            if 'file_id' in dataset_doc:
                file = self.fs.get(ObjectId(dataset_doc['file_id']))
                data = pd.read_csv(io.BytesIO(file.read()))
            else:
                # If dataset is stored as documents
                data = pd.DataFrame(list(self.db[dataset_name].find()))
                if '_id' in data.columns:
                    data.drop('_id', axis=1, inplace=True)
            
            logger.info(f"Fetched dataset {dataset_name} with shape {data.shape}")
            return data
        
        except Exception as e:
            logger.error(f"Error fetching dataset {dataset_name}: {e}")
            return None
    
    def save_model(self, model, metadata: Dict[str, Any]) -> str:
        """Save trained model to MongoDB using GridFS"""
        try:
            # Serialize model
            model_bytes = pickle.dumps(model)
            
            # Create a clean filename based on model name and timestamp
            clean_name = metadata['name'].replace(' ', '_').lower()
            timestamp = metadata.get('timestamp', datetime.now().strftime('%Y%m%d_%H%M%S'))
            filename = f"{clean_name}_{metadata['version']}.pkl"
            
            # Save to GridFS
            file_id = self.fs.put(
                model_bytes,
                filename=filename,
                content_type="application/octet-stream",
                metadata=metadata
            )
            
            # Save model metadata
            model_doc = {
                "file_id": file_id,
                "job_id": metadata['job_id'],
                "name": metadata['name'],
                "algorithm": metadata['algorithm'],
                "hyperparameters": metadata['hyperparameters'],
                "metrics": metadata.get('metrics', {}),
                "version": metadata['version'],
                "created_at": datetime.utcnow(),
                "model_type": metadata.get('model_type', 'sklearn'),
                "dataset_name": metadata.get('dataset_name'),
                "training_duration": metadata.get('training_duration'),
                "features": metadata.get('features', []),
                "target_column": metadata.get('target_column'),
                "status": "trained"
            }
            
            result = self.db['models'].insert_one(model_doc)
            model_id = str(result.inserted_id)
            
            logger.info(f"Saved model {metadata['name']} with ID {model_id}")
            return model_id
        
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise
    
    def load_model(self, model_id: str):
        """Load model from MongoDB"""
        try:
            model_doc = self.db['models'].find_one({"_id": ObjectId(model_id)})
            if not model_doc:
                raise ValueError(f"Model {model_id} not found")
            
            file = self.fs.get(ObjectId(model_doc['file_id']))
            model = pickle.loads(file.read())
            
            logger.info(f"Loaded model {model_id}")
            return model, model_doc
        
        except Exception as e:
            logger.error(f"Error loading model {model_id}: {e}")
            raise
    
    def list_models(self, limit: int = 50) -> List[Dict]:
        """List available models"""
        try:
            models = list(self.db['models'].find({}, {
                '_id': 1, 'name': 1, 'algorithm': 1, 'metrics': 1,
                'created_at': 1, 'version': 1, 'job_id': 1, 'status': 1
            }).sort('created_at', -1).limit(limit))
            
            # Convert ObjectId to string
            for model in models:
                model['_id'] = str(model['_id'])
            
            return models
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []
    
    def get_model_metadata(self, model_id: str) -> Optional[Dict]:
        """Get model metadata"""
        try:
            model_doc = self.db['models'].find_one({"_id": ObjectId(model_id)})
            if model_doc:
                model_doc['_id'] = str(model_doc['_id'])
                model_doc['file_id'] = str(model_doc['file_id'])
            return model_doc
        except Exception as e:
            logger.error(f"Error getting model metadata {model_id}: {e}")
            return None

class MLModelTrainer:
    """Handles ML model training with different algorithms"""

    def __init__(self):
        pass

    def prepare_data(self, data: pd.DataFrame, target_column: str, test_size: float = 0.2):
        """Prepare data for training"""
        if target_column not in data.columns:
            raise ValueError(f"Target column '{target_column}' not in dataframe")

        X = data.drop(columns=[target_column])
        y = data[target_column]

        # Encode categorical features
        categorical_features = X.select_dtypes(include=['object']).columns
        for col in categorical_features:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col])

        # Encode target variable if it's categorical
        if y.dtype == 'object':
            le = LabelEncoder()
            y = le.fit_transform(y)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)

        # Scale numerical features
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

        return X_train, X_test, y_train, y_test, X.columns.tolist()

    def _build_tf_model(self, algorithm: str, input_shape, num_classes: int, hyperparameters: Dict):
        """Builds a TensorFlow model."""
        model = tf.keras.Sequential()
        if algorithm == 'dnn':
            model.add(tf.keras.layers.Input(shape=input_shape))
            model.add(tf.keras.layers.Flatten())
            model.add(tf.keras.layers.Dense(128, activation='relu'))
            model.add(tf.keras.layers.Dense(64, activation='relu'))
            model.add(tf.keras.layers.Dense(num_classes, activation='softmax'))
        elif algorithm == 'cnn':
            # Reshape for CNN if input is flat
            if len(input_shape) == 1:
                # Attempt to make it square-like for 2D convolution
                side = int(np.sqrt(input_shape[0]))
                if side * side != input_shape[0]:
                    raise ValueError("Cannot reshape flat input to a square for CNN. Input features must be a perfect square.")
                reshape_target = (side, side, 1)
            else:
                reshape_target = (*input_shape, 1)

            model.add(tf.keras.layers.Input(shape=input_shape))
            model.add(tf.keras.layers.Reshape(reshape_target))
            model.add(tf.keras.layers.Conv2D(32, kernel_size=(3, 3), activation="relu"))
            model.add(tf.keras.layers.MaxPooling2D(pool_size=(2, 2)))
            model.add(tf.keras.layers.Flatten())
            model.add(tf.keras.layers.Dense(128, activation="relu"))
            model.add(tf.keras.layers.Dense(num_classes, activation="softmax"))

        optimizer_name = hyperparameters.get('optimizer', 'adam').lower()
        learning_rate = float(hyperparameters.get('learning_rate', 0.001))
        optimizer = tf.keras.optimizers.get({
            'class_name': optimizer_name,
            'config': {'learning_rate': learning_rate}
        })

        model.compile(optimizer=optimizer,
                      loss='sparse_categorical_crossentropy',
                      metrics=['accuracy'])
        return model

    def train_tensorflow_model(self, algorithm: str, X_train, X_test, y_train, y_test, hyperparameters: Dict):
        """Trains a TensorFlow model (CNN or DNN)."""
        from sklearn.metrics import precision_score, recall_score, f1_score
        
        logger.info(f"Starting TensorFlow training for {algorithm} model...")
        start_time = time.time()

        # Determine input shape and number of classes
        input_shape = (X_train.shape[1],)
        num_classes = len(np.unique(y_train))

        # Build model
        model = self._build_tf_model(algorithm, input_shape, num_classes, hyperparameters)
        model.summary(print_fn=logger.info)

        # Get hyperparameters
        batch_size = int(hyperparameters.get('batch_size', 32))
        epochs = int(hyperparameters.get('epochs', 10))

        # Create tf.data pipeline
        train_dataset = tf.data.Dataset.from_tensor_slices((X_train, y_train)).shuffle(buffer_size=len(X_train)).batch(batch_size)
        test_dataset = tf.data.Dataset.from_tensor_slices((X_test, y_test)).batch(batch_size)

        # Train model
        history = model.fit(train_dataset, epochs=epochs, validation_data=test_dataset, verbose=0)
        training_time = time.time() - start_time

        # Evaluate model
        train_loss, train_accuracy = model.evaluate(train_dataset, verbose=0)
        test_loss, test_accuracy = model.evaluate(test_dataset, verbose=0)
        
        # Calculate predictions for detailed metrics
        y_pred_test = model.predict(test_dataset)
        y_pred_test_classes = np.argmax(y_pred_test, axis=1)
        
        # Calculate precision, recall, and F1-score
        # Use 'weighted' average for multi-class classification
        average_type = 'weighted' if num_classes > 2 else 'binary'
        precision = precision_score(y_test, y_pred_test_classes, average=average_type, zero_division=0)
        recall = recall_score(y_test, y_pred_test_classes, average=average_type, zero_division=0)
        f1 = f1_score(y_test, y_pred_test_classes, average=average_type, zero_division=0)

        logger.info(f"TensorFlow training completed in {training_time:.2f}s. Test accuracy: {test_accuracy:.4f}, F1: {f1:.4f}")

        metrics = {
            "train_accuracy": float(train_accuracy),
            "test_accuracy": float(test_accuracy),
            "accuracy": float(test_accuracy),  # Alias for consistency
            "train_loss": float(train_loss),
            "test_loss": float(test_loss),
            "loss": float(test_loss),  # Alias for consistency
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "training_time": training_time,
            "history": {k: [float(val) for val in v] for k, v in history.history.items()}
        }
        return model, metrics

    def train_model(self, algorithm: str, X_train, X_test, y_train, y_test, hyperparameters: Dict):
        """Train model with specified algorithm"""
        try:
            start_time = time.time()

            if algorithm in ['cnn', 'dnn']:
                return self.train_tensorflow_model(algorithm, X_train, X_test, y_train, y_test, hyperparameters)

            # Initialize model based on algorithm
            if algorithm == 'random_forest':
                model = RandomForestClassifier(**hyperparameters)
            elif algorithm == 'logistic_regression':
                model = LogisticRegression(**hyperparameters)
            elif algorithm == 'svm':
                model = SVC(**hyperparameters)
            elif algorithm == 'decision_tree':
                model = DecisionTreeClassifier(**hyperparameters)
            else:
                raise ValueError(f"Unsupported algorithm: {algorithm}")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Make predictions
            y_pred_train = model.predict(X_train)
            y_pred_test = model.predict(X_test)
            
            # Calculate metrics
            from sklearn.metrics import precision_score, recall_score, f1_score
            
            train_accuracy = accuracy_score(y_train, y_pred_train)
            test_accuracy = accuracy_score(y_test, y_pred_test)
            
            # Calculate precision, recall, and F1-score
            num_classes = len(np.unique(y_test))
            average_type = 'weighted' if num_classes > 2 else 'binary'
            precision = precision_score(y_test, y_pred_test, average=average_type, zero_division=0)
            recall = recall_score(y_test, y_pred_test, average=average_type, zero_division=0)
            f1 = f1_score(y_test, y_pred_test, average=average_type, zero_division=0)
            
            training_time = time.time() - start_time
            
            metrics = {
                'train_accuracy': float(train_accuracy),
                'test_accuracy': float(test_accuracy),
                'accuracy': float(test_accuracy),  # Alias for consistency
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1),
                'training_time': training_time,
                'classification_report': classification_report(y_test, y_pred_test, output_dict=True)
            }
            
            logger.info(f"Model trained - Algorithm: {algorithm}, Test Accuracy: {test_accuracy:.4f}, Precision: {precision:.4f}, Recall: {recall:.4f}, F1: {f1:.4f}")
            
            return model, metrics
        
        except Exception as e:
            logger.error(f"Error training model: {e}")
            raise

class SampleDataGenerator:
    """Generates sample datasets for demonstration"""
    
    @staticmethod
    def create_iris_dataset(mongodb_manager: MongoDBManager):
        """Create Iris dataset in MongoDB"""
        try:
            from sklearn.datasets import load_iris
            iris = load_iris()
            
            # Create DataFrame
            data = pd.DataFrame(iris.data, columns=iris.feature_names)
            data['target'] = iris.target
            data['species'] = [iris.target_names[i] for i in iris.target]
            
            # Save to MongoDB
            collection = mongodb_manager.db['datasets']
            
            # Remove existing dataset
            collection.delete_many({"name": "iris"})
            
            # Save dataset metadata
            dataset_doc = {
                "name": "iris",
                "description": "Iris flower dataset",
                "features": list(iris.feature_names),
                "target_column": "species",
                "n_samples": len(data),
                "n_features": len(iris.feature_names),
                "created_at": datetime.utcnow()
            }
            
            # Save as CSV to GridFS
            csv_buffer = io.StringIO()
            data.to_csv(csv_buffer, index=False)
            csv_bytes = csv_buffer.getvalue().encode('utf-8')
            
            file_id = mongodb_manager.fs.put(
                csv_bytes,
                filename="iris.csv",
                content_type="text/csv"
            )
            
            dataset_doc['file_id'] = file_id
            collection.insert_one(dataset_doc)
            
            logger.info("Created Iris dataset in MongoDB")
        
        except Exception as e:
            logger.error(f"Error creating Iris dataset: {e}")
    
    @staticmethod
    def create_wine_dataset(mongodb_manager: MongoDBManager):
        """Create Wine dataset in MongoDB"""
        try:
            from sklearn.datasets import load_wine
            wine = load_wine()
            
            # Create DataFrame
            data = pd.DataFrame(wine.data, columns=wine.feature_names)
            data['target'] = wine.target
            data['wine_class'] = wine.target
            
            # Save to MongoDB
            collection = mongodb_manager.db['datasets']
            
            # Remove existing dataset
            collection.delete_many({"name": "wine"})
            
            # Save dataset metadata
            dataset_doc = {
                "name": "wine",
                "description": "Wine classification dataset",
                "features": list(wine.feature_names),
                "target_column": "wine_class",
                "n_samples": len(data),
                "n_features": len(wine.feature_names),
                "created_at": datetime.utcnow()
            }
            
            # Save as CSV to GridFS
            csv_buffer = io.StringIO()
            data.to_csv(csv_buffer, index=False)
            csv_bytes = csv_buffer.getvalue().encode('utf-8')
            
            file_id = mongodb_manager.fs.put(
                csv_bytes,
                filename="wine.csv",
                content_type="text/csv"
            )
            
            dataset_doc['file_id'] = file_id
            collection.insert_one(dataset_doc)
            
            logger.info("Created Wine dataset in MongoDB")
        
        except Exception as e:
            logger.error(f"Error creating Wine dataset: {e}")

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
        """Process a training job"""
        try:
            job_id = job_data.get('job_id')
            dataset_path = job_data.get('dataset_path', 'datasets/iris.csv')  # Expecting 'datasets/filename.csv'
            algorithm = job_data.get('algorithm', 'random_forest')
            hyperparameters = job_data.get('hyperparameters', {})
            target_column = job_data.get('target_column')
            # Extract dataset name from path (remove file extension)
            dataset_name = dataset_path.split('/')[-1]
            if '.' in dataset_name:
                dataset_name = dataset_name.split('.')[0]
            
            # Get job name and create descriptive model name: JobName_ModelType_Dataset  
            job_name = job_data.get('job_name', 'DefaultJob').replace(' ', '_')
            # Ensure we don't use UUID as job_name
            if len(job_name) == 36 and job_name.count('-') == 4:  # Detect UUID pattern
                job_name = 'DefaultJob'
            timestamp = datetime.now().strftime('%Y%m%d_%H%M')
            default_model_name = f"{job_name}_{algorithm}_{dataset_name}"
            
            # Get model name - prefer user-provided name, fallback to generated name
            model_name = job_data.get('model_name')
            if not model_name:
                model_name = default_model_name
            
            logger.info(f"Using model name: {model_name} (dataset: {dataset_name}, algorithm: {algorithm})")
            
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
                logger.info(f"Attempting to fetch dataset '{dataset_name}' from MongoDB as fallback")
                data = self.mongodb_manager.fetch_dataset(dataset_name)
                if data is None:
                    raise ValueError(f"Dataset not found in storage or MongoDB: {dataset_path}")
            
            # Auto-detect target column if not specified
            if not target_column:
                # Use last column as target
                target_column = data.columns[-1]
                logger.info(f"Auto-detected target column: {target_column}")
            
            # Set default hyperparameters based on algorithm
            default_params = self.get_default_hyperparameters(algorithm)
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
            
            # Prepare metadata with job_name and dataset_name for descriptive file naming
            job_name = job_data.get('job_name', 'DefaultJob')  # Use job_name from request or fallback to descriptive name
            
            # Determine model type based on algorithm
            model_type = 'tensorflow' if algorithm in ['cnn', 'dnn'] else 'sklearn'
            
            metadata = {
                'job_id': job_id,
                'job_name': job_name,
                'name': model_name,
                'algorithm': algorithm,
                'dataset_name': dataset_name,
                'hyperparameters': hyperparameters,
                'metrics': metrics,
                'version': version,
                'dataset_path': dataset_path,  # Use dataset_path for MinIO compatibility
                'target_column': target_column,
                'features': features,
                'training_duration': metrics['training_time'],
                'model_type': model_type,
                'timestamp': datetime.now().strftime('%Y%m%d_%H%M%S'),
                'created_at': datetime.now().isoformat(),
                # Include training configuration details
                'epochs': hyperparameters.get('epochs', 0),
                'batch_size': hyperparameters.get('batch_size', 32),
                'learning_rate': hyperparameters.get('learning_rate', 0.001),
                'optimizer': hyperparameters.get('optimizer', 'adam' if algorithm in ['cnn', 'dnn'] else 'N/A')
            }
            
            # Save model to MongoDB (legacy)
            model_id = self.mongodb_manager.save_model(model, metadata)
            
            # Automatically save model to MinIO storage service
            try:
                model_bytes = pickle.dumps(model)
                storage_result = save_model_to_storage(model_bytes, metadata)
                logger.info(f"Model automatically saved to MinIO: {storage_result.get('result', {}).get('minio_path')}")
                minio_model_id = storage_result.get('result', {}).get('mongo_id')
            except Exception as e:
                logger.warning(f"Failed to save model to MinIO storage (will continue with MongoDB only): {e}")
                minio_model_id = None
            
            # Update Prometheus metrics
            MODEL_ACCURACY.labels(job_id=job_id, model_type=algorithm).set(metrics['test_accuracy'])
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
    
    def get_default_hyperparameters(self, algorithm: str) -> Dict[str, Any]:
        """Get default hyperparameters for algorithm"""
        defaults = {
            'random_forest': {
                'n_estimators': 100,
                'max_depth': None,
                'random_state': 42
            },
            'logistic_regression': {
                'max_iter': 1000,
                'random_state': 42
            },
            'svm': {
                'kernel': 'rbf',
                'random_state': 42
            },
            'decision_tree': {
                'max_depth': None,
                'random_state': 42
            }
        }
        return defaults.get(algorithm, {})
    
    def start(self):
        """Start the worker service"""
        self.running = True
        
        # Start Prometheus metrics server
        start_http_server(8000)
        logger.info("Started Prometheus metrics server on port 8000")
        
        logger.info("ML Worker Service started and ready to process jobs")
        
        # Keep service running
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down ML Worker Service")
            self.running = False

def main():
    """Main entry point"""
    try:
        service = MLWorkerService()
        service.start()
    except Exception as e:
        logger.error(f"Failed to start ML Worker Service: {e}")
        raise

if __name__ == "__main__":
    main()

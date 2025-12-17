"""
TensorFleet Storage Manager
Handles saving and retrieving models, artifacts, checkpoints, datasets, and jobs
to both MinIO (S3-compatible storage) and MongoDB
"""

import os
import json
import pickle
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from io import BytesIO
from minio import Minio
from minio.error import S3Error
from pymongo import MongoClient
from bson import ObjectId
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StorageManager:
    """Unified storage manager for MinIO and MongoDB"""
    
    # Bucket names
    MODELS_BUCKET = 'models'
    DATASETS_BUCKET = 'datasets'
    CHECKPOINTS_BUCKET = 'checkpoints'
    ARTIFACTS_BUCKET = 'artifacts'
    JOBS_BUCKET = 'jobs'
    
    ALL_BUCKETS = [MODELS_BUCKET, DATASETS_BUCKET, CHECKPOINTS_BUCKET, ARTIFACTS_BUCKET, JOBS_BUCKET]
    
    def __init__(self):
        # Initialize MinIO client
        minio_endpoint = os.getenv('MINIO_ENDPOINT', 'minio:9000')
        minio_access_key = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
        minio_secret_key = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
        minio_secure = os.getenv('MINIO_SECURE', 'false').lower() == 'true'
        
        self.minio_client = Minio(
            minio_endpoint,
            access_key=minio_access_key,
            secret_key=minio_secret_key,
            secure=minio_secure
        )
        
        # Initialize MongoDB
        mongo_url = os.getenv('MONGODB_URL', 'mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin')
        db_name = os.getenv('MONGODB_DB', 'tensorfleet')
        
        self.mongo_client = MongoClient(mongo_url)
        self.db = self.mongo_client[db_name]
        
        # Ensure buckets and collections exist
        self._ensure_buckets()
        self._ensure_collections()
        
        logger.info("StorageManager initialized successfully")
    
    def _ensure_buckets(self):
        """Ensure all required MinIO buckets exist"""
        for bucket in self.ALL_BUCKETS:
            try:
                if not self.minio_client.bucket_exists(bucket):
                    self.minio_client.make_bucket(bucket)
                    logger.info(f"Created MinIO bucket: {bucket}")
                else:
                    logger.info(f"MinIO bucket already exists: {bucket}")
            except S3Error as e:
                logger.error(f"Error creating bucket {bucket}: {e}")
    
    def _ensure_collections(self):
        """Ensure all required MongoDB collections exist with indexes"""
        collections = {
            'models': [
                ('job_id', 1),
                ('created_at', -1),
                ('status', 1)
            ],
            'datasets': [
                ('name', 1),
                ('created_at', -1)
            ],
            'checkpoints': [
                ('job_id', 1),
                ('epoch', 1),
                ('created_at', -1)
            ],
            'artifacts': [
                ('job_id', 1),
                ('artifact_type', 1),
                ('created_at', -1)
            ],
            'jobs': [
                ('job_id', 1),
                ('status', 1),
                ('created_at', -1),
                ('user_id', 1)
            ]
        }
        
        for collection_name, indexes in collections.items():
            # Create collection if it doesn't exist
            if collection_name not in self.db.list_collection_names():
                self.db.create_collection(collection_name)
                logger.info(f"Created MongoDB collection: {collection_name}")
            
            # Create indexes
            for index in indexes:
                try:
                    self.db[collection_name].create_index([index])
                except Exception as e:
                    logger.warning(f"Index might already exist for {collection_name}: {e}")
    
    def _calculate_checksum(self, data: bytes) -> str:
        """Calculate MD5 checksum of data"""
        return hashlib.md5(data).hexdigest()
    
    def _sanitize_filename(self, name: str) -> str:
        """Sanitize filename to be filesystem-safe"""
        import re
        if not name:
            return "unnamed"
        # Replace spaces and special characters with underscores
        sanitized = re.sub(r'[^\w\-_.]', '_', str(name).strip())
        # Remove multiple consecutive underscores
        sanitized = re.sub(r'_+', '_', sanitized)
        # Remove leading/trailing underscores
        sanitized = sanitized.strip('_')
        # Limit length
        return sanitized[:50] if sanitized else "unnamed"
    
    # ==================== MODEL OPERATIONS ====================
    
    def save_model(self, model_data: bytes, metadata: Dict[str, Any]) -> Dict[str, str]:
        """
        Save model to both MinIO and MongoDB
        
        Args:
            model_data: Serialized model bytes
            metadata: Model metadata (job_id, name, algorithm, metrics, etc.)
        
        Returns:
            Dict with minio_path and mongo_id
        """
        try:
            job_id = metadata['job_id']
            model_name = metadata.get('name', f"model_{job_id}")
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            
            # Create descriptive filename: job_name + algorithm + dataset_name
            job_name = metadata.get('job_name', 'unnamed_job')
            algorithm = metadata.get('algorithm', 'unknown_algo')
            dataset_name = metadata.get('dataset_name', 'unknown_dataset')
            
            # Clean names to be filesystem-safe
            clean_job_name = self._sanitize_filename(job_name)
            clean_algorithm = self._sanitize_filename(algorithm)
            clean_dataset = self._sanitize_filename(dataset_name)
            
            # Generate descriptive object name
            descriptive_name = f"{clean_job_name}_{clean_algorithm}_{clean_dataset}"
            object_name = f"models/{descriptive_name}_{timestamp}.pkl"
            
            # Calculate checksum
            checksum = self._calculate_checksum(model_data)
            
            # Save to MinIO
            self.minio_client.put_object(
                self.MODELS_BUCKET,
                object_name,
                BytesIO(model_data),
                len(model_data),
                content_type='application/octet-stream'
            )
            
            minio_path = f"s3://{self.MODELS_BUCKET}/{object_name}"
            logger.info(f"Saved model to MinIO: {minio_path}")
            
            # Save metadata to MongoDB
            model_doc = {
                "job_id": job_id,
                "name": model_name,
                "minio_path": minio_path,
                "minio_bucket": self.MODELS_BUCKET,
                "minio_object": object_name,
                "algorithm": metadata.get('algorithm'),
                "model_type": metadata.get('model_type', 'sklearn'),
                "hyperparameters": metadata.get('hyperparameters', {}),
                "metrics": metadata.get('metrics', {}),
                "version": metadata.get('version', '1.0'),
                "dataset_name": metadata.get('dataset_name'),
                "features": metadata.get('features', []),
                "target_column": metadata.get('target_column'),
                "training_duration": metadata.get('training_duration'),
                "size_bytes": len(model_data),
                "checksum": checksum,
                "status": "trained",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = self.db['models'].insert_one(model_doc)
            mongo_id = str(result.inserted_id)
            
            logger.info(f"Saved model metadata to MongoDB: {mongo_id}")
            
            return {
                "minio_path": minio_path,
                "mongo_id": mongo_id,
                "object_name": object_name,
                "checksum": checksum
            }
        
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise
    
    def load_model(self, mongo_id: Optional[str] = None, job_id: Optional[str] = None) -> tuple:
        """
        Load model from MinIO using MongoDB metadata
        
        Args:
            mongo_id: MongoDB document ID
            job_id: Job ID to load latest model
        
        Returns:
            (model_bytes, metadata)
        """
        try:
            # Find model document
            if mongo_id:
                model_doc = self.db['models'].find_one({"_id": ObjectId(mongo_id)})
            elif job_id:
                model_doc = self.db['models'].find_one(
                    {"job_id": job_id},
                    sort=[("created_at", -1)]
                )
            else:
                raise ValueError("Either mongo_id or job_id must be provided")
            
            if not model_doc:
                raise ValueError("Model not found")
            
            # Load from MinIO
            response = self.minio_client.get_object(
                model_doc['minio_bucket'],
                model_doc['minio_object']
            )
            
            model_data = response.read()
            response.close()
            response.release_conn()
            
            # Convert ObjectId to string for JSON serialization
            model_doc['_id'] = str(model_doc['_id'])
            
            logger.info(f"Loaded model from MinIO: {model_doc['minio_path']}")
            
            return model_data, model_doc
        
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def list_models(self, job_id: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """List models with optional filtering by job_id"""
        try:
            query = {"job_id": job_id} if job_id else {}
            
            models = list(self.db['models'].find(
                query,
                {
                    '_id': 1, 'job_id': 1, 'name': 1, 'algorithm': 1,
                    'metrics': 1, 'created_at': 1, 'version': 1, 'status': 1,
                    'size_bytes': 1, 'minio_path': 1
                }
            ).sort('created_at', -1).limit(limit))
            
            # Convert ObjectId to string
            for model in models:
                model['_id'] = str(model['_id'])
            
            return models
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []
    
    # ==================== CHECKPOINT OPERATIONS ====================
    
    def save_checkpoint(self, checkpoint_data: bytes, metadata: Dict[str, Any]) -> Dict[str, str]:
        """
        Save training checkpoint to MinIO and MongoDB
        
        Args:
            checkpoint_data: Serialized checkpoint bytes
            metadata: Checkpoint metadata (job_id, epoch, metrics, etc.)
        
        Returns:
            Dict with minio_path and mongo_id
        """
        try:
            job_id = metadata['job_id']
            epoch = metadata.get('epoch', 0)
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            
            # Create descriptive filename: job_name + algorithm + dataset_name + epoch
            job_name = metadata.get('job_name', 'unnamed_job')
            algorithm = metadata.get('algorithm', 'unknown_algo')
            dataset_name = metadata.get('dataset_name', 'unknown_dataset')
            
            # Clean names to be filesystem-safe
            clean_job_name = self._sanitize_filename(job_name)
            clean_algorithm = self._sanitize_filename(algorithm)
            clean_dataset = self._sanitize_filename(dataset_name)
            
            # Generate descriptive object name
            descriptive_name = f"{clean_job_name}_{clean_algorithm}_{clean_dataset}_epoch_{epoch}"
            object_name = f"checkpoints/{descriptive_name}_{timestamp}.pkl"
            
            # Calculate checksum
            checksum = self._calculate_checksum(checkpoint_data)
            
            # Save to MinIO
            self.minio_client.put_object(
                self.CHECKPOINTS_BUCKET,
                object_name,
                BytesIO(checkpoint_data),
                len(checkpoint_data),
                content_type='application/octet-stream'
            )
            
            minio_path = f"s3://{self.CHECKPOINTS_BUCKET}/{object_name}"
            logger.info(f"Saved checkpoint to MinIO: {minio_path}")
            
            # Save metadata to MongoDB
            checkpoint_doc = {
                "job_id": job_id,
                "epoch": epoch,
                "minio_path": minio_path,
                "minio_bucket": self.CHECKPOINTS_BUCKET,
                "minio_object": object_name,
                "metrics": metadata.get('metrics', {}),
                "model_state": metadata.get('model_state', 'training'),
                "size_bytes": len(checkpoint_data),
                "checksum": checksum,
                "created_at": datetime.utcnow()
            }
            
            result = self.db['checkpoints'].insert_one(checkpoint_doc)
            mongo_id = str(result.inserted_id)
            
            logger.info(f"Saved checkpoint metadata to MongoDB: {mongo_id}")
            
            return {
                "minio_path": minio_path,
                "mongo_id": mongo_id,
                "object_name": object_name,
                "checksum": checksum
            }
        
        except Exception as e:
            logger.error(f"Error saving checkpoint: {e}")
            raise
    
    def load_checkpoint(self, job_id: str, epoch: Optional[int] = None) -> tuple:
        """Load latest or specific epoch checkpoint"""
        try:
            query = {"job_id": job_id}
            if epoch is not None:
                query["epoch"] = epoch
            
            checkpoint_doc = self.db['checkpoints'].find_one(
                query,
                sort=[("epoch", -1)]
            )
            
            if not checkpoint_doc:
                raise ValueError(f"Checkpoint not found for job {job_id}")
            
            # Load from MinIO
            response = self.minio_client.get_object(
                checkpoint_doc['minio_bucket'],
                checkpoint_doc['minio_object']
            )
            
            checkpoint_data = response.read()
            response.close()
            response.release_conn()
            
            checkpoint_doc['_id'] = str(checkpoint_doc['_id'])
            
            logger.info(f"Loaded checkpoint from MinIO: {checkpoint_doc['minio_path']}")
            
            return checkpoint_data, checkpoint_doc
        
        except Exception as e:
            logger.error(f"Error loading checkpoint: {e}")
            raise
    
    def list_checkpoints(self, job_id: str) -> List[Dict]:
        """List all checkpoints for a job"""
        try:
            checkpoints = list(self.db['checkpoints'].find(
                {"job_id": job_id},
                {'_id': 1, 'job_id': 1, 'epoch': 1, 'metrics': 1, 'created_at': 1, 'minio_path': 1}
            ).sort('epoch', -1))
            
            for checkpoint in checkpoints:
                checkpoint['_id'] = str(checkpoint['_id'])
            
            return checkpoints
        except Exception as e:
            logger.error(f"Error listing checkpoints: {e}")
            return []
    
    # ==================== ARTIFACT OPERATIONS ====================
    
    def save_artifact(self, artifact_data: bytes, metadata: Dict[str, Any]) -> Dict[str, str]:
        """
        Save training artifact (plots, reports, etc.) to MinIO and MongoDB
        
        Args:
            artifact_data: Artifact bytes
            metadata: Artifact metadata (job_id, artifact_type, name, etc.)
        
        Returns:
            Dict with minio_path and mongo_id
        """
        try:
            job_id = metadata['job_id']
            artifact_type = metadata.get('artifact_type', 'unknown')
            artifact_name = metadata.get('name', f"artifact_{job_id}")
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            
            # Create descriptive filename: job_name + algorithm + dataset_name + artifact_type
            job_name = metadata.get('job_name', 'unnamed_job')
            algorithm = metadata.get('algorithm', 'unknown_algo')
            dataset_name = metadata.get('dataset_name', 'unknown_dataset')
            
            # Clean names to be filesystem-safe
            clean_job_name = self._sanitize_filename(job_name)
            clean_algorithm = self._sanitize_filename(algorithm)
            clean_dataset = self._sanitize_filename(dataset_name)
            clean_artifact_type = self._sanitize_filename(artifact_type)
            
            # Generate descriptive object name
            file_ext = metadata.get('extension', 'bin')
            descriptive_name = f"{clean_job_name}_{clean_algorithm}_{clean_dataset}_{clean_artifact_type}"
            object_name = f"artifacts/{descriptive_name}_{timestamp}.{file_ext}"
            
            # Calculate checksum
            checksum = self._calculate_checksum(artifact_data)
            
            # Determine content type
            content_type = metadata.get('content_type', 'application/octet-stream')
            
            # Save to MinIO
            self.minio_client.put_object(
                self.ARTIFACTS_BUCKET,
                object_name,
                BytesIO(artifact_data),
                len(artifact_data),
                content_type=content_type
            )
            
            minio_path = f"s3://{self.ARTIFACTS_BUCKET}/{object_name}"
            logger.info(f"Saved artifact to MinIO: {minio_path}")
            
            # Save metadata to MongoDB
            artifact_doc = {
                "job_id": job_id,
                "name": artifact_name,
                "artifact_type": artifact_type,
                "minio_path": minio_path,
                "minio_bucket": self.ARTIFACTS_BUCKET,
                "minio_object": object_name,
                "content_type": content_type,
                "description": metadata.get('description', ''),
                "size_bytes": len(artifact_data),
                "checksum": checksum,
                "created_at": datetime.utcnow()
            }
            
            result = self.db['artifacts'].insert_one(artifact_doc)
            mongo_id = str(result.inserted_id)
            
            logger.info(f"Saved artifact metadata to MongoDB: {mongo_id}")
            
            return {
                "minio_path": minio_path,
                "mongo_id": mongo_id,
                "object_name": object_name,
                "checksum": checksum
            }
        
        except Exception as e:
            logger.error(f"Error saving artifact: {e}")
            raise
    
    def list_artifacts(self, job_id: str, artifact_type: Optional[str] = None) -> List[Dict]:
        """List artifacts for a job"""
        try:
            query = {"job_id": job_id}
            if artifact_type:
                query["artifact_type"] = artifact_type
            
            artifacts = list(self.db['artifacts'].find(
                query,
                {'_id': 1, 'job_id': 1, 'name': 1, 'artifact_type': 1, 'created_at': 1, 'minio_path': 1}
            ).sort('created_at', -1))
            
            for artifact in artifacts:
                artifact['_id'] = str(artifact['_id'])
            
            return artifacts
        except Exception as e:
            logger.error(f"Error listing artifacts: {e}")
            return []
    
    # ==================== DATASET OPERATIONS ====================
    
    def save_dataset(self, dataset_data: bytes, metadata: Dict[str, Any]) -> Dict[str, str]:
        """Save dataset to MinIO and register in MongoDB"""
        try:
            dataset_name = metadata['name']
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            
            # Create descriptive filename for dataset
            job_name = metadata.get('job_name')
            file_ext = metadata.get('extension', 'csv')
            
            # Clean names to be filesystem-safe
            clean_dataset_name = self._sanitize_filename(dataset_name)
            
            # Generate descriptive object name
            if job_name:
                clean_job_name = self._sanitize_filename(job_name)
                descriptive_name = f"{clean_job_name}_{clean_dataset_name}"
            else:
                descriptive_name = clean_dataset_name
            
            object_name = f"datasets/{descriptive_name}_{timestamp}.{file_ext}"
            
            # Calculate checksum
            checksum = self._calculate_checksum(dataset_data)
            
            # Save to MinIO
            self.minio_client.put_object(
                self.DATASETS_BUCKET,
                object_name,
                BytesIO(dataset_data),
                len(dataset_data),
                content_type='text/csv' if file_ext == 'csv' else 'application/octet-stream'
            )
            
            minio_path = f"s3://{self.DATASETS_BUCKET}/{object_name}"
            logger.info(f"Saved dataset to MinIO: {minio_path}")
            
            # Save metadata to MongoDB
            dataset_doc = {
                "name": dataset_name,
                "minio_path": minio_path,
                "minio_bucket": self.DATASETS_BUCKET,
                "minio_object": object_name,
                "description": metadata.get('description', ''),
                "format": file_ext,
                "size_bytes": len(dataset_data),
                "checksum": checksum,
                "num_rows": metadata.get('num_rows'),
                "num_columns": metadata.get('num_columns'),
                "columns": metadata.get('columns', []),
                "created_at": datetime.utcnow()
            }
            
            result = self.db['datasets'].insert_one(dataset_doc)
            mongo_id = str(result.inserted_id)
            
            logger.info(f"Saved dataset metadata to MongoDB: {mongo_id}")
            
            return {
                "minio_path": minio_path,
                "mongo_id": mongo_id,
                "object_name": object_name,
                "checksum": checksum
            }
        
        except Exception as e:
            logger.error(f"Error saving dataset: {e}")
            raise
    
    def list_datasets(self, limit: int = 100) -> List[Dict]:
        """List all datasets"""
        try:
            datasets = list(self.db['datasets'].find(
                {},
                {
                    '_id': 1, 'name': 1, 'format': 1, 'size_bytes': 1,
                    'num_rows': 1, 'num_columns': 1, 'created_at': 1, 'minio_path': 1
                }
            ).sort('created_at', -1).limit(limit))
            
            for dataset in datasets:
                dataset['_id'] = str(dataset['_id'])
            
            return datasets
        except Exception as e:
            logger.error(f"Error listing datasets: {e}")
            return []
    
    # ==================== JOB OPERATIONS ====================
    
    def save_job(self, job_data: Dict[str, Any]) -> str:
        """Save job information to MongoDB"""
        try:
            job_doc = {
                "job_id": job_data['job_id'],
                "user_id": job_data.get('user_id', 'anonymous'),
                "status": job_data.get('status', 'PENDING'),
                "model_type": job_data.get('model_type'),
                "dataset_path": job_data.get('dataset_path'),
                "hyperparameters": job_data.get('hyperparameters', {}),
                "num_workers": job_data.get('num_workers', 1),
                "epochs": job_data.get('epochs', 1),
                "total_tasks": job_data.get('total_tasks', 0),
                "completed_tasks": job_data.get('completed_tasks', 0),
                "progress": job_data.get('progress', 0.0),
                "current_loss": job_data.get('current_loss', 0.0),
                "current_accuracy": job_data.get('current_accuracy', 0.0),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "started_at": job_data.get('started_at'),
                "completed_at": job_data.get('completed_at')
            }
            
            result = self.db['jobs'].insert_one(job_doc)
            mongo_id = str(result.inserted_id)
            
            logger.info(f"Saved job to MongoDB: {job_data['job_id']}")
            
            return mongo_id
        
        except Exception as e:
            logger.error(f"Error saving job: {e}")
            raise
    
    def update_job(self, job_id: str, updates: Dict[str, Any]) -> bool:
        """Update job information"""
        try:
            updates['updated_at'] = datetime.utcnow()
            
            result = self.db['jobs'].update_one(
                {"job_id": job_id},
                {"$set": updates}
            )
            
            if result.modified_count > 0:
                logger.info(f"Updated job {job_id}")
                return True
            else:
                logger.warning(f"Job {job_id} not found or no changes made")
                return False
        
        except Exception as e:
            logger.error(f"Error updating job: {e}")
            raise
    
    def get_job(self, job_id: str) -> Optional[Dict]:
        """Get job information"""
        try:
            job_doc = self.db['jobs'].find_one({"job_id": job_id})
            if job_doc:
                job_doc['_id'] = str(job_doc['_id'])
            return job_doc
        except Exception as e:
            logger.error(f"Error getting job: {e}")
            return None
    
    def list_jobs(self, user_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """List jobs with optional filtering"""
        try:
            query = {}
            if user_id:
                query['user_id'] = user_id
            if status:
                query['status'] = status
            
            jobs = list(self.db['jobs'].find(
                query,
                {
                    '_id': 1, 'job_id': 1, 'status': 1, 'model_type': 1,
                    'progress': 1, 'created_at': 1, 'completed_at': 1,
                    'current_loss': 1, 'current_accuracy': 1
                }
            ).sort('created_at', -1).limit(limit))
            
            for job in jobs:
                job['_id'] = str(job['_id'])
            
            return jobs
        except Exception as e:
            logger.error(f"Error listing jobs: {e}")
            return []
    
    def get_recent_jobs(self, limit: int = 10) -> List[Dict]:
        """Get most recent jobs"""
        return self.list_jobs(limit=limit)
    
    # ==================== UTILITY METHODS ====================
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics"""
        try:
            stats = {
                "buckets": {},
                "collections": {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # MinIO bucket stats
            for bucket in self.ALL_BUCKETS:
                try:
                    objects = list(self.minio_client.list_objects(bucket, recursive=True))
                    total_size = sum(obj.size for obj in objects)
                    stats["buckets"][bucket] = {
                        "object_count": len(objects),
                        "total_size_bytes": total_size,
                        "total_size_mb": round(total_size / (1024 * 1024), 2)
                    }
                except Exception as e:
                    logger.error(f"Error getting stats for bucket {bucket}: {e}")
                    stats["buckets"][bucket] = {"error": str(e)}
            
            # MongoDB collection stats
            for collection_name in ['models', 'datasets', 'checkpoints', 'artifacts', 'jobs']:
                try:
                    count = self.db[collection_name].count_documents({})
                    stats["collections"][collection_name] = {
                        "document_count": count
                    }
                except Exception as e:
                    logger.error(f"Error getting stats for collection {collection_name}: {e}")
                    stats["collections"][collection_name] = {"error": str(e)}
            
            return stats
        
        except Exception as e:
            logger.error(f"Error getting storage stats: {e}")
            return {"error": str(e)}
    
    def cleanup_old_checkpoints(self, job_id: str, keep_latest: int = 5) -> int:
        """Keep only the latest N checkpoints for a job"""
        try:
            # Get all checkpoints for the job
            checkpoints = list(self.db['checkpoints'].find(
                {"job_id": job_id}
            ).sort('epoch', -1))
            
            if len(checkpoints) <= keep_latest:
                return 0
            
            # Delete older checkpoints
            deleted_count = 0
            for checkpoint in checkpoints[keep_latest:]:
                # Delete from MinIO
                try:
                    self.minio_client.remove_object(
                        checkpoint['minio_bucket'],
                        checkpoint['minio_object']
                    )
                except Exception as e:
                    logger.error(f"Error deleting checkpoint from MinIO: {e}")
                
                # Delete from MongoDB
                self.db['checkpoints'].delete_one({"_id": checkpoint['_id']})
                deleted_count += 1
            
            logger.info(f"Cleaned up {deleted_count} old checkpoints for job {job_id}")
            return deleted_count
        
        except Exception as e:
            logger.error(f"Error cleaning up checkpoints: {e}")
            return 0


# Singleton instance
_storage_manager = None

def get_storage_manager() -> StorageManager:
    """Get singleton instance of StorageManager"""
    global _storage_manager
    if _storage_manager is None:
        _storage_manager = StorageManager()
    return _storage_manager

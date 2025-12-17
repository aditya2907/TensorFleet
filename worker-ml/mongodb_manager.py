"""
MongoDB operations manager
"""
import io
import pickle
from datetime import datetime
from typing import Dict, Any, Optional, List

import pandas as pd
from pymongo import MongoClient
from gridfs import GridFS
from bson import ObjectId

from config import MONGODB_URL, MONGODB_DB, get_logger

logger = get_logger(__name__)


class MongoDBManager:
    """Handles MongoDB connections and operations"""
    
    def __init__(self):
        self.mongo_url = MONGODB_URL
        self.db_name = MONGODB_DB
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
        """
        Fetch dataset from MongoDB
        
        Args:
            dataset_name: Name of the dataset to fetch
            
        Returns:
            DataFrame containing the dataset or None if not found
        """
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
        """
        Save trained model to MongoDB using GridFS
        
        Args:
            model: Trained model object
            metadata: Model metadata dictionary
            
        Returns:
            Model ID string
        """
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
        """
        Load model from MongoDB
        
        Args:
            model_id: Model ID string
            
        Returns:
            Tuple of (model, model_doc)
        """
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
        """
        List available models
        
        Args:
            limit: Maximum number of models to return
            
        Returns:
            List of model metadata dictionaries
        """
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
        """
        Get model metadata
        
        Args:
            model_id: Model ID string
            
        Returns:
            Model metadata dictionary or None
        """
        try:
            model_doc = self.db['models'].find_one({"_id": ObjectId(model_id)})
            if model_doc:
                model_doc['_id'] = str(model_doc['_id'])
                model_doc['file_id'] = str(model_doc['file_id'])
            return model_doc
        except Exception as e:
            logger.error(f"Error getting model metadata {model_id}: {e}")
            return None


def get_db():
    """
    Get MongoDB database and GridFS collection (legacy function)
    
    Returns:
        Tuple of (db, fs)
    """
    client = MongoClient(MONGODB_URL)
    db = client[MONGODB_DB]
    fs = GridFS(db)
    return db, fs

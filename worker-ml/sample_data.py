"""
Sample dataset generator for demonstration purposes
"""
import io
from datetime import datetime

import pandas as pd

from config import get_logger
from mongodb_manager import MongoDBManager

logger = get_logger(__name__)


class SampleDataGenerator:
    """Generates sample datasets for demonstration"""
    
    @staticmethod
    def create_iris_dataset(mongodb_manager: MongoDBManager):
        """
        Create Iris dataset in MongoDB
        
        Args:
            mongodb_manager: MongoDBManager instance
        """
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
        """
        Create Wine dataset in MongoDB
        
        Args:
            mongodb_manager: MongoDBManager instance
        """
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

"""
Storage service client for dataset and model operations
"""
import json
import requests
from io import BytesIO
from typing import Dict, Any
from config import STORAGE_SERVICE_URL, get_logger

logger = get_logger(__name__)


def download_dataset(dataset_path: str) -> str:
    """
    Download dataset from storage service.
    
    Args:
        dataset_path: Path to dataset (s3://bucket/path or bucket/path format)
        
    Returns:
        Local file path to downloaded dataset
    """
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
            raise ValueError(
                "Invalid dataset path format. Expected 's3://<bucket>/<object_name>' "
                "or '<bucket>/<object_name>'."
            )

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
    """
    Save trained model to MinIO storage service.
    
    Args:
        model_data: Serialized model bytes
        metadata: Model metadata dictionary
        
    Returns:
        Response from storage service
    """
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

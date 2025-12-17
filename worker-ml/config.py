"""
Configuration module for TensorFleet ML Worker
"""
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance"""
    return logging.getLogger(name)

# MongoDB Configuration
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://admin:password123@mongodb:27017/tensorfleet?authSource=admin')
MONGODB_DB = os.getenv('MONGODB_DB', 'tensorfleet')

# Storage Service Configuration
STORAGE_SERVICE_URL = os.getenv('STORAGE_SERVICE_URL', 'http://storage:8081')

# Prometheus Metrics Port
METRICS_PORT = 8000

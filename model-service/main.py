#!/usr/bin/env python3
"""
TensorFleet Model Management Service
Provides API endpoints for model operations, downloads, and metadata management
"""

import os
import io
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from flask import Flask, request, jsonify, send_file, Response
from pymongo import MongoClient
from gridfs import GridFS
from bson import ObjectId
from bson.errors import InvalidId
import pickle
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Prometheus metrics
MODEL_DOWNLOADS = Counter('model_downloads_total', 'Total model downloads', ['model_id'])
MODEL_LISTINGS = Counter('model_listings_total', 'Total model listings')
API_REQUESTS = Counter('api_requests_total', 'Total API requests', ['endpoint', 'method'])
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration', ['endpoint'])

app = Flask(__name__)

class ModelService:
    """Model management service with MongoDB integration"""
    
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
    
    def list_models(self, page: int = 1, limit: int = 20, algorithm: Optional[str] = None) -> Dict:
        """List models with pagination and filtering"""
        try:
            skip = (page - 1) * limit
            filter_query = {}
            
            if algorithm:
                filter_query['algorithm'] = algorithm
            
            # Get total count
            total = self.db['models'].count_documents(filter_query)
            
            # Get models
            models = list(self.db['models'].find(filter_query, {
                '_id': 1, 'name': 1, 'algorithm': 1, 'metrics': 1,
                'created_at': 1, 'version': 1, 'job_id': 1, 'status': 1,
                'hyperparameters': 1, 'dataset_name': 1, 'features': 1
            }).sort('created_at', -1).skip(skip).limit(limit))
            
            # Convert ObjectId to string and format dates
            for model in models:
                model['id'] = str(model['_id'])
                del model['_id']
                if 'created_at' in model:
                    model['created_at'] = model['created_at'].isoformat()
            
            return {
                'models': models,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': (total + limit - 1) // limit
                }
            }
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            raise
    
    def get_model_metadata(self, model_id: str) -> Optional[Dict]:
        """Get detailed model metadata"""
        try:
            model_doc = self.db['models'].find_one({"_id": ObjectId(model_id)})
            if model_doc:
                model_doc['id'] = str(model_doc['_id'])
                del model_doc['_id']
                model_doc['file_id'] = str(model_doc['file_id'])
                if 'created_at' in model_doc:
                    model_doc['created_at'] = model_doc['created_at'].isoformat()
            return model_doc
        except InvalidId:
            logger.error(f"Invalid model ID: {model_id}")
            return None
        except Exception as e:
            logger.error(f"Error getting model metadata {model_id}: {e}")
            return None
    
    def download_model(self, model_id: str) -> tuple:
        """Download model file and metadata"""
        try:
            model_doc = self.db['models'].find_one({"_id": ObjectId(model_id)})
            if not model_doc:
                return None, None, "Model not found"
            
            # Get model file from GridFS
            try:
                file = self.fs.get(ObjectId(model_doc['file_id']))
                model_data = file.read()
                filename = f"{model_doc['name']}_{model_doc['version']}.pkl"
                
                return model_data, filename, None
            except Exception as e:
                logger.error(f"Error retrieving model file: {e}")
                return None, None, f"Error retrieving model file: {e}"
            
        except InvalidId:
            return None, None, "Invalid model ID"
        except Exception as e:
            logger.error(f"Error downloading model {model_id}: {e}")
            return None, None, str(e)
    
    def delete_model(self, model_id: str) -> tuple:
        """Delete model and its file"""
        try:
            model_doc = self.db['models'].find_one({"_id": ObjectId(model_id)})
            if not model_doc:
                return False, "Model not found"
            
            # Delete file from GridFS
            self.fs.delete(ObjectId(model_doc['file_id']))
            
            # Delete model document
            self.db['models'].delete_one({"_id": ObjectId(model_id)})
            
            logger.info(f"Deleted model {model_id}")
            return True, "Model deleted successfully"
            
        except InvalidId:
            return False, "Invalid model ID"
        except Exception as e:
            logger.error(f"Error deleting model {model_id}: {e}")
            return False, str(e)
    
    def get_model_statistics(self) -> Dict:
        """Get model statistics"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": "$algorithm",
                        "count": {"$sum": 1},
                        "avg_accuracy": {"$avg": "$metrics.test_accuracy"}
                    }
                },
                {"$sort": {"count": -1}}
            ]
            
            algorithm_stats = list(self.db['models'].aggregate(pipeline))
            
            total_models = self.db['models'].count_documents({})
            
            # Get recent models
            recent_models = list(self.db['models'].find({}, {
                '_id': 1, 'name': 1, 'algorithm': 1, 'created_at': 1
            }).sort('created_at', -1).limit(5))
            
            for model in recent_models:
                model['id'] = str(model['_id'])
                del model['_id']
                if 'created_at' in model:
                    model['created_at'] = model['created_at'].isoformat()
            
            return {
                'total_models': total_models,
                'algorithm_stats': algorithm_stats,
                'recent_models': recent_models
            }
        except Exception as e:
            logger.error(f"Error getting model statistics: {e}")
            return {}

# Initialize service
model_service = ModelService()

@app.before_request
def before_request():
    """Log request details"""
    logger.info(f"{request.method} {request.path} from {request.remote_addr}")

@app.route('/health', methods=['GET'])
@REQUEST_DURATION.labels(endpoint='/health').time()
def health_check():
    """Health check endpoint"""
    API_REQUESTS.labels(endpoint='/health', method='GET').inc()
    try:
        # Test MongoDB connection
        model_service.client.admin.command('ping')
        return jsonify({
            'status': 'healthy', 
            'service': 'model-service',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy', 
            'service': 'model-service',
            'error': str(e)
        }), 503

@app.route('/api/v1/models', methods=['GET'])
@REQUEST_DURATION.labels(endpoint='/models').time()
def list_models():
    """List models with pagination and filtering"""
    API_REQUESTS.labels(endpoint='/models', method='GET').inc()
    MODEL_LISTINGS.inc()
    
    try:
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)  # Max 100 per page
        algorithm = request.args.get('algorithm')
        
        result = model_service.list_models(page=page, limit=limit, algorithm=algorithm)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/models/<model_id>', methods=['GET'])
@REQUEST_DURATION.labels(endpoint='/models/:id').time()
def get_model_metadata(model_id):
    """Get model metadata"""
    API_REQUESTS.labels(endpoint='/models/:id', method='GET').inc()
    
    try:
        metadata = model_service.get_model_metadata(model_id)
        if metadata:
            return jsonify(metadata), 200
        else:
            return jsonify({'error': 'Model not found'}), 404
            
    except Exception as e:
        logger.error(f"Error getting model metadata: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/models/<model_id>/download', methods=['GET'])
@REQUEST_DURATION.labels(endpoint='/models/:id/download').time()
def download_model(model_id):
    """Download model file"""
    API_REQUESTS.labels(endpoint='/models/:id/download', method='GET').inc()
    MODEL_DOWNLOADS.labels(model_id=model_id).inc()
    
    try:
        model_data, filename, error = model_service.download_model(model_id)
        
        if error:
            return jsonify({'error': error}), 404
        
        # Create file-like object from bytes
        model_file = io.BytesIO(model_data)
        
        return send_file(
            model_file,
            as_attachment=True,
            download_name=filename,
            mimetype='application/octet-stream'
        )
        
    except Exception as e:
        logger.error(f"Error downloading model: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/models/<model_id>', methods=['DELETE'])
@REQUEST_DURATION.labels(endpoint='/models/:id').time()
def delete_model(model_id):
    """Delete model"""
    API_REQUESTS.labels(endpoint='/models/:id', method='DELETE').inc()
    
    try:
        success, message = model_service.delete_model(model_id)
        
        if success:
            return jsonify({'message': message}), 200
        else:
            return jsonify({'error': message}), 404
            
    except Exception as e:
        logger.error(f"Error deleting model: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/statistics', methods=['GET'])
@REQUEST_DURATION.labels(endpoint='/statistics').time()
def get_statistics():
    """Get model statistics"""
    API_REQUESTS.labels(endpoint='/statistics', method='GET').inc()
    
    try:
        stats = model_service.get_model_statistics()
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/metrics', methods=['GET'])
def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8083))
    debug = os.getenv('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting Model Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)

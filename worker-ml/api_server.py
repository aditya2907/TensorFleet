#!/usr/bin/env python3
"""
TensorFleet ML Worker API Server
Provides HTTP API endpoints for training jobs
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any
from flask import Flask, request, jsonify, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import sys
sys.path.append('/app')

# Environment variables will be loaded by docker-compose from project .env file

from main import MLWorkerService

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize ML Worker Service
try:
    ml_service = MLWorkerService()
    logger.info("ML Worker Service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize ML Worker Service: {e}")
    ml_service = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if ml_service is None:
        return jsonify({
            'status': 'unhealthy',
            'service': 'ml-worker',
            'error': 'Service not initialized'
        }), 503
    
    try:
        # Test MongoDB connection
        ml_service.mongodb_manager.client.admin.command('ping')
        return jsonify({
            'status': 'healthy',
            'service': 'ml-worker',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': 'ml-worker',
            'error': str(e)
        }), 503

@app.route('/train', methods=['POST'])
def submit_training_job():
    """Submit a training job"""
    if ml_service is None:
        return jsonify({'error': 'Service not initialized'}), 503
    
    try:
        job_data = request.get_json()
        if not job_data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate required fields
        required_fields = ['job_id', 'dataset_path', 'algorithm']
        for field in required_fields:
            if field not in job_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        logger.info(f"Received training job: {job_data['job_id']}")
        
        # Process the training job
        result = ml_service.process_training_job(job_data)
        
        if result['status'] == 'completed':
            return jsonify(result), 200
        else:
            return jsonify(result), 500
        
    except Exception as e:
        logger.error(f"Error processing training job: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/datasets', methods=['GET'])
def list_datasets():
    """List available datasets"""
    if ml_service is None:
        return jsonify({'error': 'Service not initialized'}), 503
    
    try:
        collection = ml_service.mongodb_manager.db['datasets']
        datasets = list(collection.find({}, {
            '_id': 0, 'name': 1, 'description': 1, 
            'n_samples': 1, 'n_features': 1, 'features': 1, 'target_column': 1
        }))
        
        return jsonify({'datasets': datasets}), 200
        
    except Exception as e:
        logger.error(f"Error listing datasets: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/algorithms', methods=['GET'])
def list_algorithms():
    """List supported algorithms"""
    algorithms = [
        {"name": "random_forest", "type": "scikit-learn", "description": "Random Forest Classifier for classification tasks."},
        {"name": "logistic_regression", "type": "scikit-learn", "description": "Logistic Regression for binary/multiclass classification."},
        {"name": "svm", "type": "scikit-learn", "description": "Support Vector Machine for classification tasks."},
        {"name": "decision_tree", "type": "scikit-learn", "description": "Decision Tree Classifier for interpretable models."},
        {"name": "dnn", "type": "tensorflow", "description": "Deep Neural Network for complex classification tasks."},
        {"name": "cnn", "type": "tensorflow", "description": "Convolutional Neural Network for image-based tasks."}
    ]
    return jsonify({"algorithms": algorithms})

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
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting ML Worker API Server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)

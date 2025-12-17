from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from minio import Minio
from minio.error import S3Error
from storage_manager import get_storage_manager, StorageManager
import os
import logging
from io import BytesIO
import json
from datetime import datetime

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Storage Manager
storage_manager = get_storage_manager()

# Legacy MinIO Configuration (for backward compatibility)
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'minio:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
MINIO_SECURE = os.getenv('MINIO_SECURE', 'false').lower() == 'true'

# Initialize MinIO client (for legacy endpoints)
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

# Legacy bucket names - now handled by StorageManager
BUCKETS = ['models', 'datasets', 'checkpoints', 'artifacts', 'jobs']

def ensure_buckets():
    """Ensure all required buckets exist"""
    for bucket in BUCKETS:
        try:
            if not minio_client.bucket_exists(bucket):
                minio_client.make_bucket(bucket)
                logger.info(f"Created bucket: {bucket}")
            else:
                logger.info(f"Bucket already exists: {bucket}")
        except S3Error as e:
            logger.error(f"Error creating bucket {bucket}: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with MinIO and MongoDB connectivity tests"""
    logger.info("=== HEALTH CHECK ENDPOINT CALLED ===")
    try:
        # Test MinIO connectivity
        try:
            minio_client.list_buckets()
            minio_status = 'healthy'
        except Exception as e:
            logger.warning(f"MinIO health check failed: {e}")
            minio_status = 'unhealthy'
        
        # Test MongoDB connectivity  
        try:
            storage_manager.mongo_client.admin.command('ping')
            mongodb_status = 'healthy'
        except Exception as e:
            logger.warning(f"MongoDB health check failed: {e}")
            mongodb_status = 'unhealthy'
        
        # Overall status
        overall_status = 'healthy' if minio_status == 'healthy' and mongodb_status == 'healthy' else 'degraded'
        
        return jsonify({
            'status': overall_status,
            'service': 'storage',
            'components': {
                'minio': minio_status,
                'mongodb': mongodb_status
            }
        }), 200 if overall_status == 'healthy' else 503
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'storage',
            'error': str(e)
        }), 503

@app.route('/api/v1/upload/<bucket>/<path:object_name>', methods=['POST'])
def upload_file(bucket, object_name):
    """Upload a file to MinIO"""
    if bucket not in BUCKETS:
        return jsonify({'error': f'Invalid bucket: {bucket}'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    try:
        # Read file data
        file_data = file.read()
        file_size = len(file_data)
        
        # Upload to MinIO
        minio_client.put_object(
            bucket,
            object_name,
            BytesIO(file_data),
            file_size
        )

        logger.info(f"Uploaded {object_name} to bucket {bucket} ({file_size} bytes)")
        
        return jsonify({
            'message': 'File uploaded successfully',
            'bucket': bucket,
            'object_name': object_name,
            'size': file_size
        }), 201

    except S3Error as e:
        logger.error(f"Error uploading file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/download/<bucket>/<path:object_name>', methods=['GET'])
def download_file(bucket, object_name):
    """Download a file from MinIO"""
    if bucket not in BUCKETS:
        return jsonify({'error': f'Invalid bucket: {bucket}'}), 400

    try:
        response = minio_client.get_object(bucket, object_name)
        
        # Read data
        data = response.read()
        response.close()
        response.release_conn()

        logger.info(f"Downloaded {object_name} from bucket {bucket}")
        
        return send_file(
            BytesIO(data),
            as_attachment=True,
            download_name=object_name.split('/')[-1]
        )

    except S3Error as e:
        logger.error(f"Error downloading file: {e}")
        return jsonify({'error': str(e)}), 404

@app.route('/api/v1/list/<bucket>', methods=['GET'])
def list_objects(bucket):
    """List all objects in a bucket"""
    if bucket not in BUCKETS:
        return jsonify({'error': f'Invalid bucket: {bucket}'}), 400

    try:
        objects = minio_client.list_objects(bucket, recursive=True)
        object_list = []
        
        for obj in objects:
            object_list.append({
                'name': obj.object_name,
                'size': obj.size,
                'last_modified': obj.last_modified.isoformat() if obj.last_modified else None
            })

        return jsonify({
            'bucket': bucket,
            'objects': object_list,
            'count': len(object_list)
        }), 200

    except S3Error as e:
        logger.error(f"Error listing objects: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/delete/<bucket>/<path:object_name>', methods=['DELETE'])
def delete_file(bucket, object_name):
    """Delete a file from MinIO"""
    if bucket not in BUCKETS:
        return jsonify({'error': f'Invalid bucket: {bucket}'}), 400

    try:
        minio_client.remove_object(bucket, object_name)
        logger.info(f"Deleted {object_name} from bucket {bucket}")
        
        return jsonify({
            'message': 'File deleted successfully',
            'bucket': bucket,
            'object_name': object_name
        }), 200

    except S3Error as e:
        logger.error(f"Error deleting file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/buckets', methods=['GET'])
def list_buckets():
    """List all available buckets"""
    return jsonify({
        'buckets': BUCKETS
    }), 200

# ==================== NEW STORAGE MANAGER ENDPOINTS ====================

@app.route('/api/v1/storage/stats', methods=['GET'])
def get_storage_stats():
    """Get comprehensive storage statistics"""
    try:
        stats = storage_manager.get_storage_stats()
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Error getting storage stats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/models', methods=['POST'])
def save_model_metadata():
    """Save model with metadata to both MinIO and MongoDB"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        metadata = json.loads(request.form.get('metadata', '{}'))
        
        if not metadata.get('job_id'):
            return jsonify({'error': 'job_id is required in metadata'}), 400
        
        # Read file data
        model_data = file.read()
        
        # Save using storage manager
        result = storage_manager.save_model(model_data, metadata)
        
        return jsonify({
            'message': 'Model saved successfully',
            'result': result
        }), 201
    
    except Exception as e:
        logger.error(f"Error saving model: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/models', methods=['GET'])
def list_models_endpoint():
    """List all models"""
    try:
        job_id = request.args.get('job_id')
        limit = int(request.args.get('limit', 50))
        
        models = storage_manager.list_models(job_id=job_id, limit=limit)
        
        return jsonify({
            'models': models,
            'count': len(models)
        }), 200
    
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/models/<model_id>', methods=['GET'])
def get_model(model_id):
    """Download a specific model"""
    try:
        model_data, metadata = storage_manager.load_model(mongo_id=model_id)
        
        return send_file(
            BytesIO(model_data),
            as_attachment=True,
            download_name=f"model_{model_id}.pkl",
            mimetype='application/octet-stream'
        )
    
    except Exception as e:
        logger.error(f"Error downloading model: {e}")
        return jsonify({'error': str(e)}), 404

@app.route('/api/v1/checkpoints', methods=['POST'])
def save_checkpoint_endpoint():
    """Save checkpoint to MinIO and MongoDB"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        metadata = json.loads(request.form.get('metadata', '{}'))
        
        if not metadata.get('job_id'):
            return jsonify({'error': 'job_id is required in metadata'}), 400
        
        checkpoint_data = file.read()
        result = storage_manager.save_checkpoint(checkpoint_data, metadata)
        
        return jsonify({
            'message': 'Checkpoint saved successfully',
            'result': result
        }), 201
    
    except Exception as e:
        logger.error(f"Error saving checkpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/checkpoints/<job_id>', methods=['GET'])
def list_checkpoints_endpoint(job_id):
    """List all checkpoints for a job"""
    try:
        checkpoints = storage_manager.list_checkpoints(job_id)
        return jsonify({
            'checkpoints': checkpoints,
            'count': len(checkpoints)
        }), 200
    
    except Exception as e:
        logger.error(f"Error listing checkpoints: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/artifacts', methods=['POST'])
def save_artifact_endpoint():
    """Save artifact to MinIO and MongoDB"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        metadata = json.loads(request.form.get('metadata', '{}'))
        
        if not metadata.get('job_id'):
            return jsonify({'error': 'job_id is required in metadata'}), 400
        
        artifact_data = file.read()
        result = storage_manager.save_artifact(artifact_data, metadata)
        
        return jsonify({
            'message': 'Artifact saved successfully',
            'result': result
        }), 201
    
    except Exception as e:
        logger.error(f"Error saving artifact: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/artifacts/<job_id>', methods=['GET'])
def list_artifacts_endpoint(job_id):
    """List all artifacts for a job"""
    try:
        artifact_type = request.args.get('type')
        artifacts = storage_manager.list_artifacts(job_id, artifact_type)
        return jsonify({
            'artifacts': artifacts,
            'count': len(artifacts)
        }), 200
    
    except Exception as e:
        logger.error(f"Error listing artifacts: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/datasets', methods=['POST'])
def save_dataset_endpoint():
    """Save dataset to MinIO and MongoDB"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        metadata = json.loads(request.form.get('metadata', '{}'))
        
        if not metadata.get('name'):
            metadata['name'] = file.filename
        
        dataset_data = file.read()
        result = storage_manager.save_dataset(dataset_data, metadata)
        
        return jsonify({
            'message': 'Dataset saved successfully',
            'result': result
        }), 201
    
    except Exception as e:
        logger.error(f"Error saving dataset: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/datasets', methods=['GET'])
def list_datasets_endpoint():
    """List all datasets"""
    try:
        limit = int(request.args.get('limit', 100))
        datasets = storage_manager.list_datasets(limit=limit)
        return jsonify({
            'datasets': datasets,
            'count': len(datasets)
        }), 200
    
    except Exception as e:
        logger.error(f"Error listing datasets: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/jobs', methods=['POST'])
def save_job_endpoint():
    """Save job information to MongoDB"""
    try:
        job_data = request.get_json()
        
        if not job_data.get('job_id'):
            return jsonify({'error': 'job_id is required'}), 400
        
        mongo_id = storage_manager.save_job(job_data)
        
        return jsonify({
            'message': 'Job saved successfully',
            'mongo_id': mongo_id
        }), 201
    
    except Exception as e:
        logger.error(f"Error saving job: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/jobs/<job_id>', methods=['GET'])
def get_job_endpoint(job_id):
    """Get job information"""
    try:
        job = storage_manager.get_job(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        return jsonify(job), 200
    
    except Exception as e:
        logger.error(f"Error getting job: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/jobs/<job_id>', methods=['PUT'])
def update_job_endpoint(job_id):
    """Update job information"""
    try:
        updates = request.get_json()
        success = storage_manager.update_job(job_id, updates)
        
        if success:
            return jsonify({'message': 'Job updated successfully'}), 200
        else:
            return jsonify({'error': 'Job not found or no changes made'}), 404
    
    except Exception as e:
        logger.error(f"Error updating job: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/debug-test', methods=['GET'])
def test_debug():
    """Debug test endpoint"""
    logger.info("=== DEBUG TEST ENDPOINT HIT ===")
    return jsonify({'message': 'Debug endpoint working', 'timestamp': datetime.now().isoformat()})

@app.route('/debug-routes', methods=['GET'])
def debug_routes():
    """List all registered routes"""
    logger.info("=== DEBUG ROUTES ENDPOINT HIT ===")
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })
    return jsonify({'routes': routes})

@app.route('/api/v1/jobs/<job_id>/auto-save-model', methods=['POST'])
def auto_save_model_endpoint(job_id):
    """Automatically save model when job completes"""
    logger.info(f"=== AUTO-SAVE ENDPOINT CALLED FOR JOB: {job_id} ===")
    try:
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request path: {request.path}")
        logger.info(f"Request headers: {dict(request.headers)}")
        
        # Get job information from request body (sent by orchestrator)
        job_data = request.get_json()
        logger.info(f"Auto-save endpoint called for job {job_id}, received data: {job_data}")
        if not job_data:
            logger.error(f"No job data received for job {job_id}")
            return jsonify({'error': 'Job data is required'}), 400
        
        # Verify job ID matches
        if job_data.get('job_id') != job_id:
            return jsonify({'error': 'Job ID mismatch'}), 400
        
        if job_data.get('status') != 'COMPLETED':
            return jsonify({'error': 'Job must be completed to save model'}), 400
        
        # Check if model already exists for this job
        existing_models = storage_manager.list_models(job_id=job_id, limit=1)
        if existing_models:
            return jsonify({
                'message': 'Model already exists for this job',
                'model_id': existing_models[0]['_id']
            }), 200
        
        # Extract dataset name from path (remove file extension if present)
        dataset_path = job_data.get('dataset_path', 'unknown_dataset')
        if '/' in dataset_path:
            dataset_name = dataset_path.split('/')[-1]
        else:
            dataset_name = dataset_path
        
        # Remove common file extensions
        if '.' in dataset_name:
            dataset_name = dataset_name.split('.')[0]
        
        # Create descriptive model name: JobName_ModelType_Dataset
        job_name = job_data.get('job_name', job_id).replace(' ', '_')
        model_type = job_data.get('model_type', 'UnknownModel')
        
        descriptive_model_name = f"{job_name}_{model_type}_{dataset_name}"
        
        # Create model metadata from job information
        model_metadata = {
            'job_id': job_id,
            'name': descriptive_model_name,
            'algorithm': job_data.get('model_type', 'unknown'),
            'hyperparameters': job_data.get('hyperparameters', {}),
            'metrics': {
                'accuracy': job_data.get('current_accuracy', 0.0),
                'loss': job_data.get('current_loss', 0.0),
                'completed_tasks': job_data.get('completed_tasks', 0),
                'total_tasks': job_data.get('total_tasks', 0)
            },
            'version': '1.0',
            'dataset_name': dataset_name,
            'job_name': job_data.get('job_name', job_id),
            'model_type': 'trained'
        }
        
        # Create a model file with job completion data
        model_data = {
            'job_id': job_id,
            'model_type': job_data.get('model_type'),
            'final_metrics': model_metadata['metrics'],
            'hyperparameters': job_data.get('hyperparameters', {}),
            'training_completed_at': datetime.utcnow().isoformat(),
            'auto_saved': True,
            'dataset_path': job_data.get('dataset_path'),
            'epochs': job_data.get('epochs'),
            'num_workers': job_data.get('num_workers')
        }
        
        model_bytes = json.dumps(model_data, indent=2).encode('utf-8')
        
        # Save model using storage manager
        result = storage_manager.save_model(model_bytes, model_metadata)
        
        logger.info(f"Automatically saved model for completed job {job_id}")
        
        return jsonify({
            'message': 'Model automatically saved successfully',
            'model_id': result['mongo_id'],
            'minio_path': result['minio_path']
        }), 201
    
    except Exception as e:
        logger.error(f"Error auto-saving model for job {job_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/jobs', methods=['GET'])
def list_jobs_endpoint():
    """List all jobs with optional filtering"""
    try:
        user_id = request.args.get('user_id')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        
        jobs = storage_manager.list_jobs(user_id=user_id, status=status, limit=limit)
        
        return jsonify({
            'jobs': jobs,
            'count': len(jobs)
        }), 200
    
    except Exception as e:
        logger.error(f"Error listing jobs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/jobs/recent', methods=['GET'])
def get_recent_jobs_endpoint():
    """Get recent jobs"""
    try:
        limit = int(request.args.get('limit', 10))
        jobs = storage_manager.get_recent_jobs(limit=limit)
        return jsonify({
            'jobs': jobs,
            'count': len(jobs)
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting recent jobs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/checkpoints/<job_id>/cleanup', methods=['POST'])
def cleanup_checkpoints_endpoint(job_id):
    """Clean up old checkpoints, keeping only the latest N"""
    try:
        keep_latest = int(request.args.get('keep', 5))
        deleted_count = storage_manager.cleanup_old_checkpoints(job_id, keep_latest)
        
        return jsonify({
            'message': f'Cleaned up {deleted_count} old checkpoints',
            'deleted_count': deleted_count
        }), 200
    
    except Exception as e:
        logger.error(f"Error cleaning up checkpoints: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== DATA SYNCHRONIZATION ENDPOINTS ====================

@app.route('/api/v1/sync', methods=['POST'])
def sync_storage_databases():
    """Synchronize data between MinIO buckets and MongoDB collections"""
    try:
        sync_results = {
            'models': {'synced': 0, 'errors': []},
            'datasets': {'synced': 0, 'errors': []},
            'checkpoints': {'synced': 0, 'errors': []},
            'artifacts': {'synced': 0, 'errors': []},
            'jobs': {'synced': 0, 'errors': []},
        }
        
        # Sync models from MinIO to MongoDB
        try:
            models_in_minio = list(minio_client.list_objects('models', recursive=True))
            for obj in models_in_minio:
                try:
                    # Check if model already exists in MongoDB
                    existing = storage_manager.db.models.find_one({'minio_path': obj.object_name})
                    if not existing:
                        # Extract job_id from filename pattern: {job_id}_{model_type}_{dataset}_{timestamp}.pkl
                        filename = obj.object_name.split('/')[-1].replace('.pkl', '')
                        filename_parts = filename.split('_')
                        
                        # Default metadata
                        model_metadata = {
                            'name': filename,
                            'minio_path': obj.object_name,
                            'bucket': 'models',
                            'size': obj.size,
                            'created_at': obj.last_modified or datetime.utcnow(),
                            'algorithm': 'Unknown',
                            'version': '1.0',
                            'status': 'ready',
                            'hyperparameters': {},
                            'metrics': {}
                        }
                        
                        # Try to extract job_id and lookup real training data
                        if len(filename_parts) >= 1:
                            potential_job_id = filename_parts[0]
                            job_record = storage_manager.db.jobs.find_one({'job_id': potential_job_id})
                            
                            if job_record:
                                # Use real training data from job record
                                model_metadata.update({
                                    'job_id': job_record.get('job_id'),
                                    'name': job_record.get('job_name', filename),
                                    'algorithm': job_record.get('model_type', 'Unknown'),
                                    'hyperparameters': job_record.get('hyperparameters', {}),
                                    'metrics': {
                                        'accuracy': job_record.get('current_accuracy', 0.0),
                                        'loss': job_record.get('current_loss', 0.0),
                                        'completed_tasks': job_record.get('completed_tasks', 0),
                                        'total_tasks': job_record.get('total_tasks', 0),
                                        'status': job_record.get('status', 'unknown')
                                    },
                                    'dataset_name': job_record.get('dataset_path', 'unknown').split('/')[-1].split('.')[0] if job_record.get('dataset_path') else 'unknown',
                                    'epochs': job_record.get('epochs'),
                                    'learning_rate': job_record.get('learning_rate'),
                                    'batch_size': job_record.get('batch_size'),
                                    'optimizer': job_record.get('optimizer'),
                                    'model_type': 'trained'
                                })
                                logger.info(f"Synced model with real training data: {obj.object_name}")
                            else:
                                # Fallback: extract model_type from filename
                                if len(filename_parts) >= 2:
                                    model_type = filename_parts[1]
                                    model_metadata['algorithm'] = model_type
                                    model_metadata['name'] = f"{model_type}_{filename_parts[2] if len(filename_parts) > 2 else 'Unknown'}"
                                    logger.info(f"Synced model with extracted metadata: {obj.object_name}")
                        
                        storage_manager.db.models.insert_one(model_metadata)
                        sync_results['models']['synced'] += 1
                        
                except Exception as e:
                    sync_results['models']['errors'].append(f"Error syncing {obj.object_name}: {str(e)}")
        except Exception as e:
            sync_results['models']['errors'].append(f"Error accessing models bucket: {str(e)}")
        
        # Sync datasets from MinIO to MongoDB
        try:
            datasets_in_minio = list(minio_client.list_objects('datasets', recursive=True))
            for obj in datasets_in_minio:
                try:
                    # Check if dataset already exists in MongoDB
                    existing = storage_manager.db.datasets.find_one({'minio_path': obj.object_name})
                    if not existing:
                        # Create MongoDB entry for MinIO dataset
                        dataset_doc = {
                            'name': obj.object_name.split('/')[-1].replace('.csv', '').replace('.json', ''),
                            'minio_path': obj.object_name,
                            'bucket': 'datasets',
                            'size': obj.size,
                            'created_at': obj.last_modified or datetime.utcnow(),
                            'type': 'file',
                            'format': obj.object_name.split('.')[-1] if '.' in obj.object_name else 'unknown'
                        }
                        storage_manager.db.datasets.insert_one(dataset_doc)
                        sync_results['datasets']['synced'] += 1
                        logger.info(f"Synced dataset: {obj.object_name}")
                except Exception as e:
                    sync_results['datasets']['errors'].append(f"Error syncing {obj.object_name}: {str(e)}")
        except Exception as e:
            sync_results['datasets']['errors'].append(f"Error accessing datasets bucket: {str(e)}")
        
        # Create sample jobs, models, checkpoints, and artifacts if they don't exist
        sample_data = request.json.get('create_samples', False) if request.json else False
        
        if sample_data:
            # Create sample job
            sample_job = {
                'job_id': 'sample_job_001',
                'user_id': 'admin',
                'status': 'completed',
                'algorithm': 'RandomForest',
                'dataset': 'iris',
                'created_at': datetime.utcnow(),
                'completed_at': datetime.utcnow(),
                'hyperparameters': {
                    'n_estimators': 100,
                    'max_depth': 10,
                    'random_state': 42
                },
                'metrics': {
                    'accuracy': 0.95,
                    'precision': 0.94,
                    'recall': 0.96
                }
            }
            
            existing_job = storage_manager.db.jobs.find_one({'job_id': sample_job['job_id']})
            if not existing_job:
                storage_manager.db.jobs.insert_one(sample_job)
                sync_results['jobs']['synced'] += 1
            
            # Create sample model
            sample_model = {
                'job_id': 'sample_job_001',
                'name': 'iris_classifier_v1',
                'algorithm': 'RandomForest',
                'minio_path': f"models/sample_job_001/model_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pkl",
                'bucket': 'models',
                'size': 1024,
                'created_at': datetime.utcnow(),
                'version': '1.0.0',
                'metrics': sample_job['metrics'],
                'status': 'ready'
            }
            
            existing_model = storage_manager.db.models.find_one({'job_id': sample_model['job_id']})
            if not existing_model:
                storage_manager.db.models.insert_one(sample_model)
                sync_results['models']['synced'] += 1
            
            # Create sample checkpoint
            sample_checkpoint = {
                'job_id': 'sample_job_001',
                'epoch': 10,
                'minio_path': f"checkpoints/sample_job_001/checkpoint_epoch_10.pkl",
                'bucket': 'checkpoints',
                'size': 512,
                'created_at': datetime.utcnow(),
                'metrics': {'loss': 0.15, 'accuracy': 0.95}
            }
            
            existing_checkpoint = storage_manager.db.checkpoints.find_one({'job_id': sample_checkpoint['job_id']})
            if not existing_checkpoint:
                storage_manager.db.checkpoints.insert_one(sample_checkpoint)
                sync_results['checkpoints']['synced'] += 1
            
            # Create sample artifact
            sample_artifact = {
                'job_id': 'sample_job_001',
                'artifact_type': 'visualization',
                'name': 'confusion_matrix.png',
                'minio_path': f"artifacts/sample_job_001/confusion_matrix.png",
                'bucket': 'artifacts',
                'size': 256,
                'created_at': datetime.utcnow(),
                'description': 'Confusion matrix visualization'
            }
            
            existing_artifact = storage_manager.db.artifacts.find_one({'job_id': sample_artifact['job_id']})
            if not existing_artifact:
                storage_manager.db.artifacts.insert_one(sample_artifact)
                sync_results['artifacts']['synced'] += 1
        
        return jsonify({
            'message': 'Data synchronization completed',
            'results': sync_results,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error during synchronization: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/storage/validate', methods=['GET'])
def validate_storage_consistency():
    """Validate consistency between MinIO buckets and MongoDB collections"""
    try:
        validation_results = {
            'minio_buckets': {},
            'mongodb_collections': {},
            'consistency_issues': []
        }
        
        # Check MinIO buckets
        for bucket in BUCKETS:
            try:
                objects = list(minio_client.list_objects(bucket, recursive=True))
                validation_results['minio_buckets'][bucket] = {
                    'exists': True,
                    'object_count': len(objects),
                    'total_size': sum(obj.size for obj in objects)
                }
            except Exception as e:
                validation_results['minio_buckets'][bucket] = {
                    'exists': False,
                    'error': str(e)
                }
        
        # Check MongoDB collections
        for collection in ['models', 'datasets', 'checkpoints', 'artifacts', 'jobs']:
            try:
                count = storage_manager.db[collection].count_documents({})
                validation_results['mongodb_collections'][collection] = {
                    'exists': True,
                    'document_count': count
                }
            except Exception as e:
                validation_results['mongodb_collections'][collection] = {
                    'exists': False,
                    'error': str(e)
                }
        
        # Check for consistency issues
        for bucket in ['models', 'datasets', 'checkpoints', 'artifacts']:
            minio_count = validation_results['minio_buckets'].get(bucket, {}).get('object_count', 0)
            mongo_count = validation_results['mongodb_collections'].get(bucket, {}).get('document_count', 0)
            
            if minio_count != mongo_count:
                validation_results['consistency_issues'].append({
                    'type': bucket,
                    'minio_objects': minio_count,
                    'mongodb_documents': mongo_count,
                    'issue': f"Mismatch between MinIO objects ({minio_count}) and MongoDB documents ({mongo_count})"
                })
        
        return jsonify({
            'validation': validation_results,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error during validation: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== LEGACY ENDPOINTS (for backward compatibility) ====================

@app.route('/api/v1/jobs/<job_id>/logs', methods=['GET'])
def stream_logs(job_id):
    """Stream logs for a specific job."""
    # This is a placeholder implementation.
    # In a real-world scenario, you would fetch logs from a logging service
    # or a real-time messaging system like Redis Pub/Sub or Kafka.
    def generate_logs():
        import time
        for i in range(10):
            yield f"data: Log entry {i} for job {job_id}\n\n"
            time.sleep(1)
    return Response(generate_logs(), mimetype='text/event-stream')


if __name__ == '__main__':
    # Buckets are now automatically created by StorageManager
    logger.info("StorageManager initialized with all buckets and collections")
    port = int(os.getenv('PORT', 8081))
    logger.info(f"Starting storage service on port {port}")
    app.run(host='0.0.0.0', port=port)

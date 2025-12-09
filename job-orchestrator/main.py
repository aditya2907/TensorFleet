from flask import Flask, request, jsonify
from celery import Celery
import os
import uuid
from datetime import datetime
from minio import Minio
from minio.error import S3Error
import redis
import requests
import threading

app = Flask(__name__)

# Use Redis for job metadata storage
redis_client = redis.Redis(host=os.getenv('REDIS_HOST', 'localhost'), port=6379, db=0, decode_responses=True)

# Celery configuration
celery_app = Celery(
    'tasks',
    broker=os.getenv('CELERY_BROKER_URL', 'amqp://user:password@rabbitmq:5672/'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'rpc://')
)

# MinIO Client
minio_client = Minio(
    os.getenv('MINIO_URL', 'minio:9000'),
    access_key=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
    secret_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
    secure=False
)

def auto_save_model(job_id):
    """Automatically save model when job completes"""
    try:
        storage_url = os.getenv('STORAGE_SERVICE_URL', 'http://storage:8081')
        url = f"{storage_url}/api/v1/jobs/{job_id}/auto-save-model"
        
        response = requests.post(url, json={}, timeout=30)
        
        if response.status_code == 201:
            print(f"✅ Successfully auto-saved model for completed job {job_id}")
        elif response.status_code == 200:
            print(f"ℹ️  Model already exists for job {job_id}")
        else:
            print(f"⚠️  Failed to auto-save model for job {job_id} (status: {response.status_code})")
            
    except Exception as e:
        print(f"Warning: Failed to auto-save model for job {job_id}: {e}")

@app.route('/api/v1/jobs', methods=['POST'])
def submit_job():
    """Submits a new training job with enhanced ML configuration."""
    job_data = request.get_json()
    
    # Validate required fields
    required_fields = ['model_type', 'dataset_path', 'job_name']
    for field in required_fields:
        if not job_data or field not in job_data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate hyperparameters
    if 'hyperparameters' not in job_data:
        return jsonify({"error": "Missing hyperparameters"}), 400
    
    hyperparams = job_data['hyperparameters']
    required_hyperparams = ['learning_rate', 'batch_size', 'optimizer']
    for param in required_hyperparams:
        if param not in hyperparams:
            return jsonify({"error": f"Missing hyperparameter: {param}"}), 400

    job_id = str(uuid.uuid4())
    
    try:
        # Create storage buckets for models and checkpoints
        model_bucket = f"models-{job_id}"
        checkpoint_bucket = f"checkpoints-{job_id}"
        if not minio_client.bucket_exists(model_bucket):
            minio_client.make_bucket(model_bucket)
        if not minio_client.bucket_exists(checkpoint_bucket):
            minio_client.make_bucket(checkpoint_bucket)
    except S3Error as e:
        return jsonify({"error": f"Failed to create storage buckets: {e}"}), 500

    # Prepare enhanced job data for worker
    enhanced_job_data = {
        'job_id': job_id,
        'job_name': job_data['job_name'],
        'description': job_data.get('description', ''),
        'model_type': job_data['model_type'],
        'dataset_path': job_data['dataset_path'],
        'num_workers': job_data.get('num_workers', 1),
        'epochs': job_data.get('epochs', 10),
        'hyperparameters': hyperparams,
        'training_config': job_data.get('training_config', {}),
        'metadata': job_data.get('metadata', {}),
        'model_bucket': model_bucket,
        'checkpoint_bucket': checkpoint_bucket,
    }

    # Submit task to Celery worker
    task = celery_app.send_task(
        'worker.train_model',
        args=[enhanced_job_data]
    )

    # Store enhanced job metadata
    job_metadata = {
        "job_id": job_id,
        "task_id": task.id,
        "status": "QUEUED",
        "job_name": job_data['job_name'],
        "model_type": job_data['model_type'],
        "dataset_path": job_data['dataset_path'],
        "num_workers": str(job_data.get('num_workers', 1)),
        "epochs": str(job_data.get('epochs', 10)),
        "created_at": str(datetime.now()),
        "hyperparameters": str(hyperparams),
        "training_config": str(job_data.get('training_config', {})),
        "metadata": str(job_data.get('metadata', {})),
    }
    redis_client.hmset(f"job:{job_id}", job_metadata)
    
    return jsonify({
        "job_id": job_id, 
        "status": "QUEUED",
        "job_name": job_data['job_name'],
        "model_type": job_data['model_type'],
        "message": "Training job submitted successfully"
    }), 202

@app.route('/api/v1/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Gets the status of a specific job with enhanced details."""
    job_info = redis_client.hgetall(f"job:{job_id}")
    if not job_info:
        return jsonify({"error": "Job not found"}), 404

    task_result = celery_app.AsyncResult(job_info['task_id'])
    
    # Update status based on task result
    current_status = task_result.state
    job_info['status'] = current_status
    
    if current_status == 'SUCCESS':
        job_info['result'] = task_result.get()
        job_info['completed_at'] = str(datetime.now())
        
        # Check if this is the first time we're marking it as completed
        if job_info.get('status') != 'COMPLETED':
            job_info['status'] = 'COMPLETED'
            # Trigger auto-save model in background
            threading.Thread(target=auto_save_model, args=(job_id,), daemon=True).start()
    elif current_status == 'FAILURE':
        job_info['error'] = str(task_result.info)
        job_info['failed_at'] = str(datetime.now())
    elif current_status == 'PENDING':
        job_info['status'] = 'QUEUED'
    
    # Convert string values back to appropriate types for display
    if 'hyperparameters' in job_info:
        try:
            import ast
            job_info['hyperparameters'] = ast.literal_eval(job_info['hyperparameters'])
        except:
            pass
    
    redis_client.hset(f"job:{job_id}", "status", job_info['status'])
    
    return jsonify(job_info)

@app.route('/api/v1/jobs', methods=['GET'])
def list_jobs():
    """Lists all submitted jobs with enhanced formatting."""
    job_keys = redis_client.keys('job:*')
    jobs = []
    
    for key in job_keys:
        job_info = redis_client.hgetall(key)
        job_id = key.split(':')[-1]
        
        # Get current task status
        if 'task_id' in job_info:
            task_result = celery_app.AsyncResult(job_info['task_id'])
            job_info['status'] = task_result.state if task_result.state != 'PENDING' else 'QUEUED'
        
        # Format job for frontend consumption
        formatted_job = {
            'job_id': job_id,
            'job_name': job_info.get('job_name', 'Unnamed Job'),
            'model_type': job_info.get('model_type', 'Unknown'),
            'status': job_info.get('status', 'UNKNOWN'),
            'created_at': job_info.get('created_at', ''),
            'num_workers': job_info.get('num_workers', '1'),
            'epochs': job_info.get('epochs', '10'),
        }
        jobs.append(formatted_job)
    
    # Sort by creation time (most recent first)
    jobs.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return jsonify({'jobs': jobs, 'total': len(jobs)})

@app.route('/api/v1/jobs/<job_id>', methods=['DELETE'])
def cancel_job(job_id):
    """Cancels a running or queued job."""
    job_info = redis_client.hgetall(f"job:{job_id}")
    if not job_info:
        return jsonify({"error": "Job not found"}), 404
    
    # Revoke the Celery task
    if 'task_id' in job_info:
        celery_app.control.revoke(job_info['task_id'], terminate=True)
    
    # Update job status
    redis_client.hset(f"job:{job_id}", "status", "CANCELLED")
    redis_client.hset(f"job:{job_id}", "cancelled_at", str(datetime.now()))
    
    return jsonify({
        "message": "Job cancelled successfully",
        "job_id": job_id,
        "status": "CANCELLED"
    })

@app.route('/worker-activity', methods=['GET'])
def get_worker_activity():
    """Gets real-time worker activity data."""
    # This would connect to the orchestrator gRPC service
    # For now, return mock data that matches the structure
    import grpc
    import sys
    sys.path.append('/app/proto')
    
    try:
        from orchestrator import orchestrator_pb2, orchestrator_pb2_grpc
        
        orchestrator_addr = os.getenv('ORCHESTRATOR_ADDR', 'orchestrator:50051')
        channel = grpc.insecure_channel(orchestrator_addr)
        stub = orchestrator_pb2_grpc.OrchestratorServiceStub(channel)
        
        request = orchestrator_pb2.WorkerActivityRequest()
        response = stub.GetWorkerActivity(request, timeout=5.0)
        
        workers = []
        for worker in response.workers:
            workers.append({
                'worker_id': worker.worker_id,
                'status': worker.status,
                'current_task_id': worker.current_task_id,
                'current_job_id': worker.current_job_id,
                'tasks_completed': worker.tasks_completed,
                'last_activity_time': worker.last_activity_time
            })
        
        return jsonify({
            'workers': workers,
            'total_workers': response.total_workers
        })
    except Exception as e:
        # Fallback to empty data if orchestrator is not available
        return jsonify({
            'workers': [],
            'total_workers': 0,
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

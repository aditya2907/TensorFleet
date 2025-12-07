from flask import Flask, request, jsonify
from celery import Celery
import os
import uuid
from minio import Minio
from minio.error import S3Error
import redis

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

@app.route('/jobs', methods=['POST'])
def submit_job():
    """Submits a new training job."""
    job_data = request.get_json()
    if not job_data or 'dataset_name' not in job_data:
        return jsonify({"error": "Missing 'dataset_name' in request"}), 400

    job_id = str(uuid.uuid4())
    
    try:
        model_bucket = f"models-{job_id}"
        checkpoint_bucket = f"checkpoints-{job_id}"
        if not minio_client.bucket_exists(model_bucket):
            minio_client.make_bucket(model_bucket)
        if not minio_client.bucket_exists(checkpoint_bucket):
            minio_client.make_bucket(checkpoint_bucket)
    except S3Error as e:
        return jsonify({"error": f"Failed to create storage buckets: {e}"}), 500

    task = celery_app.send_task(
        'worker.train_model',
        args=[job_id, job_data['dataset_name'], model_bucket, checkpoint_bucket]
    )

    job_metadata = {
        "task_id": task.id,
        "status": "QUEUED",
        "details": str(job_data)
    }
    redis_client.hmset(f"job:{job_id}", job_metadata)
    
    return jsonify({"job_id": job_id, "status": "QUEUED"}), 202

@app.route('/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Gets the status of a specific job."""
    job_info = redis_client.hgetall(f"job:{job_id}")
    if not job_info:
        return jsonify({"error": "Job not found"}), 404

    task_result = celery_app.AsyncResult(job_info['task_id'])
    job_info['status'] = task_result.state
    if task_result.state == 'SUCCESS':
        job_info['result'] = task_result.get()
    elif task_result.state == 'FAILURE':
        job_info['result'] = str(task_result.info)
    
    redis_client.hset(f"job:{job_id}", "status", job_info['status'])
    
    return jsonify(job_info)

@app.route('/jobs', methods=['GET'])
def list_jobs():
    """Lists all submitted jobs."""
    job_keys = redis_client.keys('job:*')
    jobs = {}
    for key in job_keys:
        job_id = key.split(':')[-1]
        jobs[job_id] = redis_client.hgetall(key)
    return jsonify(jobs)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

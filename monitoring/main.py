from flask import Flask, jsonify, request
from flask_cors import CORS
from prometheus_client import Counter, Gauge, Histogram, generate_latest, REGISTRY
import os
import logging
import random
import time

app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # In production, replace with specific origins like ["http://localhost:3000", "http://localhost:3002"]
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-ID", "x-user-id"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus metrics
job_submissions = Counter('tensorfleet_job_submissions_total', 'Total number of job submissions')
active_jobs = Gauge('tensorfleet_active_jobs', 'Number of currently active jobs')
active_workers = Gauge('tensorfleet_active_workers', 'Number of active worker nodes')
task_duration = Histogram('tensorfleet_task_duration_seconds', 'Task execution duration')
training_loss = Gauge('tensorfleet_training_loss', 'Current training loss', ['job_id'])
training_accuracy = Gauge('tensorfleet_training_accuracy', 'Current training accuracy', ['job_id'])

# Mock data for demonstration
jobs_data = {}
workers_data = {}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'monitoring'}), 200

@app.route('/metrics', methods=['GET'])
def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest(REGISTRY)

@app.route('/api/v1/metrics/jobs', methods=['GET'])
def get_job_metrics():
    """Get aggregated job metrics"""
    total_jobs = len(jobs_data)
    running_jobs = sum(1 for j in jobs_data.values() if j.get('status') == 'RUNNING')
    completed_jobs = sum(1 for j in jobs_data.values() if j.get('status') == 'COMPLETED')
    failed_jobs = sum(1 for j in jobs_data.values() if j.get('status') == 'FAILED')

    return jsonify({
        'total_jobs': total_jobs,
        'running_jobs': running_jobs,
        'completed_jobs': completed_jobs,
        'failed_jobs': failed_jobs,
        'active_workers': len(workers_data)
    }), 200

@app.route('/api/v1/metrics/jobs/<job_id>', methods=['GET'])
def get_job_metrics_detail(job_id):
    """Get detailed metrics for a specific job"""
    if job_id not in jobs_data:
        # Auto-register job with default values instead of returning 404
        jobs_data[job_id] = {
            'job_id': job_id,
            'status': 'UNKNOWN',
            'start_time': time.time(),
            'progress': {'percentage': 0, 'current_epoch': 0, 'total_epochs': 10},
            'metrics': {'loss': 0.0, 'accuracy': 0.0},
            'logs': []
        }
        logger.info(f"Auto-registered job {job_id} with default values")

    job = jobs_data[job_id]
    return jsonify(job), 200

@app.route('/api/v1/metrics/jobs/<job_id>', methods=['POST'])
def update_job_metrics(job_id):
    """Update metrics for a specific job"""
    
    data = request.get_json()
    
    if job_id not in jobs_data:
        jobs_data[job_id] = {
            'job_id': job_id,
            'status': 'RUNNING',
            'start_time': time.time()
        }
        job_submissions.inc()
        active_jobs.inc()

    job = jobs_data[job_id]
    
    if 'status' in data:
        old_status = job.get('status')
        new_status = data['status']
        job['status'] = new_status
        
        if old_status == 'RUNNING' and new_status in ['COMPLETED', 'FAILED']:
            active_jobs.dec()
    
    if 'loss' in data:
        job['loss'] = data['loss']
        training_loss.labels(job_id=job_id).set(data['loss'])
    
    if 'accuracy' in data:
        job['accuracy'] = data['accuracy']
        training_accuracy.labels(job_id=job_id).set(data['accuracy'])
    
    if 'progress' in data:
        job['progress'] = data['progress']
    
    job['updated_at'] = time.time()

    return jsonify({'message': 'Metrics updated', 'job': job}), 200

@app.route('/api/v1/metrics/workers', methods=['GET'])
def get_worker_metrics():
    """Get metrics for all workers"""
    return jsonify({
        'workers': list(workers_data.values()),
        'total': len(workers_data)
    }), 200

@app.route('/api/v1/metrics/workers/<worker_id>', methods=['POST'])
def update_worker_metrics(worker_id):
    """Update metrics for a specific worker"""
    from flask import request
    
    data = request.get_json()
    
    if worker_id not in workers_data:
        workers_data[worker_id] = {
            'worker_id': worker_id,
            'status': 'ACTIVE',
            'registered_at': time.time()
        }
        active_workers.inc()

    worker = workers_data[worker_id]
    worker.update(data)
    worker['updated_at'] = time.time()

    return jsonify({'message': 'Worker metrics updated', 'worker': worker}), 200

@app.route('/api/v1/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get dashboard summary data"""
    # Calculate system-wide metrics
    total_jobs = len(jobs_data)
    active_count = sum(1 for j in jobs_data.values() if j.get('status') == 'RUNNING')
    
    # Calculate average metrics
    avg_loss = 0
    avg_accuracy = 0
    if jobs_data:
        losses = [j.get('loss', 0) for j in jobs_data.values() if 'loss' in j]
        accuracies = [j.get('accuracy', 0) for j in jobs_data.values() if 'accuracy' in j]
        avg_loss = sum(losses) / len(losses) if losses else 0
        avg_accuracy = sum(accuracies) / len(accuracies) if accuracies else 0

    return jsonify({
        'system_status': 'HEALTHY',
        'total_jobs': total_jobs,
        'active_jobs': active_count,
        'active_workers': len(workers_data),
        'avg_loss': avg_loss,
        'avg_accuracy': avg_accuracy,
        'timestamp': time.time()
    }), 200

@app.route('/worker-activity', methods=['GET'])
def get_worker_activity():
    """Get real-time worker activity data for visualization"""
    current_time = time.time()
    
    # Format worker data for the WorkerVisualization component
    workers_list = []
    for worker_id, worker_data in workers_data.items():
        last_activity = worker_data.get('updated_at', worker_data.get('registered_at', current_time))
        
        # Determine worker status based on last activity (consider inactive if no update in 30 seconds)
        is_active = (current_time - last_activity) < 30
        status = worker_data.get('status', 'IDLE') if is_active else 'OFFLINE'
        
        workers_list.append({
            'worker_id': worker_id,
            'status': status,
            'current_task_id': worker_data.get('current_task_id', ''),
            'current_job_id': worker_data.get('current_job_id', ''),
            'tasks_completed': worker_data.get('tasks_completed', 0),
            'last_activity_time': last_activity,
            'cpu_usage': worker_data.get('cpu_usage', 0),
            'memory_usage': worker_data.get('memory_usage', 0),
            'uptime': current_time - worker_data.get('registered_at', current_time),
            'is_active': is_active
        })
    
    # Add mock workers if none exist for demonstration
    if not workers_list:
        for i in range(1, 4):
            workers_list.append({
                'worker_id': f'tensorfleet-worker-{i}',
                'status': 'IDLE' if i > 1 else 'BUSY',
                'current_task_id': f'task_{int(current_time)}_{i}' if i == 1 else '',
                'current_job_id': 'demo_job' if i == 1 else '',
                'tasks_completed': i * 5,
                'last_activity_time': current_time - (i * 2),
                'cpu_usage': 20 + (i * 15),
                'memory_usage': 30 + (i * 10),
                'uptime': 3600 + (i * 300),
                'is_active': True
            })
    
    return jsonify({
        'workers': workers_list,
        'total_workers': len(workers_list),
        'active_workers': len([w for w in workers_list if w['is_active']]),
        'busy_workers': len([w for w in workers_list if w['status'] == 'BUSY']),
        'timestamp': current_time
    }), 200

def simulate_metrics():
    """Simulate some metrics for demonstration"""
    # This would be removed in production
    import threading
    
    def update_metrics():
        while True:
            # Simulate random active jobs and workers
            active_jobs.set(random.randint(0, 10))
            active_workers.set(random.randint(2, 8))
            time.sleep(10)
    
    thread = threading.Thread(target=update_metrics, daemon=True)
    thread.start()

if __name__ == '__main__':
    # simulate_metrics()  # Uncomment for demo mode
    port = int(os.getenv('PORT', 8082))
    logger.info(f"Starting monitoring service on port {port}")
    app.run(host='0.0.0.0', port=port)

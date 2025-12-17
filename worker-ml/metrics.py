"""
Prometheus metrics for ML Worker
"""
from prometheus_client import Gauge, Counter, Histogram

# Task execution metrics
TASK_DURATION = Histogram('worker_task_duration_seconds', 'Task execution time')
TASKS_COMPLETED = Counter('worker_tasks_completed_total', 'Completed tasks')
TASKS_FAILED = Counter('worker_tasks_failed_total', 'Failed tasks')

# Model metrics
MODEL_ACCURACY = Gauge('worker_model_accuracy', 'Model accuracy', ['job_id', 'model_type'])
MODELS_TRAINED = Counter('worker_models_trained_total', 'Total models trained', ['model_type'])

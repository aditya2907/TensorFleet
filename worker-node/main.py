from celery import Celery
import os
import time
from prometheus_client import start_http_server, Gauge
from minio import Minio
import tensorflow as tf
from tenacity import retry, stop_after_attempt, wait_fixed

# Prometheus metrics
TRAINING_ACCURACY = Gauge('training_accuracy', 'Current training accuracy', ['job_id'])
TRAINING_LOSS = Gauge('training_loss', 'Current training loss', ['job_id'])

# Start Prometheus metrics server (opt-in; avoids port clashes when several
# workers share a host or metrics are not needed)
if os.getenv('WORKER_METRICS_ENABLED', 'false').lower() == 'true':
    try:
        start_http_server(8001)
    except OSError as e:
        print(f"Warning: could not start metrics server on port 8001: {e}")

# Celery App
celery_app = Celery(
    'worker',
    broker=os.getenv('CELERY_BROKER_URL', 'amqp://guest:guest@rabbitmq:5672//')
)

# MinIO Client
minio_client = Minio(
    os.getenv('MINIO_URL', 'minio:9000'),
    access_key=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
    secret_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
    secure=False
)

@retry(stop=stop_after_attempt(3), wait=wait_fixed(5))
def upload_to_minio(bucket_name, object_name, file_path):
    minio_client.fput_object(bucket_name, object_name, file_path)

@celery_app.task(name='worker.train_model', bind=True)
def train_model(self, job_data):
    """
    A mock training task that simulates a DL model training.

    Accepts a single job_data dict (as sent by the job-orchestrator) and
    extracts the fields it needs with sensible defaults.
    """
    job_data = job_data or {}
    job_id = job_data.get('job_id') or getattr(self.request, 'id', None) or 'unknown'
    dataset_name = job_data.get('dataset_path') or job_data.get('dataset') or 'mnist'
    model_bucket = job_data.get('model_bucket') or f"models-{job_id}"
    checkpoint_bucket = job_data.get('checkpoint_bucket') or f"checkpoints-{job_id}"

    self.update_state(state='STARTED', meta={'job_id': job_id})

    print(f"Starting training for job {job_id} with dataset {dataset_name}")

    # 1. Load dataset (mock: from TensorFlow datasets)
    (x_train, y_train), _ = tf.keras.datasets.mnist.load_data()
    x_train = x_train / 255.0

    # 2. Define a simple model
    model = tf.keras.models.Sequential([
        tf.keras.layers.Flatten(input_shape=(28, 28)),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dense(10, activation='softmax')
    ])
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

    # 3. Simulate training loop
    epochs = 5
    for epoch in range(epochs):
        print(f"Job {job_id}: Epoch {epoch+1}/{epochs}")
        history = model.fit(x_train, y_train, epochs=1, batch_size=64, validation_split=0.2)
        
        acc = history.history['accuracy'][-1]
        loss = history.history['loss'][-1]
        TRAINING_ACCURACY.labels(job_id=job_id).set(acc)
        TRAINING_LOSS.labels(job_id=job_id).set(loss)
        
        if (epoch + 1) % 2 == 0:
            checkpoint_path = f"/tmp/checkpoint_{job_id}_epoch_{epoch+1}.h5"
            model.save(checkpoint_path)
            try:
                upload_to_minio(checkpoint_bucket, f"epoch_{epoch+1}.h5", checkpoint_path)
                print(f"Job {job_id}: Saved checkpoint to {checkpoint_bucket}")
            except Exception as e:
                print(f"Failed to upload checkpoint: {e}")
            finally:
                try:
                    os.remove(checkpoint_path)
                except OSError:
                    pass

        time.sleep(2) # Simulate work

    # 4. Save final model
    final_model_path = f"/tmp/final_model_{job_id}.h5"
    model.save(final_model_path)
    try:
        upload_to_minio(model_bucket, "final_model.h5", final_model_path)
        print(f"Job {job_id}: Saved final model to {model_bucket}")
    except Exception as e:
        print(f"Failed to upload final model: {e}")
        return {"status": "FAILED", "error": f"Model upload failed: {e}", "job_id": job_id}
    finally:
        try:
            os.remove(final_model_path)
        except OSError:
            pass

    return {"status": "COMPLETED", "model_location": model_bucket}

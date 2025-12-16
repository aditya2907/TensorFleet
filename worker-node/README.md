# Worker Node Service

The Worker Node service provides additional Python-based worker capabilities for specialized ML tasks, data processing, and integration with external services in the TensorFleet platform. Features MongoDB Atlas cloud integration and supports semantic model naming for enhanced model management.

## 🏗️ Architecture

The Worker Node complements the main Go-based workers:
- **Specialized Processing**: Python-specific ML libraries and data processing
- **External Integrations**: API integrations and external service connections
- **Data Pipeline Support**: ETL operations and data transformation
- **Custom Algorithms**: Support for custom Python-based ML algorithms
- **Async Processing**: Asynchronous task processing with Celery
- **Plugin System**: Extensible worker functionality

## ✨ Features

- **Python Ecosystem**: Access to extensive Python ML/data libraries
- **MongoDB Atlas Integration**: Cloud database connectivity for metadata management
- **Semantic Model Naming**: Intelligent naming system (e.g., "RandomForest_95.2%_Dec16")
- **Async Task Processing**: Celery-based distributed task execution
- **Custom Algorithm Support**: Run user-defined Python algorithms
- **Data Processing**: ETL pipelines and data transformation
- **External API Integration**: Connect to external ML services
- **Plugin Architecture**: Extensible functionality through plugins
- **Hybrid Storage**: MinIO for files, MongoDB Atlas for metadata
- **Resource Monitoring**: CPU, memory, and task tracking
- **Health Monitoring**: Service availability and performance tracking

## 📦 Technologies

- **Language**: Python 3.11+
- **Database**: MongoDB Atlas (cloud-hosted)
- **Storage**: MinIO (S3-compatible object storage)
- **Task Queue**: Celery with Redis backend
- **ML Libraries**: scikit-learn, pandas, numpy
- **Data Processing**: pandas, numpy, scipy
- **Monitoring**: Prometheus metrics
- **Containerization**: Docker

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export CELERY_BROKER_URL="redis://redis:6379/0"
export CELERY_RESULT_BACKEND="redis://redis:6379/0"
export WORKER_ID="python-worker-001"

# Start Celery worker
celery -A worker_node.celery worker --loglevel=info
```

### Docker

```bash
# Build image
docker build -t tensorfleet-worker-node .

# Run container
docker run \
  -e CELERY_BROKER_URL=redis://redis:6379/0 \
  -e CELERY_RESULT_BACKEND=redis://redis:6379/0 \
  tensorfleet-worker-node
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CELERY_BROKER_URL` | `redis://redis:6379/0` | Celery broker URL |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/0` | Celery result backend |
| `WORKER_ID` | `auto-generated` | Unique worker identifier |
| `MAX_CONCURRENT_TASKS` | `4` | Maximum concurrent tasks |
| `TASK_TIMEOUT` | `3600` | Default task timeout (seconds) |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `METRICS_PORT` | `9091` | Prometheus metrics port |

### Celery Configuration

```python
# celery_config.py
from celery import Celery

app = Celery('tensorfleet_worker_node')

app.config_from_object({
    'broker_url': 'redis://redis:6379/0',
    'result_backend': 'redis://redis:6379/0',
    'task_serializer': 'json',
    'accept_content': ['json'],
    'result_serializer': 'json',
    'timezone': 'UTC',
    'enable_utc': True,
    'task_track_started': True,
    'task_time_limit': 3600,
    'worker_prefetch_multiplier': 1,
    'worker_max_tasks_per_child': 50
})
```

## 🎯 Supported Task Types

### Data Processing Tasks

```python
@app.task(bind=True)
def process_dataset(self, dataset_path, processing_config):
    """Process datasets with custom transformations"""
    try:
        # Load dataset
        df = pd.read_csv(dataset_path)
        
        # Apply transformations
        for step in processing_config['steps']:
            if step['type'] == 'normalize':
                df = normalize_columns(df, step['columns'])
            elif step['type'] == 'encode':
                df = encode_categorical(df, step['columns'])
            elif step['type'] == 'feature_selection':
                df = select_features(df, step['method'])
        
        # Save processed dataset
        output_path = f"/processed/{self.request.id}.csv"
        df.to_csv(output_path, index=False)
        
        return {
            'status': 'success',
            'output_path': output_path,
            'rows': len(df),
            'columns': list(df.columns)
        }
        
    except Exception as e:
        logger.error(f"Dataset processing failed: {e}")
        raise self.retry(countdown=60, max_retries=3)
```

### Custom Algorithm Training

```python
@app.task(bind=True)
def train_custom_algorithm(self, algorithm_code, dataset_path, parameters):
    """Execute user-defined training algorithms"""
    try:
        # Load dataset
        X, y = load_training_data(dataset_path)
        
        # Create safe execution environment
        exec_globals = {
            'np': np,
            'pd': pd,
            'sklearn': sklearn,
            'X': X,
            'y': y,
            'parameters': parameters
        }
        
        # Execute custom algorithm
        exec(algorithm_code, exec_globals)
        
        # Extract trained model
        trained_model = exec_globals.get('model')
        metrics = exec_globals.get('metrics', {})
        
        # Save model
        model_path = save_model(trained_model, self.request.id)
        
        return {
            'status': 'success',
            'model_path': model_path,
            'metrics': metrics,
            'task_id': self.request.id
        }
        
    except Exception as e:
        logger.error(f"Custom algorithm training failed: {e}")
        return {'status': 'failed', 'error': str(e)}
```

### External API Integration

```python
@app.task(bind=True)
def call_external_ml_service(self, service_config, data):
    """Integrate with external ML services"""
    try:
        # Prepare API request
        headers = {
            'Authorization': f"Bearer {service_config['api_key']}",
            'Content-Type': 'application/json'
        }
        
        # Call external service
        response = requests.post(
            service_config['endpoint'],
            json=data,
            headers=headers,
            timeout=300
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                'status': 'success',
                'result': result,
                'service': service_config['name']
            }
        else:
            raise Exception(f"API call failed: {response.status_code}")
            
    except Exception as e:
        logger.error(f"External service call failed: {e}")
        raise self.retry(countdown=30, max_retries=2)
```

### Data Pipeline Tasks

```python
@app.task(bind=True)
def run_etl_pipeline(self, pipeline_config):
    """Execute ETL data pipelines"""
    try:
        results = []
        
        for step in pipeline_config['steps']:
            if step['type'] == 'extract':
                data = extract_data(step['source'])
            elif step['type'] == 'transform':
                data = transform_data(data, step['transformations'])
            elif step['type'] == 'load':
                load_data(data, step['destination'])
                results.append({
                    'step': step['name'],
                    'status': 'completed',
                    'records_processed': len(data)
                })
        
        return {
            'status': 'success',
            'pipeline': pipeline_config['name'],
            'results': results
        }
        
    except Exception as e:
        logger.error(f"ETL pipeline failed: {e}")
        return {'status': 'failed', 'error': str(e)}
```

## 📊 Task Monitoring

### Prometheus Metrics

```python
from prometheus_client import Counter, Gauge, Histogram, start_http_server

# Task metrics
TASKS_TOTAL = Counter('worker_node_tasks_total', 'Total tasks processed', ['task_type', 'status'])
TASKS_ACTIVE = Gauge('worker_node_tasks_active', 'Currently active tasks')
TASK_DURATION = Histogram('worker_node_task_duration_seconds', 'Task duration', ['task_type'])

# Resource metrics
CPU_USAGE = Gauge('worker_node_cpu_usage_percent', 'CPU usage percentage')
MEMORY_USAGE = Gauge('worker_node_memory_usage_bytes', 'Memory usage in bytes')

def update_metrics():
    """Update Prometheus metrics"""
    # Update resource metrics
    CPU_USAGE.set(psutil.cpu_percent())
    MEMORY_USAGE.set(psutil.virtual_memory().used)
    
    # Update active tasks
    active_tasks = get_active_task_count()
    TASKS_ACTIVE.set(active_tasks)
```

### Health Checks

```python
@app.task
def health_check():
    """Perform comprehensive health check"""
    health_status = {
        'status': 'healthy',
        'worker_id': WORKER_ID,
        'active_tasks': get_active_task_count(),
        'completed_tasks': get_completed_task_count(),
        'failed_tasks': get_failed_task_count(),
        'cpu_usage': psutil.cpu_percent(),
        'memory_usage': psutil.virtual_memory().percent,
        'disk_usage': psutil.disk_usage('/').percent,
        'last_heartbeat': datetime.utcnow().isoformat()
    }
    
    # Check critical thresholds
    if health_status['cpu_usage'] > 90:
        health_status['status'] = 'degraded'
        health_status['warnings'] = ['High CPU usage']
    
    if health_status['memory_usage'] > 85:
        health_status['status'] = 'degraded'
        health_status.setdefault('warnings', []).append('High memory usage')
    
    return health_status
```

## 🔌 Plugin System

### Plugin Interface

```python
class WorkerPlugin:
    """Base class for worker plugins"""
    
    def __init__(self, config=None):
        self.config = config or {}
    
    def initialize(self):
        """Initialize plugin resources"""
        pass
    
    def process_task(self, task_data):
        """Process task with plugin"""
        raise NotImplementedError
    
    def cleanup(self):
        """Clean up plugin resources"""
        pass

class CustomMLPlugin(WorkerPlugin):
    """Example custom ML plugin"""
    
    def process_task(self, task_data):
        # Custom ML processing logic
        model = self.load_custom_model(task_data['model_path'])
        predictions = model.predict(task_data['input_data'])
        return {'predictions': predictions.tolist()}
```

### Plugin Registration

```python
PLUGINS = {}

def register_plugin(name, plugin_class):
    """Register a worker plugin"""
    PLUGINS[name] = plugin_class

def load_plugins():
    """Load all registered plugins"""
    for name, plugin_class in PLUGINS.items():
        try:
            plugin = plugin_class()
            plugin.initialize()
            logger.info(f"Loaded plugin: {name}")
        except Exception as e:
            logger.error(f"Failed to load plugin {name}: {e}")

@app.task
def execute_plugin_task(plugin_name, task_data):
    """Execute task using specified plugin"""
    if plugin_name not in PLUGINS:
        raise ValueError(f"Plugin {plugin_name} not found")
    
    plugin = PLUGINS[plugin_name]()
    return plugin.process_task(task_data)
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests
python -m pytest tests/

# Test with coverage
python -m pytest --cov=worker_node tests/
```

### Task Testing
```python
# Test task execution
from worker_node import process_dataset

# Execute task synchronously for testing
result = process_dataset.apply_async(
    args=['test_dataset.csv', {'steps': [{'type': 'normalize', 'columns': ['age']}]}]
).get()

assert result['status'] == 'success'
```

### Integration Testing
```bash
# Test Celery worker
celery -A worker_node inspect active

# Test task submission
python -c "
from worker_node import process_dataset
result = process_dataset.delay('test.csv', {})
print(result.get())
"
```

## 🔗 Dependencies

### Python Packages

```txt
celery==5.3.4
redis==5.0.1
pandas==2.0.3
scikit-learn==1.3.0
numpy==1.24.3
psutil==5.9.6
prometheus-client==0.17.1
requests==2.31.0
```

### External Services

- **Redis**: Celery broker and result backend
- **Orchestrator**: Task assignment and coordination
- **Monitoring**: Metrics collection and health monitoring
- **Storage**: Data and model file access

## 🛠️ Development

### Project Structure

```
worker-node/
├── main.py              # Celery worker application
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container configuration
├── tasks/              # Task implementations
│   ├── __init__.py
│   ├── data_processing.py
│   ├── ml_tasks.py
│   └── external_apis.py
├── plugins/            # Plugin implementations
│   ├── __init__.py
│   └── custom_plugins.py
└── tests/             # Unit tests
    ├── test_tasks.py
    └── test_plugins.py
```

### Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Redis (for local development)
redis-server

# Start Celery worker
celery -A worker_node worker --loglevel=debug
```

## 🐛 Troubleshooting

### Common Issues

1. **Celery Worker Not Starting**
   ```bash
   # Check Redis connection
   redis-cli ping
   
   # Check Celery configuration
   celery -A worker_node inspect conf
   ```

2. **Task Execution Failures**
   ```python
   # Enable task result tracking
   CELERY_TASK_TRACK_STARTED = True
   
   # Check task status
   result = task.apply_async()
   print(result.state, result.info)
   ```

3. **Memory Issues with Large Tasks**
   ```python
   # Limit worker task count
   worker_max_tasks_per_child = 10
   
   # Monitor memory usage
   import psutil
   print(f"Memory usage: {psutil.virtual_memory().percent}%")
   ```

### Debug Mode

```bash
# Start worker in debug mode
celery -A worker_node worker --loglevel=debug --concurrency=1

# Enable task tracing
export CELERY_TRACE=1
celery -A worker_node worker
```

## 🔒 Security

### Task Isolation

```python
# Restrict execution environment
SAFE_GLOBALS = {
    '__builtins__': {
        'len': len,
        'range': range,
        'enumerate': enumerate
    },
    'np': np,
    'pd': pd
}

def execute_safe_code(code, local_vars):
    """Execute code in restricted environment"""
    exec(code, SAFE_GLOBALS, local_vars)
```

### Input Validation

```python
def validate_task_input(data):
    """Validate task input data"""
    if not isinstance(data, dict):
        raise ValueError("Task data must be a dictionary")
    
    # Check for required fields
    required_fields = ['task_type', 'parameters']
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
```

## 📄 License

Part of the TensorFleet project - see root LICENSE file.

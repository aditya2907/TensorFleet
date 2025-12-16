# 🔄 Job Orchestrator Service

The Job Orchestrator is an **enterprise-grade Python service** that provides **intelligent job management**, advanced queue processing, **ML workflow orchestration**, and **semantic job naming** capabilities for the TensorFleet distributed platform with **MongoDB Atlas** integration.

## 🏗️ Enhanced Architecture  

The Job Orchestrator provides **AI-powered job lifecycle management**:

### 🎯 **Core Capabilities**
- **Intelligent Job Lifecycle**: ML-aware state management and automatic transitions
- **Smart Queuing**: ML workload-optimized priority queuing and resource-aware scheduling  
- **Semantic Job Management**: Clean job naming and enhanced metadata tracking
- **Advanced Workflow Orchestration**: Complex multi-stage ML pipelines with conditional execution
- **Auto-scaling Resource Allocation**: Dynamic resource planning based on job requirements
- **MongoDB Atlas Integration**: Distributed job metadata storage and analytics

### 🚀 **ML-Optimized Features**
- **ML Job Templates**: Predefined configurations for common ML training patterns
- **Batch ML Processing**: Efficient batch submission for hyperparameter tuning
- **Model-aware Scheduling**: Algorithm-specific resource allocation and optimization

## ✨ Features

- **Python-based**: Flexible job management with Python ecosystem
- **Advanced Scheduling**: Priority queues, job dependencies, resource constraints
- **Workflow Support**: Multi-stage jobs with conditional execution
- **Job Templates**: Reusable job configurations for common tasks
- **Resource Management**: CPU/GPU/memory resource tracking and allocation
- **Retry Logic**: Configurable retry mechanisms for failed jobs
- **Job Monitoring**: Detailed progress tracking and logging
- **REST API**: Comprehensive job management interface

## 📦 Technologies

- **Language**: Python 3.11+
- **Framework**: Flask (REST API)
- **Queue System**: Celery with Redis backend
- **Database**: Redis (job metadata)
- **Containerization**: Docker

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export REDIS_URL="redis://redis:6379/0"
export CELERY_BROKER_URL="redis://redis:6379/0"
export PORT="8084"

# Run service
python main.py
```

### Docker

```bash
# Build image
docker build -t tensorfleet-job-orchestrator .

# Run container
docker run -p 8084:8084 \
  -e REDIS_URL=redis://redis:6379/0 \
  -e CELERY_BROKER_URL=redis://redis:6379/0 \
  tensorfleet-job-orchestrator
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8084` | Flask server port |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection string |
| `CELERY_BROKER_URL` | `redis://redis:6379/0` | Celery broker URL |
| `MAX_CONCURRENT_JOBS` | `10` | Maximum concurrent jobs |
| `JOB_TIMEOUT` | `3600` | Default job timeout (seconds) |
| `RETRY_ATTEMPTS` | `3` | Default retry attempts |
| `LOG_LEVEL` | `INFO` | Python logging level |

### Job Configuration Schema

```json
{
  "job_template": {
    "name": "ml_training_template",
    "description": "Standard ML training job",
    "default_parameters": {
      "algorithm": "random_forest",
      "max_epochs": 100,
      "batch_size": 32,
      "learning_rate": 0.001
    },
    "resource_requirements": {
      "cpu_cores": 2,
      "memory_gb": 4,
      "gpu_count": 0,
      "storage_gb": 10
    },
    "execution_steps": [
      {"step": "data_preparation", "timeout": 300},
      {"step": "model_training", "timeout": 1800},
      {"step": "model_evaluation", "timeout": 600},
      {"step": "model_storage", "timeout": 300}
    ]
  }
}
```

## 📚 API Endpoints

### Job Submission

**POST /api/v1/jobs** - Submit new job
```json
{
  "template": "ml_training_template",
  "parameters": {
    "dataset_name": "iris",
    "algorithm": "random_forest",
    "target_column": "species",
    "hyperparameters": {
      "n_estimators": 100,
      "max_depth": 5
    }
  },
  "priority": "high",
  "resources": {
    "cpu_cores": 4,
    "memory_gb": 8
  },
  "dependencies": [],
  "retry_policy": {
    "max_attempts": 3,
    "retry_delay": 60
  }
}
```

**Response:**
```json
{
  "job_id": "job_67890abcdef",
  "status": "QUEUED",
  "message": "Job submitted successfully",
  "estimated_start_time": "2024-01-01T12:05:00Z",
  "queue_position": 3
}
```

### Advanced Job Management

**POST /api/v1/jobs/batch** - Submit multiple jobs
```json
{
  "jobs": [
    {
      "template": "hyperparameter_tuning",
      "parameters": {"algorithm": "svm", "C": 1.0}
    },
    {
      "template": "hyperparameter_tuning", 
      "parameters": {"algorithm": "svm", "C": 10.0}
    }
  ],
  "execution_mode": "parallel"
}
```

**PUT /api/v1/jobs/{job_id}/priority** - Change job priority
```json
{
  "priority": "urgent",
  "reason": "Production model update required"
}
```

**POST /api/v1/jobs/{job_id}/dependencies** - Add job dependencies
```json
{
  "depends_on": ["job_123", "job_456"],
  "dependency_type": "all_complete"
}
```

### Workflow Management

**POST /api/v1/workflows** - Create job workflow
```json
{
  "workflow_name": "complete_ml_pipeline",
  "description": "End-to-end ML pipeline",
  "steps": [
    {
      "step_id": "data_preparation",
      "job_template": "data_preprocessing",
      "parameters": {"dataset": "raw_data.csv"}
    },
    {
      "step_id": "model_training",
      "job_template": "ml_training",
      "depends_on": ["data_preparation"],
      "parameters": {"algorithm": "random_forest"}
    },
    {
      "step_id": "model_evaluation",
      "job_template": "model_evaluation", 
      "depends_on": ["model_training"],
      "parameters": {"test_split": 0.2}
    }
  ]
}
```

### Job Templates

**GET /api/v1/templates** - List available job templates
```json
{
  "templates": [
    {
      "id": "ml_training_template",
      "name": "ML Model Training",
      "description": "Train machine learning models",
      "category": "machine_learning",
      "parameters": [
        {
          "name": "algorithm",
          "type": "string",
          "required": true,
          "options": ["random_forest", "svm", "logistic_regression"]
        },
        {
          "name": "hyperparameters",
          "type": "object",
          "required": false
        }
      ]
    }
  ]
}
```

**POST /api/v1/templates** - Create custom job template
```json
{
  "name": "custom_training_template",
  "description": "Custom training workflow",
  "base_template": "ml_training_template",
  "custom_parameters": {
    "preprocessing_steps": ["normalize", "feature_selection"],
    "validation_strategy": "cross_validation"
  }
}
```

### Queue Management

**GET /api/v1/queue/status** - Get queue status
```json
{
  "queue_length": 15,
  "running_jobs": 8,
  "pending_jobs": 7,
  "queues": {
    "urgent": {
      "length": 2,
      "avg_wait_time": "2m 30s"
    },
    "high": {
      "length": 5,
      "avg_wait_time": "8m 15s"
    },
    "normal": {
      "length": 8,
      "avg_wait_time": "15m 45s"
    }
  }
}
```

**POST /api/v1/queue/reorder** - Reorder queue
```json
{
  "job_id": "job_789",
  "new_position": 1,
  "reason": "Critical production fix"
}
```

## 🔄 Job Lifecycle Management

### Job States

```python
class JobStatus:
    SUBMITTED = "SUBMITTED"      # Job received, validation pending
    QUEUED = "QUEUED"           # Job in queue, waiting for resources
    SCHEDULED = "SCHEDULED"      # Resources allocated, execution pending
    RUNNING = "RUNNING"         # Job currently executing
    PAUSED = "PAUSED"           # Job execution paused
    COMPLETED = "COMPLETED"      # Job finished successfully
    FAILED = "FAILED"           # Job failed with errors
    CANCELLED = "CANCELLED"      # Job cancelled by user
    TIMEOUT = "TIMEOUT"         # Job exceeded time limit
    RETRYING = "RETRYING"       # Job being retried after failure
```

### State Transitions

```python
def transition_job_state(job_id, new_state, reason=None):
    """Manage job state transitions with validation"""
    current_state = get_job_state(job_id)
    
    # Validate state transition
    if not is_valid_transition(current_state, new_state):
        raise InvalidStateTransition(
            f"Cannot transition from {current_state} to {new_state}"
        )
    
    # Update job state
    update_job_state(job_id, new_state, reason)
    
    # Trigger state-specific actions
    handle_state_change(job_id, current_state, new_state)
    
    # Notify subscribers
    notify_state_change(job_id, new_state)
```

## ⚙️ Advanced Scheduling

### Priority-based Scheduling

```python
class JobScheduler:
    """Advanced job scheduler with priority queues"""
    
    def __init__(self):
        self.queues = {
            'urgent': PriorityQueue(),
            'high': PriorityQueue(),
            'normal': PriorityQueue(),
            'low': PriorityQueue()
        }
    
    def schedule_job(self, job):
        """Schedule job based on priority and resources"""
        # Check resource availability
        if not self.check_resource_availability(job.resources):
            self.queue_job(job)
            return
        
        # Allocate resources and start job
        self.allocate_resources(job)
        self.start_job(job)
    
    def queue_job(self, job):
        """Add job to appropriate priority queue"""
        priority_queue = self.queues[job.priority]
        priority_queue.put((job.submit_time, job))
```

### Resource Management

```python
class ResourceManager:
    """Manage compute resources across jobs"""
    
    def __init__(self):
        self.total_resources = {
            'cpu_cores': 64,
            'memory_gb': 256,
            'gpu_count': 8,
            'storage_gb': 1000
        }
        self.allocated_resources = defaultdict(int)
    
    def can_allocate(self, required_resources):
        """Check if resources can be allocated"""
        for resource, amount in required_resources.items():
            available = (self.total_resources[resource] - 
                        self.allocated_resources[resource])
            if amount > available:
                return False
        return True
    
    def allocate(self, job_id, resources):
        """Allocate resources to job"""
        if self.can_allocate(resources):
            for resource, amount in resources.items():
                self.allocated_resources[resource] += amount
            return True
        return False
```

## 🔧 Workflow Engine

### Workflow Execution

```python
class WorkflowEngine:
    """Execute complex multi-step workflows"""
    
    def execute_workflow(self, workflow):
        """Execute workflow with dependency management"""
        execution_graph = self.build_execution_graph(workflow)
        
        while not execution_graph.is_complete():
            # Find ready-to-execute steps
            ready_steps = execution_graph.get_ready_steps()
            
            # Execute steps in parallel where possible
            for step in ready_steps:
                self.execute_step(step)
            
            # Update execution graph
            execution_graph.update_completion_status()
    
    def execute_step(self, step):
        """Execute individual workflow step"""
        # Create job from step template
        job = self.create_job_from_step(step)
        
        # Submit job to orchestrator
        job_id = self.submit_job(job)
        
        # Monitor job completion
        self.monitor_job(job_id, step)
```

## 📊 Job Analytics

### Performance Tracking

```python
def collect_job_analytics():
    """Collect comprehensive job analytics"""
    analytics = {
        'throughput': {
            'jobs_per_hour': calculate_jobs_per_hour(),
            'avg_completion_time': calculate_avg_completion_time(),
            'queue_wait_time': calculate_avg_queue_time()
        },
        'resource_utilization': {
            'cpu_utilization': get_cpu_utilization(),
            'memory_utilization': get_memory_utilization(),
            'gpu_utilization': get_gpu_utilization()
        },
        'success_metrics': {
            'success_rate': calculate_success_rate(),
            'retry_rate': calculate_retry_rate(),
            'failure_analysis': analyze_failure_patterns()
        }
    }
    return analytics
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests
python -m pytest tests/

# Test with coverage
python -m pytest --cov=job_orchestrator tests/
```

### Integration Tests
```bash
# Test job submission
curl -X POST http://localhost:8084/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d @test_job.json

# Test workflow execution
curl -X POST http://localhost:8084/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @test_workflow.json
```

## 🔗 Dependencies

### Python Packages

```txt
Flask==2.3.3
Flask-CORS==4.0.0
celery==5.3.4
redis==5.0.1
pydantic==2.5.0
```

### External Services

- **Redis**: Job metadata storage and Celery broker
- **Main Orchestrator**: Delegates to Go-based orchestrator for execution
- **Workers**: Execute scheduled jobs
- **Monitoring**: Job analytics and performance tracking

## 🛠️ Development

### Project Structure

```
job-orchestrator/
├── main.py              # Flask application and job orchestration logic
├── requirements.txt     # Python dependencies  
├── Dockerfile          # Container configuration
├── celery_app.py       # Celery application setup
├── models/             # Data models and schemas
├── schedulers/         # Scheduling algorithms
├── workflows/          # Workflow engine
└── tests/             # Unit and integration tests
```

### Local Development

```bash
# Start Redis
redis-server

# Start Celery worker
celery -A celery_app worker --loglevel=info

# Start job orchestrator
python main.py
```

## 🐛 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   redis-cli ping
   ```

2. **Celery Worker Not Starting**
   ```bash
   celery -A celery_app inspect active
   ```

3. **Job Stuck in Queue**
   ```python
   # Check resource availability
   GET /api/v1/resources/availability
   ```

## 📄 License

Part of the TensorFleet project - see root LICENSE file.

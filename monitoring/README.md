# 📊 Monitoring Service

The Monitoring Service is the advanced observability and analytics engine of TensorFleet, providing **real-time metrics aggregation**, **intelligent health monitoring**, **auto-scaling analytics**, and comprehensive system insights with **MongoDB Atlas** integration.

## 🚀 Overview

This service acts as the central AI-powered observability platform, collecting and analyzing metrics from all TensorFleet microservices, providing proactive health monitoring, auto-scaling recommendations, and advanced analytics dashboards. Features **cloud-native monitoring** with MongoDB Atlas integration and **intelligent alerting** for production deployments.

## 🏗️ Architecture

```
┌────────────────┐    Metrics    ┌─────────────────┐
│   All Services │──────────────►│   Monitoring    │
│   (Workers,    │    (HTTP/API) │   Service       │
│    API, etc.)  │               │   (Port 8082)   │
└────────────────┘               └─────────────────┘
                                          │
                                          ▼ Analytics
                                 ┌─────────────────┐
                                 │   Dashboard     │
                                 │   (Frontend)    │
                                 └─────────────────┘
```

## 🔌 Key Features

- **Centralized Metrics Collection**: Aggregates metrics from all TensorFleet services
- **Real-time Health Monitoring**: Continuous service health and availability tracking
- **Training Analytics**: Job progress, performance, and resource utilization insights
- **Worker Pool Monitoring**: Individual worker health and load balancing analytics
- **System Performance**: Platform-wide performance metrics and bottleneck detection
- **Metrics Export**: Standard metrics endpoints for external monitoring tools
- **Fallback Monitoring**: Mock data generation when services are unavailable
- **Custom Dashboards**: Configurable monitoring views and visualizations

## 📡 API Endpoints

### Health & Status
- `GET /health` - Service health check
- `GET /api/health` - Extended health with dependencies
- `GET /api/status` - Platform-wide status overview

### Metrics & Analytics  
- `GET /metrics` - Prometheus metrics endpoint
- `GET /api/metrics/jobs` - Job execution analytics
- `GET /api/metrics/workers` - Worker performance metrics
- `GET /api/metrics/system` - System-wide performance data

### Monitoring Data
- `GET /api/worker-activity` - Worker activity and resource usage (fallback)
- `GET /api/jobs/analytics` - Job completion and performance trends
- `GET /api/platform/statistics` - Platform usage statistics

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `8082` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |
| `METRICS_RETENTION` | Metrics retention period | `24h` |
| `PROMETHEUS_PORT` | Prometheus metrics port | `8082` |
| `ORCHESTRATOR_URL` | Orchestrator health check URL | `http://orchestrator:50051` |
| `WORKER_CHECK_INTERVAL` | Worker health check frequency | `30s` |
| `ENABLE_MOCK_DATA` | Enable fallback mock data | `true` |

### Example Configuration

```bash
export PORT=8082
export LOG_LEVEL=INFO
export METRICS_RETENTION=24h
export ORCHESTRATOR_URL=http://orchestrator:50051
export WORKER_CHECK_INTERVAL=30s
export ENABLE_MOCK_DATA=true
```

## 🚀 Running the Service

### Using Docker (Recommended)

```bash
# Build and run with docker-compose
docker-compose up monitoring

# Or build separately
docker build -t tensorfleet-monitoring .
docker run -p 8082:8082 \
  -e ORCHESTRATOR_URL=http://orchestrator:50051 \
  tensorfleet-monitoring
```

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py

```

## 📊 Metrics Collection & Export

### Prometheus Metrics

The service exposes comprehensive metrics for monitoring:

```python
# Core platform metrics
tensorfleet_job_submissions_total        # Total jobs submitted
tensorfleet_active_jobs                  # Currently active jobs  
tensorfleet_completed_jobs_total         # Successfully completed jobs
tensorfleet_failed_jobs_total           # Failed jobs count

# Worker metrics
tensorfleet_active_workers               # Active worker count
tensorfleet_worker_tasks_total          # Tasks completed by worker
tensorfleet_worker_cpu_usage            # Worker CPU utilization
tensorfleet_worker_memory_usage         # Worker memory usage

# Training metrics
tensorfleet_training_loss               # Current training loss
tensorfleet_training_accuracy           # Current model accuracy  
tensorfleet_task_duration_seconds       # Task execution time

# System metrics
tensorfleet_api_requests_total          # API Gateway requests
tensorfleet_system_health_status        # Overall system health
```

### Metrics Endpoints

```bash
# Prometheus metrics scraping endpoint
curl http://localhost:8082/metrics

# Human-readable metrics summary
curl http://localhost:8082/api/metrics/summary

# Real-time platform statistics
curl http://localhost:8082/api/platform/stats
```

## 📈 Analytics & Insights

### Job Performance Analytics

```python
@app.route('/api/analytics/jobs', methods=['GET'])
def get_job_analytics():
    return {
        "total_jobs": job_counter,
        "success_rate": calculate_success_rate(),
        "average_duration": calculate_avg_duration(),
        "performance_trends": get_performance_trends(),
        "resource_utilization": get_resource_metrics()
    }
```

### Worker Pool Analytics

```json
{
  "worker_pool_status": {
    "total_capacity": 12,
    "active_workers": 8,
    "idle_workers": 4,
    "load_distribution": {
      "high_load": 2,
      "medium_load": 4,
      "low_load": 2
    }
  },
  "efficiency_metrics": {
    "average_task_completion": "45s",
    "worker_utilization": "78%",
    "task_queue_length": 3
  }
}
```

## 🚨 Health Monitoring & Alerting

### Service Health Checks

```python
def check_service_health():
    health_status = {
        "orchestrator": check_orchestrator_health(),
        "workers": check_worker_pool_health(),
        "api_gateway": check_api_gateway_health(),
        "storage": check_storage_health(),
        "overall_status": "healthy"
    }
    
    # Determine overall health
    unhealthy_services = [k for k, v in health_status.items() 
                         if v != "healthy" and k != "overall_status"]
    
    if unhealthy_services:
        health_status["overall_status"] = "degraded"
        
    return health_status
```

### Mock Data Generation (Fallback)

When orchestrator is unavailable, the service provides realistic mock data:

```python
def generate_mock_worker_data():
    """Generate realistic worker activity when orchestrator is unavailable"""
    workers = []
    for i in range(3):
        worker_id = f"tensorfleet-worker-{i+1}"
        workers.append({
            "worker_id": worker_id,
            "status": random.choice(["BUSY", "IDLE"]),
            "tasks_completed": random.randint(10, 50),
            "cpu_usage": random.randint(30, 90),
            "memory_usage": random.randint(40, 85),
            "is_active": True,
            "last_activity_time": int(time.time())
        })
    
    return {
        "total_workers": len(workers),
        "active_workers": len([w for w in workers if w["is_active"]]),
        "busy_workers": len([w for w in workers if w["status"] == "BUSY"]),
        "workers": workers
    }
```

## 🔍 Real-time Monitoring

### Live Dashboard Data

```bash
# Get real-time worker activity (includes fallback)
curl http://localhost:8082/api/worker-activity

# System health overview
curl http://localhost:8082/api/health

# Live metrics stream
curl http://localhost:8082/api/metrics/live
```

### WebSocket Support (Future Enhancement)

```python
# Planned WebSocket endpoint for real-time updates
@socketio.on('subscribe_metrics')
def handle_metrics_subscription(data):
    room = data.get('room', 'general')
    join_room(room)
    emit('metrics_update', get_latest_metrics(), room=room)
```

## 🐛 Debugging & Troubleshooting

### Health Check Debugging

```bash
# Check monitoring service health
curl http://localhost:8082/health

# Check dependency health
curl http://localhost:8082/api/health

# View service logs
docker logs tensorfleet-monitoring
```

### Common Issues

1. **Missing Orchestrator Connection**
   ```bash
   # Service falls back to mock data
   curl http://localhost:8082/api/worker-activity
   # Should return mock worker data
   ```

2. **Metrics Not Updating**
   ```bash
   # Check Prometheus endpoint
   curl http://localhost:8082/metrics
   
   # Verify update intervals
   export UPDATE_INTERVAL=10s
   ```

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
python -m pytest tests/

# Test with coverage
python -m pytest --cov=main tests/

# Integration tests
python -m pytest tests/integration/
```

### API Testing

```bash
# Test health endpoint
curl -X GET http://localhost:8082/health

# Test metrics endpoint
curl -X GET http://localhost:8082/metrics

# Test analytics endpoint
curl -X GET http://localhost:8082/api/analytics/jobs
```

## 📚 Dependencies

### Python Requirements

```txt
Flask==2.3.2
Flask-CORS==4.0.0
prometheus-client==0.17.0
requests==2.31.0
gunicorn==21.2.0
```

### External Integrations

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Orchestrator**: Real-time worker data (primary)
- **API Gateway**: System health coordination
    "total_cpu_usage": 45.6,
    "total_memory_usage": 78.9,
    "tasks_per_second": 2.3
  }
}
```

### System Metrics

**GET /api/v1/metrics/system** - Get platform-wide metrics
```json
{
  "platform_status": "healthy",
  "services": {
    "api_gateway": {
      "status": "healthy",
      "response_time": 45.2,
      "requests_per_second": 12.5
    },
    "orchestrator": {
      "status": "healthy", 
      "active_jobs": 8,
      "queue_size": 23
    },
    "storage": {
      "status": "healthy",
      "total_size": "15.7 GB",
      "operations_per_second": 5.2
    }
  },
  "resource_usage": {
    "cpu_average": 35.2,
    "memory_average": 62.1,
    "storage_usage": 68.4
  }
}
```

### Analytics Dashboard

**GET /api/v1/dashboard/overview** - Get dashboard data
```json
{
  "summary": {
    "jobs_today": 23,
    "success_rate": 96.8,
    "average_job_time": "4m 32s",
    "active_workers": 4
  },
  "charts": {
    "jobs_over_time": [
      {"timestamp": "2024-01-01T00:00:00Z", "count": 5},
      {"timestamp": "2024-01-01T01:00:00Z", "count": 8}
    ],
    "resource_usage": [
      {"metric": "cpu", "value": 45.2, "threshold": 80},
      {"metric": "memory", "value": 67.8, "threshold": 85}
    ]
  }
}
```

### Health & Status

**GET /health** - Service health check
```json
{
  "status": "healthy",
  "service": "monitoring",
  "uptime": 86400,
  "metrics_collected": 15420,
  "last_update": "2024-01-01T12:00:00Z",
  "dependencies": {
    "prometheus": "healthy",
    "storage": "healthy"
  }
}
```

**GET /metrics** - Prometheus metrics endpoint
```
# Job metrics
tensorfleet_job_submissions_total 156
tensorfleet_active_jobs 12
tensorfleet_completed_jobs 140

# Worker metrics  
tensorfleet_active_workers 4
tensorfleet_worker_cpu_usage{worker_id="worker-001"} 67.8

# System metrics
tensorfleet_api_requests_total{service="api_gateway"} 5420
tensorfleet_response_time_seconds{service="storage"} 0.045
```

## 📊 Real-time Monitoring

### WebSocket Support

```python
from flask_socketio import SocketIO, emit

socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('subscribe_metrics')
def handle_metrics_subscription(data):
    """Subscribe client to real-time metrics updates"""
    job_id = data.get('job_id')
    emit('metrics_update', get_current_metrics(job_id))

def broadcast_metrics_update():
    """Broadcast metrics to all connected clients"""
    socketio.emit('metrics_update', get_latest_metrics())
```

### Live Dashboard Updates

```javascript
// Frontend WebSocket connection
const socket = io('ws://localhost:8082');

socket.on('metrics_update', (data) => {
    updateDashboard(data);
    updateCharts(data.charts);
    updateAlerts(data.alerts);
});

socket.emit('subscribe_metrics', {job_id: 'job-123'});
```

## 📈 Metrics Collection

### Service Integration

```python
class MetricsCollector:
    """Collect metrics from all TensorFleet services"""
    
    def collect_job_metrics(self):
        """Collect job-related metrics"""
        try:
            # Get metrics from API Gateway
            gateway_response = requests.get('http://api-gateway:8080/metrics')
            
            # Get metrics from Orchestrator  
            orchestrator_metrics = self.parse_prometheus_metrics(
                requests.get('http://orchestrator:50051/metrics').text
            )
            
            # Aggregate and store metrics
            self.update_job_metrics(orchestrator_metrics)
            
        except Exception as e:
            logger.error(f"Failed to collect job metrics: {e}")
    
    def collect_worker_metrics(self):
        """Collect worker performance metrics"""
        worker_metrics = {}
        
        for worker in self.get_active_workers():
            try:
                response = requests.get(f'http://{worker}:2112/metrics')
                metrics = self.parse_prometheus_metrics(response.text)
                worker_metrics[worker] = metrics
            except Exception as e:
                logger.warning(f"Failed to collect metrics from {worker}: {e}")
        
        return worker_metrics
```

### Metrics Aggregation

```python
def aggregate_platform_metrics():
    """Aggregate metrics across all services"""
    aggregated = {
        'total_jobs': 0,
        'active_workers': 0,
        'system_load': 0.0,
        'error_rate': 0.0
    }
    
    # Collect from all services
    for service in SERVICES:
        try:
            metrics = collect_service_metrics(service)
            aggregated = merge_metrics(aggregated, metrics)
        except Exception as e:
            logger.error(f"Failed to collect from {service}: {e}")
    
    # Update Prometheus metrics
    update_prometheus_metrics(aggregated)
    
    return aggregated
```

## 🚨 Alerting System

### Alert Rules

```python
ALERT_RULES = {
    'high_error_rate': {
        'condition': lambda metrics: metrics.get('error_rate', 0) > 5.0,
        'message': 'Error rate above 5%',
        'severity': 'warning'
    },
    'worker_failure': {
        'condition': lambda metrics: metrics.get('active_workers', 0) < 2,
        'message': 'Less than 2 workers active',
        'severity': 'critical'
    },
    'storage_full': {
        'condition': lambda metrics: metrics.get('storage_usage', 0) > 90,
        'message': 'Storage usage above 90%',
        'severity': 'warning'
    }
}
```

### Alert Processing

```python
def process_alerts(metrics):
    """Check metrics against alert rules"""
    active_alerts = []
    
    for rule_name, rule in ALERT_RULES.items():
        if rule['condition'](metrics):
            alert = {
                'rule': rule_name,
                'message': rule['message'],
                'severity': rule['severity'],
                'timestamp': datetime.utcnow().isoformat(),
                'metrics': metrics
            }
            active_alerts.append(alert)
            
            # Send webhook notification
            if ALERT_WEBHOOK_URL:
                send_alert_webhook(alert)
    
    return active_alerts
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests
python -m pytest tests/

# Test with coverage
python -m pytest --cov=monitoring tests/
```

### API Testing
```bash
# Test health endpoint
curl http://localhost:8082/health

# Test metrics collection
curl http://localhost:8082/api/v1/metrics/jobs

# Test Prometheus endpoint
curl http://localhost:8082/metrics
```

### Load Testing
```python
# Test metrics collection performance
import time
import concurrent.futures

def test_metrics_load():
    """Test metrics collection under load"""
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        
        for i in range(100):
            future = executor.submit(collect_platform_metrics)
            futures.append(future)
        
        # Wait for completion
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            assert result is not None
```

## 🔗 Dependencies

## 🔄 Related Services

- [API Gateway](../api-gateway/README.md) - Main entry point and health coordination
- [Orchestrator](../orchestrator/README.md) - Primary source of worker and job data
- [Worker](../worker/README.md) - Individual worker metrics and health
- [Frontend](../frontend/README.md) - Monitoring dashboard and visualizations

## 📝 Configuration Examples

### Grafana Dashboard

```yaml
# grafana-dashboard.yml
apiVersion: 1
datasources:
  - name: TensorFleet
    type: prometheus
    url: http://monitoring:8082
    access: proxy
    isDefault: true

dashboards:
  - name: TensorFleet Overview
    panels:
      - title: Active Jobs
        type: stat
        targets:
          - expr: tensorfleet_active_jobs
      - title: Worker Status
        type: graph
        targets:
          - expr: tensorfleet_active_workers
```

### Python Dependencies

```txt
Flask==2.3.2
Flask-CORS==4.0.0
prometheus-client==0.17.0
requests==2.31.0
gunicorn==21.2.0
python-dotenv==1.0.0
```

```txt
Flask==2.3.3
Flask-CORS==4.0.0
Flask-SocketIO==5.3.6
prometheus-client==0.17.1
requests==2.31.0
```

### External Services

- **Prometheus**: Metrics storage and querying
- **Grafana**: Visualization and dashboards
- **All TensorFleet Services**: Metrics sources
- **WebSocket Clients**: Real-time dashboard updates

## 🛠️ Development

### Project Structure

```
monitoring/
├── main.py              # Flask application and metrics API (208 lines)
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container configuration
├── grafana/            # Grafana configuration
│   ├── dashboards/
│   └── provisioning/
├── prometheus/         # Prometheus configuration  
│   └── prometheus.yml
└── tests/             # Unit tests (optional)
    ├── test_api.py
    ├── test_metrics.py
    └── conftest.py
```

### Grafana Integration

```yaml
# grafana/provisioning/dashboards/tensorfleet.yml
apiVersion: 1

providers:
- name: 'tensorfleet'
  orgId: 1
  type: file
  options:
    path: /etc/grafana/provisioning/dashboards
```

### Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
- job_name: 'tensorfleet-monitoring'
  static_configs:
  - targets: ['monitoring:8082']
  
- job_name: 'tensorfleet-workers'  
  static_configs:
  - targets: ['worker:2112']
```

## 🐛 Troubleshooting

### Common Issues

1. **Metrics Collection Failures**
   ```bash
   # Check service connectivity
   curl http://api-gateway:8080/metrics
   curl http://orchestrator:50051/metrics
   ```

2. **Prometheus Export Issues**
   ```python
   # Validate metrics format
   from prometheus_client import generate_latest
   metrics_output = generate_latest()
   print(metrics_output.decode('utf-8'))
   ```

3. **WebSocket Connection Problems**
   ```javascript
   // Check WebSocket connection
   socket.on('connect_error', (error) => {
       console.log('Connection failed:', error);
   });
   ```

### Debug Mode

```python
# Enable verbose logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable Flask debug mode  
app.debug = True

# Enable SocketIO debug
socketio = SocketIO(app, logger=True, engineio_logger=True)
```

## 📊 Dashboard Configuration

### Custom Metrics

```python
# Add custom business metrics
CUSTOM_METRICS = {
    'models_trained_today': Gauge('models_trained_today', 'Models trained today'),
    'user_activity': Counter('user_activity_total', 'User activity', ['action']),
    'revenue_metrics': Gauge('platform_revenue', 'Platform revenue', ['period'])
}

def update_custom_metrics():
    """Update business-specific metrics"""
    CUSTOM_METRICS['models_trained_today'].set(get_daily_model_count())
    CUSTOM_METRICS['user_activity'].labels(action='login').inc()
```

## 🔒 Security

### Metrics Access Control

```python
@app.before_request
def secure_metrics_access():
    """Secure metrics endpoints"""
    if request.path.startswith('/metrics'):
        token = request.headers.get('Authorization')
        if not validate_prometheus_token(token):
            return jsonify({'error': 'Unauthorized'}), 401
```

## 📄 License

Part of the TensorFleet project - see root LICENSE file.

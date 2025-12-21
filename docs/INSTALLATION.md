# TensorFleet Installation Guide
## Complete Setup and Deployment Instructions

---

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Quick Start](#quick-start)
3. [Development Setup](#development-setup)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores, 2.0 GHz
- **RAM**: 8 GB
- **Storage**: 50 GB free space
- **Network**: 1 Gbps connection
- **OS**: Linux (Ubuntu 20.04+), macOS 10.15+, Windows 10+

### Recommended Requirements
- **CPU**: 8+ cores, 3.0 GHz
- **RAM**: 16 GB+
- **Storage**: 100 GB+ SSD
- **Network**: 10 Gbps connection
- **GPU**: NVIDIA GPU with CUDA support (optional)

### Software Dependencies
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **Node.js**: 18+ (for frontend development)
- **Go**: 1.21+ (for backend development)
- **Python**: 3.9+ (for ML services)

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/aditya2907/TensorFleet.git
cd TensorFleet
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional)
nano .env
```

### 3. Start Services
```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 4. Access Interfaces
- **Frontend Dashboard**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Monitoring (Grafana)**: http://localhost:3001 (admin/admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **Prometheus**: http://localhost:9090

### 5. Submit First Job
```bash
# Submit a test job via API
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user" \
  -d '{
    "model_type": "resnet50",
    "dataset_path": "s3://tensorfleet/datasets/cifar10",
    "hyperparameters": {
      "learning_rate": "0.001",
      "batch_size": "32"
    },
    "num_workers": 3,
    "epochs": 5
  }'
```

---

## Development Setup

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

### Backend Development
```bash
# API Gateway (Go)
cd api-gateway
go mod download
go run main.go

# Orchestrator (Go)
cd orchestrator/cmd/orchestrator
go mod download
go run main.go

# Monitoring Service (Python)
cd monitoring
pip install -r requirements.txt
python main.py
```

### Database Setup
```bash
# Start only databases
docker-compose up -d redis mongodb minio

# Initialize MongoDB
docker exec -it tensorfleet-mongodb mongosh --eval "
  use tensorfleet;
  db.createCollection('jobs');
  db.createCollection('users');
"

# Initialize MinIO buckets
docker exec -it tensorfleet-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it tensorfleet-minio mc mb local/tensorfleet-datasets
docker exec -it tensorfleet-minio mc mb local/tensorfleet-models
```

---

## Production Deployment

### Docker Swarm Deployment
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml tensorfleet

# Scale workers
docker service scale tensorfleet_worker=10
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployment
kubectl get pods -n tensorfleet
```

### AWS ECS Deployment
```bash
# Build and push images
docker build -t your-registry/tensorfleet-frontend:latest ./frontend
docker push your-registry/tensorfleet-frontend:latest

# Deploy via ECS CLI or CloudFormation
ecs-cli compose --file docker-compose.ecs.yml service up
```

### Environment Configuration
```bash
# Production environment variables
export ENVIRONMENT=production
export API_GATEWAY_URL=https://api.tensorfleet.com
export MONITORING_URL=https://monitoring.tensorfleet.com
export DATABASE_URL=mongodb://prod-mongodb:27017/tensorfleet
export REDIS_URL=redis://prod-redis:6379
export STORAGE_ENDPOINT=https://storage.tensorfleet.com
```

---

## Configuration

### Environment Variables

#### Core Services
```bash
# API Gateway
PORT=8080
ORCHESTRATOR_ADDR=orchestrator:50051
REDIS_ADDR=redis:6379

# Orchestrator
ORCHESTRATOR_PORT=50051
REDIS_URL=redis://redis:6379
MONGODB_URL=mongodb://mongodb:27017/tensorfleet

# Monitoring
MONITORING_PORT=8082
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
```

#### Database Configuration
```bash
# MongoDB
MONGODB_URL=mongodb://admin:password@mongodb:27017/tensorfleet?authSource=admin
MONGODB_DB=tensorfleet

# Redis
REDIS_ADDR=redis:6379
REDIS_PASSWORD=your-redis-password

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
```

#### Security Configuration
```bash
# Authentication
JWT_SECRET=your-jwt-secret-key
API_KEY_HEADER=X-API-Key
SESSION_TIMEOUT=3600

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://tensorfleet.com
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-User-ID
```

### Service Configuration Files

#### docker-compose.override.yml
```yaml
# Override for development
version: '3.8'
services:
  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true

  api-gateway:
    volumes:
      - ./api-gateway:/app
    environment:
      - GIN_MODE=debug
```

#### nginx.conf (for production)
```nginx
upstream api_gateway {
    server api-gateway:8080;
}

upstream monitoring {
    server monitoring:8082;
}

server {
    listen 80;
    server_name tensorfleet.com;
    
    location /api/ {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /monitoring/ {
        proxy_pass http://monitoring;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check service logs
docker-compose logs [service-name]

# Check resource usage
docker stats

# Restart specific service
docker-compose restart [service-name]
```

#### Database Connection Issues
```bash
# Test MongoDB connection
docker exec -it tensorfleet-mongodb mongosh --eval "db.runCommand('ping')"

# Test Redis connection
docker exec -it tensorfleet-redis redis-cli ping

# Check network connectivity
docker network ls
docker network inspect tensorfleet_tensorfleet-net
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats --no-stream

# Check service health
curl http://localhost:8080/health
curl http://localhost:8082/health

# Scale workers if needed
docker-compose up -d --scale worker=10
```

### Log Analysis
```bash
# Centralized logging
docker-compose logs -f --tail=100

# Service-specific logs
docker logs tensorfleet-api-gateway -f
docker logs tensorfleet-orchestrator -f
docker logs tensorfleet-monitoring -f

# Export logs for analysis
docker-compose logs > tensorfleet-logs.txt
```

### Performance Tuning
```bash
# Increase worker memory limits
echo 'services:
  worker:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G' >> docker-compose.override.yml

# Optimize database connections
echo 'MONGODB_MAX_POOL_SIZE=100
REDIS_MAX_CONNECTIONS=1000' >> .env
```

### Security Hardening
```bash
# Generate secure secrets
openssl rand -base64 32 > jwt-secret.txt
openssl rand -base64 32 > api-key.txt

# Set proper file permissions
chmod 600 .env
chmod 600 jwt-secret.txt
chmod 600 api-key.txt

# Update default passwords
docker-compose exec mongodb mongosh --eval "
  use admin;
  db.changeUserPassword('admin', 'new-secure-password');
"
```

---

## Monitoring and Maintenance

### Health Checks
```bash
# Automated health check script
#!/bin/bash
services=("api-gateway" "orchestrator" "monitoring" "storage")
for service in "${services[@]}"; do
    if ! curl -f http://localhost:808${service: -1}/health; then
        echo "Service $service is unhealthy"
        docker-compose restart $service
    fi
done
```

### Backup Strategy
```bash
# Database backup
docker exec tensorfleet-mongodb mongodump --out /backup/mongodb-$(date +%Y%m%d)
docker exec tensorfleet-redis redis-cli BGSAVE

# MinIO backup
docker exec tensorfleet-minio mc mirror local/tensorfleet-models /backup/minio/models
docker exec tensorfleet-minio mc mirror local/tensorfleet-datasets /backup/minio/datasets
```

### Updates and Upgrades
```bash
# Update to latest images
docker-compose pull
docker-compose up -d

# Rolling update for zero downtime
docker-compose up -d --no-deps --scale worker=0 worker
docker-compose up -d --no-deps --scale worker=5 worker
```

---


## Building Images and One-step Kubernetes Deployment

We provide helper scripts to build images and deploy the entire system to Kubernetes in one go.

#### Build Docker images locally
```bash
# Build all TensorFleet images (tags: latest by default) and load them into Minikube
bash k8s/build-images.sh --tag latest --load

# Build and push to a registry
bash k8s/build-images.sh --tag v1.0 --push myregistry.example.com

# Build only a single service (fast):
bash k8s/build-images.sh --service api-gateway --tag latest --load
```

#### One-step Kubernetes deployment
```bash
# Deploy the whole system (uses Minikube image loading if Minikube is the current context)
bash k8s/deploy.sh

# Build images first, then deploy (equivalent to running build-images then deploy):
bash k8s/deploy.sh --build-images --tag latest

# Useful options:
# --no-load-images    Skip automatically loading local images into Minikube
# --skip-wait         Don't wait for deployments to become available (faster for CI)
# --build-images, -b  Build images before deploying
```

These scripts are intended for development and local cluster workflows. For production, use a proper image registry and CI/CD pipeline to build and push images, and then reference those images in the Kubernetes manifests.

---

### Secrets and Configuration for Kubernetes

When deploying to Kubernetes using `k8s/deploy.sh`, the script will create a ConfigMap and a Secret with sensible defaults for local development. By default the following are used:

- ConfigMap `tensorfleet-config`:
  - `mongodb-url`: `mongodb://admin:password123@mongodb-service:27017/tensorfleet?authSource=admin` (in-cluster MongoDB)
  - `mongodb-db`: `tensorfleet`
  - `minio-endpoint`: `minio:9000`

- Secret `tensorfleet-secrets` (created if missing):
  - `minio-access-key`: `minioadmin`
  - `minio-secret-key`: `minioadmin`
  - `MONGODB_USERNAME`: `admin`
  - `MONGODB_PASSWORD`: `password123`
  - `jwt-secret`: generated by the deploy script (if missing)

To use MongoDB Atlas instead of the in-cluster MongoDB, set the `mongodb-url` in the `tensorfleet-config` ConfigMap before deploying or patch it after apply:

```bash
# Replace with your Atlas connection string
kubectl patch configmap tensorfleet-config -n tensorfleet --type='json' -p='[{"op":"replace","path":"/data/mongodb-url","value":"mongodb+srv://<your-atlas-conn>"}]'

# Restart the pods that rely on MongoDB (e.g., storage, worker-ml, model-service)
kubectl rollout restart deployment/storage -n tensorfleet
kubectl rollout restart deployment/worker-ml -n tensorfleet
kubectl rollout restart deployment/model-service -n tensorfleet
```

For security, avoid committing production credentials into the repository. Instead, use your cluster's secret management or external secret stores for production deployments.

---

**Last Updated**: December 16, 2025  
**Version**: 1.0.0

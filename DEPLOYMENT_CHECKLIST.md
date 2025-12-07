# TensorFleet MongoDB ML - Deployment Checklist

## ✅ Pre-Deployment Checklist

### Environment Verification
- [ ] Docker installed (version 20.10+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] 8GB+ RAM available
- [ ] 10GB+ disk space available
- [ ] Ports available: 3000, 8000, 8080, 8081, 8082, 8083, 9000, 9001, 9090, 27017

### Repository Setup
- [ ] Repository cloned
- [ ] Navigate to project directory
- [ ] Check all required files present

```bash
cd TensorFleet
ls -la worker-ml/
ls -la model-service/
ls -la docker-compose.yml
```

## 🐳 Docker Deployment Checklist

### 1. Build Services
- [ ] Pull base images
```bash
docker-compose pull
```

- [ ] Build ML Worker
```bash
docker-compose build worker-ml
```

- [ ] Build Model Service
```bash
docker-compose build model-service
```

- [ ] Build all other services
```bash
docker-compose build
```

### 2. Start Services
- [ ] Start all services
```bash
docker-compose up -d
```

- [ ] Wait for services to initialize (60 seconds)
```bash
sleep 60
```

- [ ] Check service status
```bash
docker-compose ps
```

All services should show "healthy" status.

### 3. Health Checks
- [ ] Check MongoDB
```bash
curl -f http://localhost:27017 || echo "MongoDB listening"
```

- [ ] Check ML Worker
```bash
curl http://localhost:8000/health
```

- [ ] Check Model Service
```bash
curl http://localhost:8083/health
```

- [ ] Check API Gateway
```bash
curl http://localhost:8080/health
```

- [ ] Check Storage Service
```bash
curl http://localhost:8081/health
```

- [ ] Check Monitoring
```bash
curl http://localhost:8082/health
```

### 4. Verify MongoDB Connection
- [ ] Connect to MongoDB
```bash
docker exec -it tensorfleet-mongodb mongosh \
  -u admin -p password123 --authenticationDatabase admin
```

- [ ] List databases
```javascript
show dbs
```

- [ ] Verify tensorfleet database
```javascript
use tensorfleet
show collections
```

Should see: `datasets`, `models`, `fs.files`, `fs.chunks`

### 5. Run Initial Tests
- [ ] List datasets
```bash
curl http://localhost:8000/datasets | jq
```

- [ ] List algorithms
```bash
curl http://localhost:8000/algorithms | jq
```

- [ ] Train test model
```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "test_001",
    "dataset_name": "iris",
    "algorithm": "random_forest",
    "model_name": "test_model"
  }' | jq
```

- [ ] List models
```bash
curl http://localhost:8083/api/v1/models | jq
```

### 6. Run Full Demo
- [ ] Make demo script executable
```bash
chmod +x demo-mongodb-ml.sh
```

- [ ] Run demo
```bash
./demo-mongodb-ml.sh
```

- [ ] Verify demo completed successfully
Look for "Demo completed successfully! 🎉"

### 7. Access Web Interfaces
- [ ] Open Frontend: http://localhost:3000
- [ ] Open Grafana: http://localhost:3001 (admin/admin)
- [ ] Open Prometheus: http://localhost:9090
- [ ] Open MinIO: http://localhost:9001 (minioadmin/minioadmin)

## ☸️ Kubernetes Deployment Checklist

### 1. Cluster Preparation
- [ ] Kubernetes cluster available (1.24+)
- [ ] kubectl configured
```bash
kubectl cluster-info
```

- [ ] Create namespace
```bash
kubectl create namespace tensorfleet
```

### 2. Update Configuration
- [ ] Review configmap.yaml
- [ ] Update MongoDB credentials if needed
- [ ] Update image registry URLs
```bash
# Edit all k8s/*.yaml files
# Replace: ghcr.io/your-username/tensorfleet
# With: your-registry/tensorfleet
```

### 3. Build and Push Images
- [ ] Build ML Worker image
```bash
docker build -t your-registry/tensorfleet/worker-ml:latest ./worker-ml
```

- [ ] Build Model Service image
```bash
docker build -t your-registry/tensorfleet/model-service:latest ./model-service
```

- [ ] Push images to registry
```bash
docker push your-registry/tensorfleet/worker-ml:latest
docker push your-registry/tensorfleet/model-service:latest
```

### 4. Deploy Infrastructure
- [ ] Apply namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

- [ ] Apply configmap and secrets
```bash
kubectl apply -f k8s/configmap.yaml
```

- [ ] Deploy infrastructure (Redis, MinIO)
```bash
kubectl apply -f k8s/infrastructure.yaml
```

- [ ] Deploy MongoDB
```bash
kubectl apply -f k8s/mongodb-ml.yaml
```

- [ ] Wait for MongoDB StatefulSet
```bash
kubectl wait --for=condition=ready pod -l app=mongodb \
  -n tensorfleet --timeout=300s
```

### 5. Deploy Application Services
- [ ] Deploy Orchestrator
```bash
kubectl apply -f k8s/orchestrator.yaml
```

- [ ] Deploy API Gateway
```bash
kubectl apply -f k8s/api-gateway.yaml
```

- [ ] Deploy Workers
```bash
kubectl apply -f k8s/worker.yaml
```

- [ ] Deploy Storage
```bash
kubectl apply -f k8s/storage.yaml
```

- [ ] Deploy Monitoring
```bash
kubectl apply -f k8s/monitoring.yaml
```

- [ ] Deploy Frontend
```bash
kubectl apply -f k8s/frontend.yaml
```

### 6. Verify Deployment
- [ ] Check all pods running
```bash
kubectl get pods -n tensorfleet
```

- [ ] Check all services
```bash
kubectl get svc -n tensorfleet
```

- [ ] View logs
```bash
kubectl logs -n tensorfleet -l app=worker-ml --tail=50
kubectl logs -n tensorfleet -l app=model-service --tail=50
kubectl logs -n tensorfleet -l app=mongodb --tail=50
```

### 7. Test Kubernetes Deployment
- [ ] Port-forward Model Service
```bash
kubectl port-forward -n tensorfleet svc/model-service 8083:8083 &
```

- [ ] Port-forward ML Worker
```bash
kubectl port-forward -n tensorfleet svc/worker-ml-service 8000:8000 &
```

- [ ] Run health checks
```bash
curl http://localhost:8083/health
curl http://localhost:8000/health
```

- [ ] Train test model
```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "k8s_test_001",
    "dataset_name": "iris",
    "algorithm": "random_forest",
    "model_name": "k8s_test_model"
  }' | jq
```

- [ ] List models
```bash
curl http://localhost:8083/api/v1/models | jq
```

### 8. Configure Ingress (Optional)
- [ ] Apply ingress
```bash
kubectl apply -f k8s/ingress.yaml
```

- [ ] Get ingress IP
```bash
kubectl get ingress -n tensorfleet
```

- [ ] Update DNS records (if applicable)

## 📊 Post-Deployment Verification

### Monitoring Setup
- [ ] Verify Prometheus scraping targets
```bash
open http://localhost:9090/targets
```

- [ ] Check ML Worker metrics
```bash
curl http://localhost:8000/metrics | grep worker
```

- [ ] Check Model Service metrics
```bash
curl http://localhost:8083/metrics | grep model
```

- [ ] Access Grafana dashboards
```bash
open http://localhost:3001
```

### Functional Testing
- [ ] Train model with each algorithm
  - [ ] random_forest
  - [ ] logistic_regression
  - [ ] svm
  - [ ] decision_tree

- [ ] Test both datasets
  - [ ] iris
  - [ ] wine

- [ ] Download trained model
- [ ] Verify model file can be loaded
- [ ] Check model metadata accuracy
- [ ] Test model deletion

### Performance Testing
- [ ] Train multiple models concurrently
```bash
for i in {1..5}; do
  curl -X POST http://localhost:8000/train \
    -H "Content-Type: application/json" \
    -d "{\"job_id\":\"perf_test_${i}\",\"dataset_name\":\"iris\",\"algorithm\":\"random_forest\",\"model_name\":\"perf_model_${i}\"}" &
done
wait
```

- [ ] List large number of models
```bash
curl "http://localhost:8083/api/v1/models?limit=100" | jq
```

- [ ] Download multiple models simultaneously
- [ ] Check system resource usage

## 🔒 Security Checklist

- [ ] Change default MongoDB password
- [ ] Update MinIO credentials
- [ ] Enable HTTPS/TLS (production)
- [ ] Configure network policies (Kubernetes)
- [ ] Set up authentication for Model Service
- [ ] Enable audit logging
- [ ] Configure backup strategy

## 📝 Documentation Checklist

- [ ] Update team documentation
- [ ] Document custom datasets (if added)
- [ ] Document production URLs
- [ ] Document backup procedures
- [ ] Document rollback procedures
- [ ] Create runbook for common issues

## 🎉 Deployment Complete!

Once all checkboxes are marked, your TensorFleet MongoDB ML platform is fully deployed and operational!

### Next Steps:
1. Monitor system metrics
2. Set up automated backups
3. Configure alerts
4. Train team on usage
5. Begin production ML workloads

### Support Resources:
- README.md - Main documentation
- MONGODB_ML_GUIDE.md - Detailed setup guide
- QUICK_REFERENCE.md - Command reference
- GitHub Issues - Report problems

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Environment**: [ ] Development [ ] Staging [ ] Production

**Notes**: 
_____________________________________________
_____________________________________________
_____________________________________________

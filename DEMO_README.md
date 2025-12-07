# TensorFleet API Demo Scripts

This directory contains demo scripts to test and showcase the TensorFleet distributed training platform APIs.

## Available Demo Scripts

### 1. `quick-api-demo.sh` - Automated Quick Demo ⚡
**Recommended for quick testing**

Fully automated test that runs through all API endpoints without user interaction.

```bash
./quick-api-demo.sh
```

**What it tests:**
- ✅ Health checks for all services
- ✅ Storage operations (upload/download/list)
- ✅ Job submission and monitoring
- ✅ Job cancellation
- ✅ Metrics collection
- ✅ Error handling

**Duration:** ~15 seconds

---

### 2. `demo-api-test.sh` - Interactive Comprehensive Demo 🎯
**Recommended for learning and presentations**

Step-by-step interactive demo with detailed explanations and pause points.

```bash
./demo-api-test.sh
```

**What it includes:**
- 📋 Section 1: Health Checks
- 📦 Section 2: Storage Service Operations
- 🚀 Section 3: Job Submission (ResNet50, BERT, GPT-2)
- 📊 Section 4: Job Monitoring & Progress Tracking
- ❌ Section 5: Job Cancellation
- 📈 Section 6: Monitoring & Metrics
- 🛡️ Section 7: Error Handling
- 📝 Section 8: System Overview
- 🧹 Section 9: Cleanup

**Duration:** 5-10 minutes (with pauses)

---

## Prerequisites

Before running the demos, ensure:

1. **Services are running:**
   ```bash
   docker compose up -d
   ```

2. **Required tools installed:**
   - `curl` - for API requests
   - `jq` - for JSON parsing
   - `bash` - shell (macOS/Linux)

3. **Services are healthy:**
   ```bash
   curl http://localhost:8080/health
   curl http://localhost:8081/health
   curl http://localhost:8082/health
   ```

---

## API Endpoints Reference

### API Gateway (Port 8080)
```bash
# Health check
GET  http://localhost:8080/health

# Submit training job
POST http://localhost:8080/api/v1/jobs
Content-Type: application/json
{
  "model_type": "resnet50",
  "dataset_path": "s3://bucket/path",
  "hyperparameters": {...},
  "num_workers": 3,
  "epochs": 10
}

# Get job status
GET  http://localhost:8080/api/v1/jobs/:job_id

# List all jobs
GET  http://localhost:8080/api/v1/jobs

# Cancel job
DELETE http://localhost:8080/api/v1/jobs/:job_id
```

### Storage Service (Port 8081)
```bash
# Upload file
POST http://localhost:8081/api/v1/upload/:bucket/:object_name
Content-Type: multipart/form-data
file=@/path/to/file

# List files in bucket
GET  http://localhost:8081/api/v1/list/:bucket

# Download file
GET  http://localhost:8081/api/v1/download/:bucket/:object_name

# Available buckets: models, datasets, checkpoints, artifacts
```

### Monitoring Service (Port 8082)
```bash
# Get job metrics
GET  http://localhost:8082/api/v1/metrics/jobs

# Get worker metrics
GET  http://localhost:8082/api/v1/metrics/workers

# Prometheus metrics
GET  http://localhost:8082/metrics
```

---

## Example Usage

### Quick Test - Submit and Monitor a Job
```bash
# Submit job
JOB_ID=$(curl -s -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "resnet50",
    "dataset_path": "s3://tensorfleet/datasets/imagenet",
    "hyperparameters": {"learning_rate": "0.001"},
    "num_workers": 3,
    "epochs": 10
  }' | jq -r '.job_id')

echo "Job ID: $JOB_ID"

# Monitor progress
watch -n 2 "curl -s http://localhost:8080/api/v1/jobs/$JOB_ID | jq"
```

### Upload Dataset
```bash
# Create dataset file
cat > dataset.csv << EOF
epoch,loss,accuracy
1,2.5,0.3
2,1.8,0.5
EOF

# Upload to storage
curl -X POST http://localhost:8081/api/v1/upload/datasets/my_dataset.csv \
  -F "file=@dataset.csv"

# Verify upload
curl http://localhost:8081/api/v1/list/datasets | jq
```

### Check System Status
```bash
# All service health
echo "API Gateway: $(curl -s http://localhost:8080/health | jq -r '.status')"
echo "Storage:     $(curl -s http://localhost:8081/health | jq -r '.status')"
echo "Monitoring:  $(curl -s http://localhost:8082/health | jq -r '.status')"

# Job metrics
curl -s http://localhost:8082/api/v1/metrics/jobs | jq
```

---

## Web Interfaces

Access these URLs in your browser:

- **Frontend**: http://localhost:3000
- **Grafana**: http://localhost:3001 (credentials: admin/admin)
- **Prometheus**: http://localhost:9090
- **MinIO Console**: http://localhost:9001 (credentials: minioadmin/minioadmin)
- **RabbitMQ**: http://localhost:15672 (credentials: guest/guest)

---

## Troubleshooting

### Services not responding
```bash
# Check if services are running
docker compose ps

# View logs
docker compose logs api-gateway
docker compose logs storage
docker compose logs monitoring

# Restart services
docker compose restart
```

### "Connection refused" errors
```bash
# Ensure all services are healthy
docker compose ps | grep healthy

# Wait for health checks to pass (may take 10-30 seconds)
watch docker compose ps
```

### JSON parsing errors
```bash
# Install jq if missing
# macOS:
brew install jq

# Ubuntu/Debian:
sudo apt-get install jq
```

---

## Demo Output Examples

### Successful Job Submission
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Job created with 100 tasks",
  "num_tasks": 100,
  "status": "RUNNING"
}
```

### Job Status Response
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RUNNING",
  "progress": 45,
  "completed_tasks": 45,
  "total_tasks": 100,
  "current_loss": 1.234,
  "current_accuracy": 0.678,
  "message": "Completed 45/100 tasks"
}
```

### File Upload Response
```json
{
  "message": "File uploaded successfully",
  "bucket": "datasets",
  "object_name": "training_data.csv",
  "size": 1024
}
```

---

## Advanced Usage

### Monitor Multiple Jobs Simultaneously
```bash
# Submit multiple jobs
for model in resnet50 bert-base gpt2; do
  curl -s -X POST http://localhost:8080/api/v1/jobs \
    -H "Content-Type: application/json" \
    -d "{
      \"model_type\": \"$model\",
      \"dataset_path\": \"s3://tensorfleet/datasets/data\",
      \"hyperparameters\": {\"learning_rate\": \"0.001\"},
      \"num_workers\": 2,
      \"epochs\": 5
    }"
  sleep 1
done

# Monitor all jobs
curl -s http://localhost:8080/api/v1/jobs | jq
```

### Stress Test - Submit Many Jobs
```bash
# Submit 10 jobs rapidly
for i in {1..10}; do
  curl -s -X POST http://localhost:8080/api/v1/jobs \
    -H "Content-Type: application/json" \
    -d '{
      "model_type": "resnet18",
      "dataset_path": "s3://tensorfleet/datasets/test",
      "hyperparameters": {"learning_rate": "0.001"},
      "num_workers": 1,
      "epochs": 1
    }' &
done
wait

# Check metrics
curl -s http://localhost:8082/api/v1/metrics/jobs | jq
```

---

## Notes

- Jobs are simulated and generate random progress/metrics for demonstration
- Storage uses MinIO S3-compatible object storage
- All data is persisted in Docker volumes
- To reset everything: `docker compose down -v` (removes all data)

---

## Support

For issues or questions:
1. Check service logs: `docker compose logs <service-name>`
2. Verify health: `curl http://localhost:8080/health`
3. Review the PROJECT_SUMMARY.md for architecture details

---

**Happy Testing! 🚀**

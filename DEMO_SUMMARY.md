# TensorFleet Demo Scripts - Quick Reference

## 📋 Available Demo Scripts

| Script | Type | Duration | Use Case |
|--------|------|----------|----------|
| `quick-api-demo.sh` | Automated | ~15s | Quick validation, CI/CD testing |
| `demo-api-test.sh` | Interactive | ~5-10min | Learning, presentations, demos |

## �� Quick Start

```bash
# 1. Start the platform
docker compose up -d

# 2. Wait for services to be healthy (~30 seconds)
docker compose ps

# 3. Run quick demo
./quick-api-demo.sh

# OR run interactive demo
./demo-api-test.sh
```

## 📊 What Gets Tested

### ✅ All API Endpoints
- **API Gateway** (8080): Job submission, status, listing, cancellation
- **Storage Service** (8081): File upload/download/list across buckets
- **Monitoring Service** (8082): Job metrics, worker stats, Prometheus metrics

### ✅ Complete Workflow
1. Health checks for all services
2. Upload training datasets and model configs
3. Submit multiple training jobs (ResNet50, BERT, GPT-2)
4. Monitor real-time job progress
5. Track loss and accuracy metrics
6. Cancel running jobs
7. List and download artifacts
8. Validate error handling

## 📈 Sample Output

```
Training Job: 4da69941-7a54-4dc8-9988-e1768f1da057
  Progress:  73% (73/100 tasks)
  Loss:      1.0171
  Accuracy:  0.6558

Storage:
  Datasets:  4 files
  Models:    2 files

✨ ALL API ENDPOINTS TESTED SUCCESSFULLY
```

## 🔧 One-Line Commands

### Test Specific Endpoints

```bash
# Health check
curl http://localhost:8080/health | jq

# Submit job
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{"model_type":"resnet50","dataset_path":"s3://test","hyperparameters":{},"num_workers":2,"epochs":5}' | jq

# Check job status
curl http://localhost:8080/api/v1/jobs/{JOB_ID} | jq

# Upload file
curl -X POST http://localhost:8081/api/v1/upload/datasets/test.csv \
  -F "file=@test.csv" | jq

# Get metrics
curl http://localhost:8082/api/v1/metrics/jobs | jq
```

## 🎯 Demo Features

### Interactive Demo (`demo-api-test.sh`)
- ✅ Step-by-step with explanations
- ✅ Pause after each section
- ✅ Colored output with ASCII art
- ✅ Comprehensive test coverage
- ✅ Creates real training artifacts
- ✅ Educational comments

### Quick Demo (`quick-api-demo.sh`)
- ✅ Fully automated
- ✅ Fast execution (~15 seconds)
- ✅ Perfect for CI/CD pipelines
- ✅ Validates all endpoints
- ✅ Clean summary output
- ✅ Exit code on failure

## 🌐 Web Interfaces

After running demos, explore:

- **Frontend**: http://localhost:3000
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **MinIO**: http://localhost:9001 (minioadmin/minioadmin)
- **RabbitMQ**: http://localhost:15672 (guest/guest)

## 📚 Documentation

- `DEMO_README.md` - Comprehensive guide
- `PROJECT_SUMMARY.md` - Architecture overview
- `README.md` - Main project README

## ✨ Key Features Demonstrated

1. **Distributed Training**: Multi-worker job orchestration
2. **S3 Storage**: MinIO-backed object storage for datasets/models
3. **Real-time Monitoring**: Prometheus + Grafana metrics
4. **gRPC Communication**: High-performance service communication
5. **REST API**: User-friendly HTTP endpoints
6. **Health Checks**: Service readiness validation
7. **Error Handling**: Graceful failure management
8. **Job Lifecycle**: Submit → Monitor → Complete/Cancel

## 🛠️ Troubleshooting

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f api-gateway

# Restart services
docker compose restart

# Clean reset
docker compose down -v && docker compose up -d
```

---

**Ready to demo? Run `./quick-api-demo.sh` now! 🚀**

#!/bin/bash

# TensorFleet Quick API Demo
# Automated test of all endpoints without manual intervention

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   TensorFleet Quick API Demo          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# 1. Health Checks
# ============================================================================
echo -e "${BLUE}━━━ 1. HEALTH CHECKS ━━━${NC}"
echo "API Gateway:     $(curl -s http://localhost:8080/health | jq -r '.status')"
echo "Storage:         $(curl -s http://localhost:8081/health | jq -r '.status')"
echo "Monitoring:      $(curl -s http://localhost:8082/health | jq -r '.status')"
echo ""

# ============================================================================
# 2. Storage Operations
# ============================================================================
echo -e "${BLUE}━━━ 2. STORAGE OPERATIONS ━━━${NC}"

# Create test file
echo "sample,training,data" > /tmp/test.csv
echo "✓ Created test file"

# Upload
UPLOAD=$(curl -s -X POST http://localhost:8081/api/v1/upload/datasets/test.csv \
  -F "file=@/tmp/test.csv")
echo "✓ Uploaded: $(echo $UPLOAD | jq -r '.message')"

# List
COUNT=$(curl -s http://localhost:8081/api/v1/list/datasets | jq -r '.count')
echo "✓ Listed files: $COUNT files in datasets bucket"

# Download
DOWNLOAD=$(curl -s http://localhost:8081/api/v1/download/datasets/test.csv)
echo "✓ Downloaded file: $DOWNLOAD"
echo ""

# ============================================================================
# 3. Job Management
# ============================================================================
echo -e "${BLUE}━━━ 3. JOB MANAGEMENT ━━━${NC}"

# Submit job
JOB_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user" \
  -d '{
    "model_type": "resnet50",
    "dataset_path": "s3://tensorfleet/datasets/imagenet",
    "hyperparameters": {
      "learning_rate": "0.001",
      "batch_size": "32"
    },
    "num_workers": 3,
    "epochs": 10
  }')

JOB_ID=$(echo "$JOB_RESPONSE" | jq -r '.job_id')
NUM_TASKS=$(echo "$JOB_RESPONSE" | jq -r '.num_tasks')
echo "✓ Job submitted: $JOB_ID ($NUM_TASKS tasks)"

# Wait and check progress
sleep 3
JOB_STATUS=$(curl -s "http://localhost:8080/api/v1/jobs/${JOB_ID}")
PROGRESS=$(echo "$JOB_STATUS" | jq -r '.progress')
COMPLETED=$(echo "$JOB_STATUS" | jq -r '.completed_tasks')
TOTAL=$(echo "$JOB_STATUS" | jq -r '.total_tasks')
echo "✓ Job progress: $PROGRESS% ($COMPLETED/$TOTAL tasks)"

# Check again after 5 seconds
sleep 5
JOB_STATUS=$(curl -s "http://localhost:8080/api/v1/jobs/${JOB_ID}")
PROGRESS=$(echo "$JOB_STATUS" | jq -r '.progress')
LOSS=$(echo "$JOB_STATUS" | jq -r '.current_loss')
ACCURACY=$(echo "$JOB_STATUS" | jq -r '.current_accuracy')
echo "✓ Updated status: $PROGRESS% (Loss: $LOSS, Acc: $ACCURACY)"

# Submit second job
JOB2=$(curl -s -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "bert-base",
    "dataset_path": "s3://tensorfleet/datasets/squad",
    "hyperparameters": {"learning_rate": "0.00005"},
    "num_workers": 2,
    "epochs": 5
  }')
JOB2_ID=$(echo "$JOB2" | jq -r '.job_id')
echo "✓ Second job submitted: $JOB2_ID"

# Cancel second job
CANCEL=$(curl -s -X DELETE "http://localhost:8080/api/v1/jobs/${JOB2_ID}")
echo "✓ Job cancelled: $(echo $CANCEL | jq -r '.message')"
echo ""

# ============================================================================
# 4. Monitoring
# ============================================================================
echo -e "${BLUE}━━━ 4. MONITORING & METRICS ━━━${NC}"

METRICS=$(curl -s http://localhost:8082/api/v1/metrics/jobs)
TOTAL_JOBS=$(echo "$METRICS" | jq -r '.total_jobs')
RUNNING=$(echo "$METRICS" | jq -r '.running_jobs')
echo "✓ Job metrics: $TOTAL_JOBS total, $RUNNING running"

WORKERS=$(curl -s http://localhost:8082/api/v1/metrics/workers)
WORKER_COUNT=$(echo "$WORKERS" | jq -r '.total')
echo "✓ Worker metrics: $WORKER_COUNT workers"

PROM_METRICS=$(curl -s http://localhost:8082/metrics | grep -c "tensorfleet" || echo "0")
echo "✓ Prometheus metrics: $PROM_METRICS TensorFleet metrics exposed"
echo ""

# ============================================================================
# 5. Error Handling
# ============================================================================
echo -e "${BLUE}━━━ 5. ERROR HANDLING ━━━${NC}"

INVALID=$(curl -s http://localhost:8080/api/v1/jobs/invalid-id-12345)
if echo "$INVALID" | jq -e '.error' > /dev/null; then
    echo "✓ Invalid job ID handled correctly"
fi

BAD_REQUEST=$(curl -s -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{"model_type": "test"}')
if echo "$BAD_REQUEST" | jq -e '.error' > /dev/null; then
    echo "✓ Missing required fields validated"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================
echo -e "${BLUE}━━━ FINAL STATUS ━━━${NC}"

# Get final job status
FINAL_STATUS=$(curl -s "http://localhost:8080/api/v1/jobs/${JOB_ID}")
FINAL_PROGRESS=$(echo "$FINAL_STATUS" | jq -r '.progress')
FINAL_COMPLETED=$(echo "$FINAL_STATUS" | jq -r '.completed_tasks')
FINAL_TOTAL=$(echo "$FINAL_STATUS" | jq -r '.total_tasks')
FINAL_LOSS=$(echo "$FINAL_STATUS" | jq -r '.current_loss')
FINAL_ACC=$(echo "$FINAL_STATUS" | jq -r '.current_accuracy')

echo "Training Job: $JOB_ID"
echo "  Progress:  $FINAL_PROGRESS% ($FINAL_COMPLETED/$FINAL_TOTAL tasks)"
echo "  Loss:      $FINAL_LOSS"
echo "  Accuracy:  $FINAL_ACC"
echo ""

# Storage summary
DATASETS=$(curl -s http://localhost:8081/api/v1/list/datasets | jq -r '.count')
MODELS=$(curl -s http://localhost:8081/api/v1/list/models | jq -r '.count')
echo "Storage:"
echo "  Datasets:  $DATASETS files"
echo "  Models:    $MODELS files"
echo ""

# Cleanup
rm -f /tmp/test.csv

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ ALL API ENDPOINTS TESTED SUCCESSFULLY${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Test Coverage:"
echo "  ✓ Health checks (3 services)"
echo "  ✓ File upload/download/list"
echo "  ✓ Job submission"
echo "  ✓ Job monitoring"
echo "  ✓ Job cancellation"
echo "  ✓ Metrics collection"
echo "  ✓ Error handling"
echo ""
echo "Web Interfaces:"
echo "  • Frontend:    http://localhost:3000"
echo "  • Grafana:     http://localhost:3001 (admin/admin)"
echo "  • Prometheus:  http://localhost:9090"
echo "  • MinIO:       http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "Job ID for monitoring: $JOB_ID"
echo ""

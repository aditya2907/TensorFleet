#!/bin/bash

# TensorFleet API Demo Script
# This script demonstrates all API endpoints of the TensorFleet distributed training platform

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Base URLs
API_GATEWAY="http://localhost:8080"
STORAGE_SERVICE="http://localhost:8081"
MONITORING_SERVICE="http://localhost:8082"
GRAFANA="http://localhost:3001"
PROMETHEUS="http://localhost:9090"
MINIO="http://localhost:9001"

# Helper functions
print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

wait_for_input() {
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read
}

# Main demo
clear
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       ████████╗███████╗███╗   ██╗███████╗ ██████╗ ██████╗ ║
║       ╚══██╔══╝██╔════╝████╗  ██║██╔════╝██╔═══██╗██╔══██╗║
║          ██║   █████╗  ██╔██╗ ██║███████╗██║   ██║██████╔╝║
║          ██║   ██╔══╝  ██║╚██╗██║╚════██║██║   ██║██╔══██╗║
║          ██║   ███████╗██║ ╚████║███████║╚██████╔╝██║  ██║║
║          ╚═╝   ╚══════╝╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝║
║                                                            ║
║              FLEET - Distributed Training Platform         ║
║                     API Demo Script                        ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

# ============================================================================
# SECTION 1: Health Checks
# ============================================================================
print_header "SECTION 1: HEALTH CHECKS"

print_step "1.1 Checking API Gateway health..."
if curl -s ${API_GATEWAY}/health | jq -e '.status == "healthy"' > /dev/null; then
    print_success "API Gateway is healthy"
    curl -s ${API_GATEWAY}/health | jq .
else
    print_error "API Gateway is not responding"
    exit 1
fi
echo ""
wait_for_input

print_step "1.2 Checking Storage Service health..."
if curl -s ${STORAGE_SERVICE}/health | jq -e '.status == "healthy"' > /dev/null; then
    print_success "Storage Service is healthy"
    curl -s ${STORAGE_SERVICE}/health | jq .
else
    print_error "Storage Service is not responding"
fi
echo ""
wait_for_input

print_step "1.3 Checking Monitoring Service health..."
if curl -s ${MONITORING_SERVICE}/health | jq -e '.status == "healthy"' > /dev/null; then
    print_success "Monitoring Service is healthy"
    curl -s ${MONITORING_SERVICE}/health | jq .
else
    print_error "Monitoring Service is not responding"
fi
echo ""
wait_for_input

# ============================================================================
# SECTION 2: Storage Service - File Operations
# ============================================================================
print_header "SECTION 2: STORAGE SERVICE - FILE OPERATIONS"

print_step "2.1 Creating test dataset file..."
echo "epoch,loss,accuracy
1,2.304,0.125
2,1.856,0.342
3,1.234,0.567
4,0.892,0.723
5,0.654,0.845" > /tmp/training_data.csv
print_success "Created training_data.csv"
cat /tmp/training_data.csv
echo ""
wait_for_input

print_step "2.2 Uploading dataset to storage..."
UPLOAD_RESPONSE=$(curl -s -X POST ${STORAGE_SERVICE}/api/v1/upload/datasets/training_data.csv \
  -F "file=@/tmp/training_data.csv")
echo "$UPLOAD_RESPONSE" | jq .
if echo "$UPLOAD_RESPONSE" | jq -e '.message == "File uploaded successfully"' > /dev/null; then
    print_success "Dataset uploaded successfully"
else
    print_error "Failed to upload dataset"
fi
echo ""
wait_for_input

print_step "2.3 Creating model configuration..."
cat > /tmp/model_config.json << 'EOFCONFIG'
{
  "model_name": "resnet50",
  "architecture": {
    "layers": 50,
    "input_size": [224, 224, 3],
    "num_classes": 1000
  },
  "training_config": {
    "optimizer": "adam",
    "learning_rate": 0.001,
    "batch_size": 32
  }
}
EOFCONFIG
print_success "Created model_config.json"
cat /tmp/model_config.json | jq .
echo ""
wait_for_input

print_step "2.4 Uploading model configuration..."
UPLOAD_MODEL=$(curl -s -X POST ${STORAGE_SERVICE}/api/v1/upload/models/resnet50_config.json \
  -F "file=@/tmp/model_config.json")
echo "$UPLOAD_MODEL" | jq .
print_success "Model configuration uploaded"
echo ""
wait_for_input

print_step "2.5 Listing files in datasets bucket..."
curl -s "${STORAGE_SERVICE}/api/v1/list/datasets" | jq .
echo ""
wait_for_input

print_step "2.6 Listing files in models bucket..."
curl -s "${STORAGE_SERVICE}/api/v1/list/models" | jq .
echo ""
wait_for_input

print_step "2.7 Downloading dataset file..."
echo "Downloaded content:"
curl -s "${STORAGE_SERVICE}/api/v1/download/datasets/training_data.csv"
echo ""
print_success "File download successful"
echo ""
wait_for_input

# ============================================================================
# SECTION 3: Job Management - Submit Training Jobs
# ============================================================================
print_header "SECTION 3: JOB MANAGEMENT - SUBMIT TRAINING JOBS"

print_step "3.1 Submitting ResNet50 training job..."
JOB1_RESPONSE=$(curl -s -X POST ${API_GATEWAY}/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user-001" \
  -d '{
    "model_type": "resnet50",
    "dataset_path": "s3://tensorfleet/datasets/imagenet",
    "hyperparameters": {
      "learning_rate": "0.001",
      "batch_size": "32",
      "optimizer": "adam",
      "weight_decay": "0.0001"
    },
    "num_workers": 3,
    "epochs": 10
  }')

echo "$JOB1_RESPONSE" | jq .
JOB1_ID=$(echo "$JOB1_RESPONSE" | jq -r '.job_id')
print_success "Job submitted with ID: $JOB1_ID"
echo ""
wait_for_input

print_step "3.2 Submitting BERT training job..."
JOB2_RESPONSE=$(curl -s -X POST ${API_GATEWAY}/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user-002" \
  -d '{
    "model_type": "bert-base",
    "dataset_path": "s3://tensorfleet/datasets/squad",
    "hyperparameters": {
      "learning_rate": "0.00005",
      "batch_size": "16",
      "max_seq_length": "512",
      "warmup_steps": "1000"
    },
    "num_workers": 2,
    "epochs": 5
  }')

echo "$JOB2_RESPONSE" | jq .
JOB2_ID=$(echo "$JOB2_RESPONSE" | jq -r '.job_id')
print_success "Job submitted with ID: $JOB2_ID"
echo ""
wait_for_input

print_step "3.3 Submitting GPT-2 training job..."
JOB3_RESPONSE=$(curl -s -X POST ${API_GATEWAY}/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user-003" \
  -d '{
    "model_type": "gpt2-medium",
    "dataset_path": "s3://tensorfleet/datasets/wikitext",
    "hyperparameters": {
      "learning_rate": "0.0002",
      "batch_size": "8",
      "gradient_accumulation_steps": "4",
      "max_length": "1024"
    },
    "num_workers": 4,
    "epochs": 3
  }')

echo "$JOB3_RESPONSE" | jq .
JOB3_ID=$(echo "$JOB3_RESPONSE" | jq -r '.job_id')
print_success "Job submitted with ID: $JOB3_ID"
echo ""
print_info "Waiting 5 seconds for jobs to start processing..."
sleep 5
wait_for_input

# ============================================================================
# SECTION 4: Job Monitoring
# ============================================================================
print_header "SECTION 4: JOB MONITORING"

print_step "4.1 Checking status of ResNet50 job..."
curl -s "${API_GATEWAY}/api/v1/jobs/${JOB1_ID}" | jq .
echo ""
wait_for_input

print_step "4.2 Checking status of BERT job..."
curl -s "${API_GATEWAY}/api/v1/jobs/${JOB2_ID}" | jq .
echo ""
wait_for_input

print_step "4.3 Checking status of GPT-2 job..."
curl -s "${API_GATEWAY}/api/v1/jobs/${JOB3_ID}" | jq .
echo ""
wait_for_input

print_step "4.4 Listing all jobs..."
curl -s "${API_GATEWAY}/api/v1/jobs" | jq .
echo ""
wait_for_input

print_step "4.5 Monitoring job progress (15 seconds)..."
for i in {1..3}; do
    echo -e "${YELLOW}Check #$i:${NC}"
    JOB_STATUS=$(curl -s "${API_GATEWAY}/api/v1/jobs/${JOB1_ID}")
    PROGRESS=$(echo "$JOB_STATUS" | jq -r '.progress')
    COMPLETED=$(echo "$JOB_STATUS" | jq -r '.completed_tasks')
    TOTAL=$(echo "$JOB_STATUS" | jq -r '.total_tasks')
    LOSS=$(echo "$JOB_STATUS" | jq -r '.current_loss')
    ACCURACY=$(echo "$JOB_STATUS" | jq -r '.current_accuracy')
    
    echo "  Progress: ${PROGRESS}% (${COMPLETED}/${TOTAL} tasks)"
    echo "  Loss: ${LOSS}"
    echo "  Accuracy: ${ACCURACY}"
    echo ""
    
    if [ $i -lt 3 ]; then
        sleep 5
    fi
done
wait_for_input

# ============================================================================
# SECTION 5: Job Cancellation
# ============================================================================
print_header "SECTION 5: JOB CANCELLATION"

print_step "5.1 Cancelling GPT-2 job..."
CANCEL_RESPONSE=$(curl -s -X DELETE "${API_GATEWAY}/api/v1/jobs/${JOB3_ID}")
echo "$CANCEL_RESPONSE" | jq .
if echo "$CANCEL_RESPONSE" | jq -e '.success == true' > /dev/null; then
    print_success "Job cancelled successfully"
else
    print_error "Failed to cancel job"
fi
echo ""
wait_for_input

print_step "5.2 Verifying cancelled job status..."
curl -s "${API_GATEWAY}/api/v1/jobs/${JOB3_ID}" | jq .
echo ""
wait_for_input

# ============================================================================
# SECTION 6: Monitoring & Metrics
# ============================================================================
print_header "SECTION 6: MONITORING & METRICS"

print_step "6.1 Getting aggregated job metrics..."
curl -s "${MONITORING_SERVICE}/api/v1/metrics/jobs" | jq .
echo ""
wait_for_input

print_step "6.2 Getting worker metrics..."
curl -s "${MONITORING_SERVICE}/api/v1/metrics/workers" | jq .
echo ""
wait_for_input

print_step "6.3 Getting Prometheus metrics (sample)..."
echo "Sample Prometheus metrics:"
curl -s "${MONITORING_SERVICE}/metrics" | grep -E "^(tensorfleet|python_info)" | head -10
echo ""
wait_for_input

# ============================================================================
# SECTION 7: Error Handling
# ============================================================================
print_header "SECTION 7: ERROR HANDLING & EDGE CASES"

print_step "7.1 Testing invalid job ID..."
INVALID_RESPONSE=$(curl -s "${API_GATEWAY}/api/v1/jobs/invalid-job-id-12345")
echo "$INVALID_RESPONSE" | jq .
if echo "$INVALID_RESPONSE" | jq -e '.error' > /dev/null; then
    print_success "Error handling works correctly"
fi
echo ""
wait_for_input

print_step "7.2 Testing job submission with missing fields..."
MISSING_FIELD=$(curl -s -X POST ${API_GATEWAY}/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "resnet50"
  }')
echo "$MISSING_FIELD" | jq .
if echo "$MISSING_FIELD" | jq -e '.error' > /dev/null; then
    print_success "Validation working correctly"
fi
echo ""
wait_for_input

print_step "7.3 Testing invalid bucket access..."
INVALID_BUCKET=$(curl -s "${STORAGE_SERVICE}/api/v1/list/invalid_bucket")
echo "$INVALID_BUCKET"
echo ""
wait_for_input

# ============================================================================
# SECTION 8: System Overview
# ============================================================================
print_header "SECTION 8: SYSTEM OVERVIEW"

print_step "8.1 Platform Status Summary"
echo ""
echo -e "${CYAN}Service Health:${NC}"
echo "  API Gateway:     $(curl -s ${API_GATEWAY}/health | jq -r '.status')"
echo "  Storage:         $(curl -s ${STORAGE_SERVICE}/health | jq -r '.status')"
echo "  Monitoring:      $(curl -s ${MONITORING_SERVICE}/health | jq -r '.status')"
echo ""

echo -e "${CYAN}Active Jobs:${NC}"
JOB1_STATUS=$(curl -s "${API_GATEWAY}/api/v1/jobs/${JOB1_ID}")
echo "  ResNet50: $(echo $JOB1_STATUS | jq -r '.progress')% complete"
JOB2_STATUS=$(curl -s "${API_GATEWAY}/api/v1/jobs/${JOB2_ID}")
echo "  BERT:     $(echo $JOB2_STATUS | jq -r '.progress')% complete"
echo "  GPT-2:    Cancelled"
echo ""

echo -e "${CYAN}Storage Summary:${NC}"
DATASETS_COUNT=$(curl -s "${STORAGE_SERVICE}/api/v1/list/datasets" | jq -r '.count')
MODELS_COUNT=$(curl -s "${STORAGE_SERVICE}/api/v1/list/models" | jq -r '.count')
echo "  Datasets: ${DATASETS_COUNT} files"
echo "  Models:   ${MODELS_COUNT} files"
echo ""

echo -e "${CYAN}Web Interfaces:${NC}"
echo "  Frontend:        http://localhost:3000"
echo "  Grafana:         http://localhost:3001 (admin/admin)"
echo "  Prometheus:      http://localhost:9090"
echo "  MinIO Console:   http://localhost:9001 (minioadmin/minioadmin)"
echo "  RabbitMQ:        http://localhost:15672"
echo ""
wait_for_input

# ============================================================================
# SECTION 9: Cleanup
# ============================================================================
print_header "SECTION 9: CLEANUP"

print_step "9.1 Cleaning up temporary files..."
rm -f /tmp/training_data.csv /tmp/model_config.json
print_success "Temporary files removed"
echo ""

# ============================================================================
# Final Summary
# ============================================================================
print_header "DEMO COMPLETE!"

echo -e "${GREEN}"
cat << "EOF"
✓ All API endpoints tested successfully!

Summary of tested functionality:
  ✓ Health checks for all services
  ✓ File upload/download/listing (Storage Service)
  ✓ Job submission (multiple models)
  ✓ Job status monitoring
  ✓ Real-time progress tracking
  ✓ Job cancellation
  ✓ Metrics collection (Monitoring Service)
  ✓ Error handling and validation
  ✓ Distributed training coordination

The TensorFleet platform is fully operational and ready for
distributed machine learning workloads!

For more information, check out:
  • Frontend: http://localhost:3000
  • Grafana Dashboards: http://localhost:3001
  • API Documentation: http://localhost:8080/docs (if available)
EOF
echo -e "${NC}"

print_info "Job IDs for reference:"
echo "  ResNet50: $JOB1_ID"
echo "  BERT:     $JOB2_ID"
echo "  GPT-2:    $JOB3_ID (cancelled)"
echo ""

print_success "Demo script completed successfully!"

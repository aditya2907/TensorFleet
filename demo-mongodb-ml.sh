#!/bin/bash

# TensorFleet MongoDB ML Training Demo
# Demonstrates ML training with MongoDB dataset storage and model persistence

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Service URLs
ML_WORKER_URL="http://localhost:8000"
MODEL_SERVICE_URL="http://localhost:8083"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TensorFleet MongoDB ML Training Demo                    ║${NC}"
echo -e "${BLUE}║  Training ML Models with MongoDB Integration             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if services are running
echo -e "${YELLOW}→ Checking service health...${NC}"
if curl -sf "${ML_WORKER_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ ML Worker is healthy${NC}"
else
    echo -e "${RED}✗ ML Worker is not responding${NC}"
    echo "Please start services with: docker-compose up -d"
    exit 1
fi

if curl -sf "${MODEL_SERVICE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ Model Service is healthy${NC}"
else
    echo -e "${RED}✗ Model Service is not responding${NC}"
    echo "Please start services with: docker-compose up -d"
    exit 1
fi

echo ""

# List available datasets
echo -e "${BLUE}═══ Available Datasets ═══${NC}"
DATASETS=$(curl -s "${ML_WORKER_URL}/datasets" | jq -r '.datasets[] | "  • \(.name): \(.description) (\(.n_samples) samples, \(.n_features) features)"')
echo "$DATASETS"
echo ""

# List supported algorithms
echo -e "${BLUE}═══ Supported Algorithms ═══${NC}"
ALGORITHMS=$(curl -s "${ML_WORKER_URL}/algorithms" | jq -r '.algorithms[] | "  • \(.name): \(.description)"')
echo "$ALGORITHMS"
echo ""

# Training Job 1: Random Forest on Iris dataset
echo -e "${BLUE}═══ Training Job 1: Random Forest on Iris Dataset ═══${NC}"
echo -e "${YELLOW}→ Submitting training job...${NC}"

JOB1=$(curl -s -X POST "${ML_WORKER_URL}/train" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "rf_iris_demo_001",
    "dataset_name": "iris",
    "algorithm": "random_forest",
    "target_column": "species",
    "model_name": "iris_random_forest_demo",
    "hyperparameters": {
      "n_estimators": 100,
      "max_depth": 5,
      "random_state": 42
    }
  }')

JOB1_STATUS=$(echo "$JOB1" | jq -r '.status')
if [ "$JOB1_STATUS" == "completed" ]; then
    JOB1_MODEL_ID=$(echo "$JOB1" | jq -r '.model_id')
    JOB1_ACCURACY=$(echo "$JOB1" | jq -r '.metrics.test_accuracy')
    echo -e "${GREEN}✓ Training completed successfully!${NC}"
    echo "  Model ID: $JOB1_MODEL_ID"
    echo "  Test Accuracy: $JOB1_ACCURACY"
    echo "  Metrics:"
    echo "$JOB1" | jq '.metrics'
else
    echo -e "${RED}✗ Training failed${NC}"
    echo "$JOB1" | jq '.'
fi
echo ""

# Training Job 2: Logistic Regression on Iris dataset
echo -e "${BLUE}═══ Training Job 2: Logistic Regression on Iris Dataset ═══${NC}"
echo -e "${YELLOW}→ Submitting training job...${NC}"

JOB2=$(curl -s -X POST "${ML_WORKER_URL}/train" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "lr_iris_demo_001",
    "dataset_name": "iris",
    "algorithm": "logistic_regression",
    "target_column": "species",
    "model_name": "iris_logistic_regression_demo",
    "hyperparameters": {
      "max_iter": 1000,
      "random_state": 42
    }
  }')

JOB2_STATUS=$(echo "$JOB2" | jq -r '.status')
if [ "$JOB2_STATUS" == "completed" ]; then
    JOB2_MODEL_ID=$(echo "$JOB2" | jq -r '.model_id')
    JOB2_ACCURACY=$(echo "$JOB2" | jq -r '.metrics.test_accuracy')
    echo -e "${GREEN}✓ Training completed successfully!${NC}"
    echo "  Model ID: $JOB2_MODEL_ID"
    echo "  Test Accuracy: $JOB2_ACCURACY"
else
    echo -e "${RED}✗ Training failed${NC}"
    echo "$JOB2" | jq '.'
fi
echo ""

# Training Job 3: SVM on Wine dataset
echo -e "${BLUE}═══ Training Job 3: SVM on Wine Dataset ═══${NC}"
echo -e "${YELLOW}→ Submitting training job...${NC}"

JOB3=$(curl -s -X POST "${ML_WORKER_URL}/train" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "svm_wine_demo_001",
    "dataset_name": "wine",
    "algorithm": "svm",
    "target_column": "wine_class",
    "model_name": "wine_svm_classifier_demo",
    "hyperparameters": {
      "kernel": "rbf",
      "C": 1.0,
      "random_state": 42
    }
  }')

JOB3_STATUS=$(echo "$JOB3" | jq -r '.status')
if [ "$JOB3_STATUS" == "completed" ]; then
    JOB3_MODEL_ID=$(echo "$JOB3" | jq -r '.model_id')
    JOB3_ACCURACY=$(echo "$JOB3" | jq -r '.metrics.test_accuracy')
    echo -e "${GREEN}✓ Training completed successfully!${NC}"
    echo "  Model ID: $JOB3_MODEL_ID"
    echo "  Test Accuracy: $JOB3_ACCURACY"
else
    echo -e "${RED}✗ Training failed${NC}"
    echo "$JOB3" | jq '.'
fi
echo ""

# List all models
echo -e "${BLUE}═══ Available Models in MongoDB ═══${NC}"
MODELS=$(curl -s "${MODEL_SERVICE_URL}/api/v1/models?limit=10")
echo "$MODELS" | jq -r '.models[] | "  • \(.name) (\(.algorithm)) - Accuracy: \(.metrics.test_accuracy // "N/A") - Created: \(.created_at)"'
echo ""

# Get model statistics
echo -e "${BLUE}═══ Model Statistics ═══${NC}"
STATS=$(curl -s "${MODEL_SERVICE_URL}/api/v1/statistics")
echo "$STATS" | jq '.'
echo ""

# Download a model
if [ "$JOB1_STATUS" == "completed" ]; then
    echo -e "${BLUE}═══ Downloading Model ═══${NC}"
    echo -e "${YELLOW}→ Downloading model ${JOB1_MODEL_ID}...${NC}"
    
    DOWNLOAD_RESULT=$(curl -s -w "\n%{http_code}" \
      -o "downloaded_model_${JOB1_MODEL_ID}.pkl" \
      "${MODEL_SERVICE_URL}/api/v1/models/${JOB1_MODEL_ID}/download")
    
    HTTP_CODE=$(echo "$DOWNLOAD_RESULT" | tail -n1)
    
    if [ "$HTTP_CODE" == "200" ]; then
        FILE_SIZE=$(ls -lh "downloaded_model_${JOB1_MODEL_ID}.pkl" | awk '{print $5}')
        echo -e "${GREEN}✓ Model downloaded successfully!${NC}"
        echo "  File: downloaded_model_${JOB1_MODEL_ID}.pkl"
        echo "  Size: $FILE_SIZE"
    else
        echo -e "${RED}✗ Model download failed (HTTP $HTTP_CODE)${NC}"
    fi
    echo ""
fi

# Get detailed model metadata
if [ "$JOB1_STATUS" == "completed" ]; then
    echo -e "${BLUE}═══ Model Metadata Details ═══${NC}"
    METADATA=$(curl -s "${MODEL_SERVICE_URL}/api/v1/models/${JOB1_MODEL_ID}")
    echo "$METADATA" | jq '.'
    echo ""
fi

# Summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Demo Summary                                             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Trained 3 ML models on MongoDB datasets${NC}"
echo -e "${GREEN}✓ Stored models in MongoDB using GridFS${NC}"
echo -e "${GREEN}✓ Retrieved model metadata${NC}"
echo -e "${GREEN}✓ Downloaded model for use${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  • View models: curl ${MODEL_SERVICE_URL}/api/v1/models | jq"
echo "  • Download model: curl ${MODEL_SERVICE_URL}/api/v1/models/<model_id>/download -o model.pkl"
echo "  • Train new model: curl -X POST ${ML_WORKER_URL}/train -H 'Content-Type: application/json' -d '{...}'"
echo "  • View statistics: curl ${MODEL_SERVICE_URL}/api/v1/statistics | jq"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Demo completed successfully! 🎉${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

### ==========================================================
### TensorFleet – Build, Run, Deploy Automation
### ==========================================================

PROJECT_NAME = tensorfleet
SERVICES = api-gateway orchestrator worker storage monitoring frontend
REGISTRY ?= ghcr.io/your-username/tensorfleet
K8S_DIR = k8s
PROTO_DIR = proto

.PHONY: help
help:
	@echo "================ TensorFleet Makefile Commands ================="
	@echo "make proto               - Generate gRPC stubs from proto files"
	@echo "make build               - Build all microservice Docker images"
	@echo "make build-api-gateway   - Build api-gateway image"
	@echo "make build-orchestrator  - Build orchestrator image"
	@echo "make build-worker        - Build worker image"
	@echo "make build-storage       - Build storage image"
	@echo "make build-monitoring    - Build monitoring image"
	@echo "make build-frontend      - Build frontend image"
	@echo "make push                - Push all images to the registry"
	@echo "make compose-up          - Run using docker-compose"
	@echo "make compose-down        - Stop docker-compose"
	@echo "make k8s-deploy          - Deploy all services to Kubernetes"
	@echo "make k8s-delete          - Delete all services from Kubernetes"
	@echo "make logs                - Tail logs of TensorFleet pods"
	@echo "make clean               - Remove unused Docker resources"
	@echo "================================================================"

### ==========================================================
### Proto Generation
### ==========================================================

proto:
	@echo "Generating gRPC stubs from proto files..."
	@cd proto && ./generate.sh

### ==========================================================
### Docker Build / Push
### ==========================================================

build: build-api-gateway build-orchestrator build-worker build-storage build-monitoring build-frontend

build-api-gateway:
	@echo "Building api-gateway service..."
	docker build -t $(REGISTRY)/api-gateway:latest ./api-gateway

build-orchestrator:
	@echo "Building orchestrator service..."
	docker build -t $(REGISTRY)/orchestrator:latest ./orchestrator

build-worker:
	@echo "Building worker service..."
	docker build -t $(REGISTRY)/worker:latest ./worker

build-storage:
	@echo "Building storage service..."
	docker build -t $(REGISTRY)/storage:latest ./storage

build-monitoring:
	@echo "Building monitoring service..."
	docker build -t $(REGISTRY)/monitoring:latest ./monitoring

build-frontend:
	@echo "Building frontend service..."
	docker build -t $(REGISTRY)/frontend:latest ./frontend

push: push-api-gateway push-orchestrator push-worker push-storage push-monitoring push-frontend

push-api-gateway:
	@echo "Pushing api-gateway to registry..."
	docker push $(REGISTRY)/api-gateway:latest

push-orchestrator:
	@echo "Pushing orchestrator to registry..."
	docker push $(REGISTRY)/orchestrator:latest

push-worker:
	@echo "Pushing worker to registry..."
	docker push $(REGISTRY)/worker:latest

push-storage:
	@echo "Pushing storage to registry..."
	docker push $(REGISTRY)/storage:latest

push-monitoring:
	@echo "Pushing monitoring to registry..."
	docker push $(REGISTRY)/monitoring:latest

push-frontend:
	@echo "Pushing frontend to registry..."
	docker push $(REGISTRY)/frontend:latest

### ==========================================================
### Docker Compose
### ==========================================================

compose-up:
	docker compose up --build -d

compose-down:
	docker compose down

### ==========================================================
### Kubernetes Deployment
### ==========================================================

k8s-deploy:
	@echo "Deploying TensorFleet to Kubernetes..."
	kubectl apply -f $(K8S_DIR)/namespace.yaml
	kubectl apply -f $(K8S_DIR)/

k8s-delete:
	@echo "Deleting TensorFleet Kubernetes resources..."
	kubectl delete -f $(K8S_DIR)/ --ignore-not-found=true

### ==========================================================
### Logs
### ==========================================================

logs:
	kubectl logs -n tensorfleet -l app.kubernetes.io/part-of=$(PROJECT_NAME) --all-containers=true -f --tail=100

### ==========================================================
### Cleanup
### ==========================================================

clean:
	@echo "Cleaning Docker system..."
	docker system prune -af

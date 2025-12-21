#!/bin/bash

# TensorFleet Kubernetes Deployment Script
# This script deploys TensorFleet to a Kubernetes cluster

set -euo pipefail

# Always operate from the script directory so relative paths work regardless of cwd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NAMESPACE="tensorfleet"

echo "🚀 Starting TensorFleet Kubernetes Deployment..."

# Parse CLI options (moved to the top so flags like --help do not perform cluster actions)
BUILD_IMAGES=false
LOAD_IMAGES=true
SKIP_WAIT=false
TAG="latest"
PUSH_REG=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --build-images, -b       Build all TensorFleet images before deployment
  --no-load-images         Do not load local images into Minikube (if using Minikube)
  --skip-wait              Do not wait for deployments to become available
  --tag <tag>              Image tag to use/build (default: latest)
  --push <registry>        Push built images to <registry>
  -h, --help               Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-images|-b)
      BUILD_IMAGES=true; shift;;
    --no-load-images)
      LOAD_IMAGES=false; shift;;
    --skip-wait)
      SKIP_WAIT=true; shift;;
    --tag)
      TAG="$2"; shift 2;;
    --push)
      PUSH_REG="$2"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown option: $1"; usage; exit 1;;
  esac
done

# If requested, build images first (do this early so builds are available for loading)
if [ "$BUILD_IMAGES" = true ]; then
    echo "🔧 Building TensorFleet images (tag: $TAG)..."
    build_args=(--tag "$TAG")
    if [ -n "$PUSH_REG" ]; then
        build_args+=(--push "$PUSH_REG")
    fi
    if [ "$LOAD_IMAGES" = true ]; then
        build_args+=(--load)
    fi
    ./build-images.sh "${build_args[@]}"
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Set the kubectl context namespace so `kubectl` defaults to the tensorfleet namespace
echo "🔁 Setting kubectl context to use namespace '$NAMESPACE' by default..."
if kubectl config current-context >/dev/null 2>&1; then
    if kubectl config set-context --current --namespace=$NAMESPACE >/dev/null 2>&1; then
        echo "✅ kubectl context updated: default namespace set to '$NAMESPACE'"
    else
        echo "⚠️ Failed to set kubectl context namespace automatically. You can run: kubectl config set-context --current --namespace=$NAMESPACE"
    fi
else
    echo "⚠️ No current kubectl context found. To set namespace manually run: kubectl config set-context <context-name> --namespace=$NAMESPACE"
fi

# Ensure required secrets exist (create defaults if missing)
ensure_secrets() {
    if ! kubectl get secret tensorfleet-secrets -n "$NAMESPACE" >/dev/null 2>&1; then
        echo "🔐 Creating default secrets 'tensorfleet-secrets'..."
        kubectl create secret generic tensorfleet-secrets \
            --from-literal=jwt-secret=$(openssl rand -hex 16) \
            --from-literal=minio-access-key=minioadmin \
            --from-literal=minio-secret-key=minioadmin \
            --from-literal=MONGODB_USERNAME=admin \
            --from-literal=MONGODB_PASSWORD=password123 \
            -n "$NAMESPACE"
        echo "✅ Secret created"
    else
        echo "🔐 Secret 'tensorfleet-secrets' already exists; ensuring required keys are present..."
        # Add missing keys if necessary
        _add_if_missing() {
            local key=$1
            local value=$2
            if ! kubectl get secret tensorfleet-secrets -n "$NAMESPACE" -o jsonpath="{.data.$key}" >/dev/null 2>&1; then
                kubectl patch secret tensorfleet-secrets -n "$NAMESPACE" --type='json' -p="[{\"op\":\"add\",\"path\":\"/data/$key\",\"value\":\"$(echo -n "$value" | base64)\"}]" || true
            fi
        }
        _add_if_missing "minio-access-key" "minioadmin"
        _add_if_missing "minio-secret-key" "minioadmin"
        _add_if_missing "MONGODB_USERNAME" "admin"
        _add_if_missing "MONGODB_PASSWORD" "password123"
        _add_if_missing "jwt-secret" "$(openssl rand -hex 16)"
        echo "✅ Secret keys ensured"
    fi
}

# If running on Minikube, try to load local tensorfleet images automatically
load_local_images_to_minikube() {
    if [ "$(kubectl config current-context)" = "minikube" ] && command -v minikube >/dev/null 2>&1; then
        echo "🐳 Detected Minikube context — attempting to load local TensorFleet images into Minikube..."
        images=()
        while IFS= read -r line; do
            images+=("$line")
        done <<< "$(docker images --format '{{.Repository}}:{{.Tag}}' | grep -i tensorfleet || true)"
        if [ ${#images[@]} -eq 0 ]; then
            echo "⚠️ No local images found that match 'tensorfleet'. If you have local images, tag them like 'tensorfleet/<name>:<tag>' or 'tensorfleet-<name>:<tag>'."
            return
        fi
        for img in "${images[@]}"; do
            repo_tag="$img"
            repo=${repo_tag%%:*}
            tag=${repo_tag#*:}

            # If repo uses hyphen naming (tensorfleet-frontend), convert to tensorfleet/frontend
            if [[ "$repo" == tensorfleet-* ]]; then
                suffix="${repo#tensorfleet-}"
                target="tensorfleet/${suffix}:${tag}"
                echo "🔁 Tagging local image $repo_tag -> $target"
                docker tag "$repo_tag" "$target" || true
                echo "⬆️ Loading $target into Minikube..."
                minikube image load "$target" >/dev/null || echo "⚠️ Failed to load $target"
            elif [[ "$repo" == tensorfleet/* ]]; then
                echo "⬆️ Loading $repo_tag into Minikube..."
                minikube image load "$repo_tag" >/dev/null || echo "⚠️ Failed to load $repo_tag"
            else
                echo "ℹ️ Skipping unrelated image $repo_tag"
            fi
        done
        echo "✅ Image loading step completed"
    fi
}

# Ensure secrets before applying config
ensure_secrets

# Load local images into Minikube if applicable and not disabled
if [ "$LOAD_IMAGES" = true ]; then
    load_local_images_to_minikube
else
    echo "ℹ️ Skipping automatic loading of local images into Minikube"
fi

# Apply all manifests recursively (safe because namespace already exists)
echo "📦 Applying all manifests..."
kubectl apply -R -f .

# Wait for core deployments to be ready (unless skipped)
if [ "$SKIP_WAIT" = false ]; then
    DEPLOYMENTS=(redis minio orchestrator api-gateway monitoring storage worker-ml model-service frontend worker)
    for d in "${DEPLOYMENTS[@]}"; do
        echo "⏳ Waiting for deployment/$d to be available..."
        kubectl wait --for=condition=available --timeout=300s deployment/$d -n "$NAMESPACE" || echo "⚠️ deployment/$d did not become available within timeout"
    done
else
    echo "⏭️ Skipping wait for deployments ( --skip-wait )"
fi

# Apply ingress (optional)
if [ -f "ingress.yaml" ]; then
    echo "🌍 Setting up ingress..."
    kubectl apply -f ingress.yaml
fi

# Show deployment status
echo ""
echo "🎉 TensorFleet deployment completed!"
echo ""
echo "📊 Deployment Status:"
kubectl get pods -n tensorfleet

echo ""
echo "🌐 Service Endpoints:"
kubectl get services -n tensorfleet

echo ""
echo "🔍 To check logs:"
echo "  kubectl logs -f deployment/api-gateway -n tensorfleet"
echo "  kubectl logs -f deployment/orchestrator -n tensorfleet"
echo "  kubectl logs -f deployment/monitoring -n tensorfleet"

echo ""
echo "🎯 Port Forwarding (for local access):"
echo "  kubectl port-forward svc/frontend 3000:3000 -n tensorfleet"
echo "  kubectl port-forward svc/api-gateway 8080:8080 -n tensorfleet"
echo "  kubectl port-forward svc/monitoring 8082:8082 -n tensorfleet"

echo ""
echo "🚀 TensorFleet is now running on Kubernetes!"

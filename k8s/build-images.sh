#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAG="latest"
PUSH_REG=""
LOAD_TO_MINIKUBE=false
SERVICE=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [--tag <tag>] [--push <registry>] [--load] [--service <name>]

Options:
  --tag <tag>        Image tag to apply (default: latest)
  --push <registry>  Push built images to <registry>
  --load             After building, load images into Minikube (if available)
  --service <name>   Build only the specified service (e.g., api-gateway)
  -h, --help         Show this help message
EOF
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TAG="$2"; shift 2;;
    --push)
      PUSH_REG="$2"; shift 2;;
    --load)
      LOAD_TO_MINIKUBE=true; shift;;
    --service)
      SERVICE="$2"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown option: $1"; usage; exit 1;;
  esac
done

services=(
  api-gateway
  orchestrator
  frontend
  monitoring
  model-service
  storage
  worker
  worker-ml
)

# If a single service is requested, validate and restrict the list
if [ -n "$SERVICE" ]; then
  if [[ " ${services[*]} " != *" $SERVICE "* ]]; then
    echo "Unknown service: $SERVICE"; exit 1
  fi
  services=("$SERVICE")
fi

for svc in "${services[@]}"; do
  ctx="$ROOT_DIR/$svc"
  if [ -f "$ctx/Dockerfile" ]; then
    img="tensorfleet/${svc}:${TAG}"
    echo "🔨 Building ${img} from ${ctx}..."
    # Use repository root as build context and the service Dockerfile so that
    # Dockerfiles that reference repo-level files (e.g., proto/) work correctly.
    # Decide whether to use repo root or service directory as build context.
    # Some Dockerfiles (api-gateway) reference top-level files like proto/ and must be
    # built with the repository root as the context. Other services (frontend)
    # reference files in their own directory and should use the service dir as context.
    if grep -E "COPY\s+proto/|COPY\s+\.{2}/|COPY\s+\.\./|COPY\s+api-gateway/" "${ctx}/Dockerfile" >/dev/null 2>&1; then
        echo "ℹ️ Using repository root as build context for ${svc}"
        docker build -t "${img}" -f "${ctx}/Dockerfile" "${ROOT_DIR}"
    else
        echo "ℹ️ Using service directory as build context for ${svc}"
        docker build -t "${img}" -f "${ctx}/Dockerfile" "${ctx}"
    fi

    if [ -n "$PUSH_REG" ]; then
      target="${PUSH_REG}/tensorfleet/${svc}:${TAG}"
      echo "⬆️ Tagging and pushing ${target}..."
      docker tag "${img}" "${target}"
      docker push "${target}"
    fi

    if [ "$LOAD_TO_MINIKUBE" = true ] && command -v minikube >/dev/null 2>&1; then
      echo "⬆️ Loading ${img} into Minikube..."
      minikube image load "${img}"
    fi

  else
    echo "⚠️ Dockerfile not found for ${svc} at ${ctx}, skipping"
  fi
done

echo "✅ All requested images processed."

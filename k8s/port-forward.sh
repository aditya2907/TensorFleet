#!/usr/bin/env bash
# Helper to manage kubectl port-forward for TensorFleet services
# Usage: ./port-forward.sh [start|stop|status|list] [options]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="tensorfleet"
PID_DIR="/tmp/tensorfleet-portforwards"
LOG_DIR="$PID_DIR/logs"

# Service -> local:remote mappings
# Portable mapping (avoid associative arrays for macOS compatibility)
SERVICES_LIST=(frontend api-gateway minio storage monitoring)

get_mapping() {
  case "$1" in
    frontend) echo "frontend:3000:3000" ;;
    api-gateway) echo "api-gateway:8080:8080" ;;
    minio) echo "minio-service:9001:9001" ;; # MinIO console
    storage) echo "storage:8081:8081" ;;
    monitoring) echo "monitoring:8082:8082" ;;
    *) return 1 ;;
  esac
}

print_usage() {
  cat <<EOF
Usage: $(basename "$0") <command> [options]

Commands:
  start        Start port forwards (default if no command specified)
  stop         Stop all running port-forwards managed by this script
  status       Show status of forwarded services
  list         Show available named services

Options:
  -s, --services <svc1,svc2>    Comma-separated list of services to manage (default: all)
  -b, --background              Start port-forwards in background and exit
  -n, --namespace <namespace>   Kubernetes namespace (default: tensorfleet)
  -h, --help                    Show this help

Examples:
  ./port-forward.sh start
  ./port-forward.sh start -b
  ./port-forward.sh stop
  ./port-forward.sh status
  ./port-forward.sh start -s frontend,api-gateway
EOF
}

ensure_dirs() {
  mkdir -p "$PID_DIR" "$LOG_DIR"
}

ensure_kubectl() {
  if ! command -v kubectl >/dev/null 2>&1; then
    echo "kubectl not found in PATH. Please install kubectl." >&2
    exit 1
  fi
}

svc_exists() {
  local svc=$1
  kubectl get svc "$svc" -n "$NAMESPACE" >/dev/null 2>&1
}

is_running_pid() {
  local pid=$1
  if [ -z "$pid" ]; then
    return 1
  fi
  if ps -p "$pid" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

port_in_use() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
  elif command -v ss >/dev/null 2>&1; then
    if ss -ltn "sport = :$port" | grep -q LISTEN >/dev/null 2>&1; then
      return 0
    fi
  else
    # Best-effort fallback
    if netstat -an 2>/dev/null | grep ".$port .*LISTEN" >/dev/null 2>&1; then
      return 0
    fi
  fi
  return 1
}

start_one() {
  local name=$1
  local mapping
  mapping=$(get_mapping "$name" 2>/dev/null || true)
  if [ -z "$mapping" ]; then
    echo "Unknown service: $name" >&2
    return 1
  fi
  local svc local_port remote_port
  svc=${mapping%%:*}
  local_port=$(echo "$mapping" | cut -d: -f2)
  remote_port=$(echo "$mapping" | cut -d: -f3)

  if ! svc_exists "$svc"; then
    echo "Service '$svc' not found in namespace '$NAMESPACE' — skipping"
    return 0
  fi

  local pidfile="$PID_DIR/$svc.pid"
  if [ -f "$pidfile" ]; then
    local existing_pid
    existing_pid=$(cat "$pidfile" 2>/dev/null || true)
    if is_running_pid "$existing_pid"; then
      echo "Port-forward for $svc already running (pid $existing_pid) — skipping"
      return 0
    else
      echo "Stale pidfile for $svc found. Removing..."
      rm -f "$pidfile"
    fi
  fi

  if port_in_use "$local_port"; then
    echo "Local port $local_port already in use — skipping $svc"
    return 0
  fi

  local logfile="$LOG_DIR/$svc.log"
  echo "Starting port-forward: svc/$svc $local_port:$remote_port (logs: $logfile)"
  # Start in background, capture PID
  (kubectl port-forward "svc/$svc" "$local_port:$remote_port" -n "$NAMESPACE" >"$logfile" 2>&1) &
  local pid=$!
  echo "$pid" > "$pidfile"
  sleep 0.5
  if is_running_pid "$pid"; then
    echo "$svc started (pid $pid)"
    return 0
  else
    echo "Failed to start port-forward for $svc. Check $logfile" >&2
    rm -f "$pidfile"
    return 1
  fi
}

stop_one() {
  local name=$1
  local mapping
  mapping=$(get_mapping "$name" 2>/dev/null || true)
  if [ -z "$mapping" ]; then
    echo "Unknown service: $name" >&2
    return 1
  fi
  local svc
  svc=${mapping%%:*}
  local pidfile="$PID_DIR/$svc.pid"
  if [ ! -f "$pidfile" ]; then
    echo "No pidfile for $svc — not running (or not managed by this script)"
    return 0
  fi
  local pid
  pid=$(cat "$pidfile" 2>/dev/null || true)
  if [ -z "$pid" ]; then
    echo "No pid found for $svc — removing pidfile"
    rm -f "$pidfile"
    return 0
  fi
  if is_running_pid "$pid"; then
    echo "Stopping $svc (pid $pid)..."
    kill "$pid" || true
    # wait briefly for termination
    for i in {1..10}; do
      if ! is_running_pid "$pid"; then break; fi
      sleep 0.2
    done
    if is_running_pid "$pid"; then
      echo "$svc did not stop; killing..."
      kill -9 "$pid" || true
    fi
  else
    echo "Process $pid not running — removing pidfile"
  fi
  rm -f "$pidfile"
}

start_all() {
  local services=($@)
  ensure_kubectl
  ensure_dirs
  local started=()
  for s in "${services[@]}"; do
    if start_one "$s"; then
      started+=("$s")
    fi
  done
}

stop_all() {
  ensure_dirs
  for p in "$PID_DIR"/*.pid; do
    [ -e "$p" ] || continue
    local svc
    svc=$(basename "$p" .pid)
    stop_one "$svc"
  done
}

status_all() {
  ensure_dirs
  for name in "${SERVICES_LIST[@]}"; do
    mapping=$(get_mapping "$name" 2>/dev/null || true)
    if [ -z "$mapping" ]; then
      echo "$name: unknown mapping"; continue
    fi
    svc=${mapping%%:*}
    pidfile="$PID_DIR/$svc.pid"
    if [ -f "$pidfile" ]; then
      pid=$(cat "$pidfile" 2>/dev/null || true)
      if is_running_pid "$pid"; then
        echo "$svc: running (pid $pid)"
      else
        echo "$svc: pidfile exists but process $pid not running"
      fi
    else
      echo "$svc: not running"
    fi
  done
}

list_services() {
  for n in "${SERVICES_LIST[@]}"; do
    printf "%s -> %s\n" "$n" "$(get_mapping "$n")"
  done
}

# CLI
CMD="start"
SERVICES=()
BG=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    start|stop|status|list)
      CMD="$1"; shift;;
    -s|--services)
      SERVICES_RAW="$2"; shift 2;;
    -b|--background)
      BG=true; shift;;
    -n|--namespace)
      NAMESPACE="$2"; shift 2;;
    -h|--help)
      print_usage; exit 0;;
    *)
      echo "Unknown arg: $1"; print_usage; exit 1;;
  esac
done

if [ -n "${SERVICES_RAW:-}" ]; then
  IFS=',' read -r -a SERVICES <<< "$SERVICES_RAW"
else
  SERVICES=("${SERVICES_LIST[@]}")
fi

case "$CMD" in
  start)
    start_all "${SERVICES[@]}"
    if [ "$BG" = true ]; then
      echo "Started in background. Use '$0 status' and '$0 stop' to manage.";
      exit 0
    else
      echo "Running port-forwards. Press Ctrl-C to stop.";
      trap 'echo "Stopping port-forwards..."; stop_all; exit 0' SIGINT SIGTERM
      # Wait while children run
      while true; do
        sleep 1
        # noop; processes are in background
      done
    fi
    ;;
  stop)
    stop_all
    ;;
  status)
    status_all
    ;;
  list)
    list_services
    ;;
  *)
    echo "Unknown command: $CMD"; print_usage; exit 1;;
esac

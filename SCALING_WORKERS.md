# Scaling Worker Nodes in TensorFleet

## Overview
TensorFleet uses Docker Compose's `deploy.replicas` feature to run multiple worker nodes for distributed ML training. The number of workers is now configurable via environment variables.

## Quick Start

### Method 1: Using Environment Variable (Recommended)

Set the `WORKER_REPLICAS` environment variable before starting the services:

```bash
# Scale to 8 workers
export WORKER_REPLICAS=8
docker compose up -d

# Or inline
WORKER_REPLICAS=8 docker compose up -d
```

### Method 2: Using .env File

1. Create or edit `.env` file in the project root:
```bash
# .env
WORKER_REPLICAS=8
```

2. Start services:
```bash
docker compose up -d
```

### Method 3: Using docker compose scale command

Scale workers dynamically without restarting all services:

```bash
# Scale to 8 workers
docker compose up -d --scale worker=8 --no-recreate

# Scale to 16 workers
docker compose up -d --scale worker=16 --no-recreate
```

## Checking Current Worker Count

```bash
# List all running workers
docker compose ps | grep worker

# Count workers
docker compose ps | grep -c "tensorfleet-worker-[0-9]"
```

## Default Configuration

- **Default replicas**: 3 workers
- **Configuration location**: `docker-compose.yml` (line ~86)
- **Environment variable**: `WORKER_REPLICAS`

## Scaling Considerations

### Resource Requirements
Each worker consumes:
- **CPU**: ~1-2 cores (depends on workload)
- **Memory**: ~512MB - 2GB (depends on model size)
- **Network**: Minimal

### Recommended Scaling

| Use Case | Workers | Total Resources |
|----------|---------|-----------------|
| Development | 2-3 | 2GB RAM, 2 CPU |
| Testing | 4-6 | 4GB RAM, 4 CPU |
| Production (Small) | 8-12 | 8GB RAM, 8 CPU |
| Production (Medium) | 16-24 | 16GB RAM, 16 CPU |
| Production (Large) | 32+ | 32GB+ RAM, 32+ CPU |

### Performance Tips

1. **Match CPU cores**: Set `WORKER_REPLICAS` close to your available CPU cores
2. **Monitor resources**: Use `docker stats` to monitor resource usage
3. **Avoid over-provisioning**: Too many workers can cause overhead
4. **Test incrementally**: Start small and scale up as needed

## Examples

### Development Setup (2 workers)
```bash
WORKER_REPLICAS=2 docker compose up -d
```

### Production Setup (12 workers)
```bash
WORKER_REPLICAS=12 docker compose up -d
```

### Dynamic Scaling (no downtime)
```bash
# Start with 4 workers
WORKER_REPLICAS=4 docker compose up -d

# Scale up to 8 workers later
docker compose up -d --scale worker=8 --no-recreate

# Scale down to 4 workers
docker compose up -d --scale worker=4 --no-recreate
```

## Monitoring Workers

### View worker logs
```bash
# All workers
docker compose logs -f worker

# Specific worker
docker compose logs -f tensorfleet-worker-3
```

### Check worker health
```bash
# List workers with status
docker compose ps worker

# Detailed stats
docker stats $(docker compose ps -q worker)
```

### Worker metrics
Access Prometheus metrics at: http://localhost:9090
- `worker_jobs_total` - Total jobs processed per worker
- `worker_jobs_active` - Currently active jobs
- `worker_cpu_usage` - CPU usage per worker
- `worker_memory_usage` - Memory usage per worker

## Troubleshooting

### Workers not scaling
```bash
# Stop all services
docker compose down

# Remove stale containers
docker compose rm -f

# Restart with new scale
WORKER_REPLICAS=8 docker compose up -d
```

### Resource exhaustion
```bash
# Check system resources
docker system df

# Check container resources
docker stats

# Reduce worker count
docker compose up -d --scale worker=3 --no-recreate
```

### Workers not connecting to orchestrator
```bash
# Check orchestrator health
docker compose logs orchestrator

# Check worker logs
docker compose logs worker | grep -i error

# Restart workers only
docker compose restart worker
```

## Advanced Configuration

### Per-Worker Resource Limits

Edit `docker-compose.yml` to add resource constraints:

```yaml
worker:
  deploy:
    replicas: ${WORKER_REPLICAS:-3}
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 512M
```

### Load Balancing

Workers automatically connect to the orchestrator via gRPC. The orchestrator distributes jobs using:
- Round-robin scheduling
- Least-loaded worker selection
- Automatic failover

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKER_REPLICAS` | 3 | Number of worker instances |
| `WORKER_PORT` | 50052 | Worker gRPC port |
| `ORCHESTRATOR_ADDR` | orchestrator:50051 | Orchestrator address |

## See Also

- [Docker Compose Scale Documentation](https://docs.docker.com/compose/compose-file/deploy/)
- [TensorFleet Architecture](./docs/ARCHITECTURE.md)
- [Monitoring Guide](./docs/MONITORING.md)

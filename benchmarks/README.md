# TensorFleet Benchmarks

Quantitative performance and scaling evaluation harness. Results and
analysis: [docs/PERFORMANCE_EVALUATION.md](../docs/PERFORMANCE_EVALUATION.md).

## Tools

| Script | Measures |
|---|---|
| `run_benchmarks.sh` | End-to-end runner: builds the Go services, starts orchestrator + gateway + worker fleets natively, runs the sweeps below |
| `benchmark_scaling.py` | Job-batch makespan and task throughput for one fleet size |
| `report_scaling.py` | Aggregates scaling runs into a speedup / parallel-efficiency table |
| `benchmark_gateway.py` | Gateway throughput + latency percentiles (p50/p90/p99) per endpoint |
| `benchmark_training.py` | Training time, samples/s, and accuracy for every worker-ml algorithm (sklearn + PyTorch) |

## Quick start

```bash
# Requires: Go toolchain, Python 3.9+. Redis optional (persistence is
# best-effort without it). No Docker needed.
./run_benchmarks.sh                       # full sweep: 1/2/4/8 workers
./run_benchmarks.sh --fleet "1 4" --jobs 4 --epochs 1   # quicker run

# Training benchmark needs the worker-ml deps:
pip install scikit-learn pandas numpy torch
python3 benchmark_training.py --samples 5000 --features 16 --epochs 10
```

The runner writes JSON results and service logs to `results/`. JSON files
are committed as the evidence backing the evaluation doc; logs are ignored.

## Benchmarking an existing deployment

Each Python tool takes `--gateway` so you can point it at a running
docker-compose or Kubernetes deployment instead of the native harness:

```bash
python3 benchmark_gateway.py --gateway http://localhost:8080
python3 benchmark_scaling.py --gateway http://localhost:8080 --workers 5 \
    --jobs 6 --epochs 2 --output results/scaling_k8s_w5.json
```

For Kubernetes, scale the fleet between runs with
`kubectl scale deployment/worker --replicas=N -n tensorfleet`.

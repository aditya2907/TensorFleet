# TensorFleet Performance & Scalability Evaluation

Quantitative evaluation of TensorFleet's control plane and worker fleet:
API gateway latency/throughput, horizontal worker scaling (speedup and
parallel efficiency), and ML training throughput per algorithm. All numbers
below are measured, not estimated, and are reproducible with the harness in
[`benchmarks/`](../benchmarks/).

## 1. Methodology

### Environment

| Component | Value |
|---|---|
| Hardware | Apple M4, 10 CPU cores, 16 GB RAM |
| OS | macOS 26.6 |
| Go | 1.25.5 (orchestrator, api-gateway, worker) |
| Python | 3.13 (benchmark harness, worker-ml algorithms) |
| PyTorch | 2.x, MPS backend (Apple GPU) |
| Topology | All services as native processes on one host (no container overhead) |

Redis was intentionally absent during these runs: the gateway and
orchestrator degrade gracefully (persistence becomes best-effort), which is
itself part of what is being validated. Job submission latency therefore
*includes* the cost of failed Redis persistence attempts — a worst-case
number.

### Workload

- **Scaling benchmark** — a fixed batch of 6 training jobs × 2 epochs
  = **120 tasks**, where each task simulates 1–4 s of training work
  (uniform, avg ≈ 2.5 s). The same batch is run against fleets of 1, 2, 4,
  and 8 workers (each worker: `MAX_CONCURRENT_TASKS=2`,
  `FETCH_INTERVAL_MS=500`). Makespan is wall-clock from first submission to
  last job completion.
- **Gateway benchmark** — 16 concurrent clients issuing 400 requests per
  read endpoint and 50 job submissions, measuring throughput and latency
  percentiles.
- **Training benchmark** — each algorithm trains on a synthetic
  5,000-sample × 16-feature, 3-class dataset (PyTorch models: 10 epochs,
  batch 32).

## 2. Worker fleet scaling

**Result: near-linear scaling to 8 workers — 6.84× speedup at 85.5%
parallel efficiency.**

| Workers | Makespan (s) | Throughput (tasks/s) | Speedup | Efficiency |
|---:|---:|---:|---:|---:|
| 1 | 172.0 | 0.70 | 1.00× | 100.0% |
| 2 | 91.6 | 1.31 | 1.88× | 93.9% |
| 4 | 47.5 | 2.53 | 3.62× | 90.6% |
| 8 | 25.2 | 4.77 | 6.84× | 85.5% |

Time-to-first-result also improves with fleet size: the first job completed
after 9.1 s with 4 workers and 7.0 s with 8 workers.

### Analysis

- Scaling is close to ideal through 4 workers (>90% efficiency). The pull
  model (workers long-poll `AssignTask`) distributes load without any
  scheduler-side placement logic, so adding workers requires no
  reconfiguration — the fleet self-balances.
- Efficiency decays gently (100% → 85.5%) rather than hitting a cliff. The
  measured losses come from three sources, in order of impact:
  1. **Pickup latency** — each worker polls on a fixed interval, so a task
     slot can sit idle up to one `FETCH_INTERVAL_MS` after a task finishes.
  2. **Tail effect** — with 120 tasks of random 1–4 s duration, the last
     few tasks leave part of the fleet idle near the end (classic makespan
     tail; smaller relative cost with longer task queues).
  3. **Serialized assignment** — `AssignTask` hands out one task per RPC
     from a single queue; at 8 workers × 2 slots this is still far from
     saturation (assignment takes ~ms against ~2.5 s tasks), but it is the
     eventual ceiling (see §5).
- Extrapolating with these measured overheads, the current
  single-orchestrator design has headroom well beyond 8 workers for
  training-scale tasks (seconds each); assignment would only become the
  bottleneck when aggregate task completion rates approach hundreds per
  second.

## 3. API gateway latency & throughput

16 concurrent clients, 400 requests per read scenario, 50 submissions.

| Endpoint | Throughput | p50 | p90 | p99 | Errors |
|---|---:|---:|---:|---:|---:|
| `GET /health` | 7,607 req/s | 1.9 ms | — | 4.2 ms | 0 |
| `GET /worker-activity` (gRPC fan-in) | 6,458 req/s | 2.3 ms | — | 4.5 ms | 0 |
| `GET /api/v1/jobs/:id` (gRPC lookup) | 6,982 req/s | 2.1 ms | — | 4.3 ms | 0 |
| `POST /api/v1/jobs` (job creation) | 81 req/s | 165 ms | — | 223 ms | 0 |

### Analysis

- Read-path latency is dominated by the gateway↔orchestrator gRPC hop and
  stays under 5 ms at p99 even at ~7,000 req/s — comfortable headroom over
  the dashboard's polling load (a few requests every 5 s per client).
- Job submission is heavier by design: it creates and enqueues 10 tasks per
  epoch and attempts Redis persistence. In this Redis-less worst case it
  still sustains **81 jobs/s with zero errors** — three orders of magnitude
  above realistic submission rates. With Redis available, the retry
  overhead disappears and submission latency drops accordingly.
- Zero errors across all scenarios also demonstrates the backpressure path
  is not triggered under this load (the 1,000-task queue absorbed 500
  queued tasks from the submission burst).

## 4. ML training throughput (worker-ml algorithms)

Synthetic dataset: 5,000 × 16, 3 classes. PyTorch models: 10 epochs,
batch 32, on Apple MPS.

| Algorithm | Framework | Training time | Samples/s | Test accuracy |
|---|---|---:|---:|---:|
| `logistic_regression` | scikit-learn | 0.02 s | 236,402 | 0.732 |
| `decision_tree` | scikit-learn | 0.03 s | 116,718 | 0.744 |
| `random_forest` | scikit-learn | 0.60 s | 6,625 | 0.878 |
| `pytorch_logistic` | PyTorch (MPS) | 2.8 s | 14,156 | 0.714 |
| `pytorch_mlp` | PyTorch (MPS) | 3.2 s | 12,654 | **0.921** |
| `pytorch_cnn` | PyTorch (MPS) | 3.4 s | 11,918 | 0.900 |
| `pytorch_lstm` | PyTorch (MPS) | 4.8 s | 8,339 | 0.844 |
| `pytorch_transformer` | PyTorch (MPS) | 9.2 s | 4,330 | 0.756 |

### Analysis

- The classic accuracy/cost trade-off is visible and quantified: the
  PyTorch MLP buys +4.3 accuracy points over random forest for ~5× the
  training time; the transformer's attention overhead is not justified on
  this small tabular dataset.
- On small batches the GPU dispatch overhead dominates for the tiny models
  (`pytorch_logistic` is 100× slower than its sklearn equivalent) — the
  neural path pays off only for the architectures sklearn cannot express.

## 5. Identified bottlenecks & scaling limits

Measured or structural limits, in the order they would be hit:

1. **Single orchestrator instance** — job/task state is in-memory behind
   one mutex (k8s `replicas: 1`). Mitigations already in place: Redis
   persistence of job state, task leasing with automatic requeue, and queue
   backpressure (`ResourceExhausted` at 1,000 queued tasks). Removing the
   limit requires externalizing the queue (Redis Streams/NATS) — see §6.
2. **Fixed-interval task pickup** — up to one fetch interval of idle time
   per task slot. Cost is bounded and tunable (`FETCH_INTERVAL_MS`);
   a streaming/long-poll assignment RPC would eliminate it.
3. **Storage service single replica** — artifact I/O now streams in 64 KB
   chunks (constant memory), but bandwidth is bounded by one pod until it
   is scaled horizontally behind its service.

## 6. Threats to validity & future work

- **Single-host measurement**: all processes shared one machine, so
  network latency between services is loopback-level. Cross-node k8s
  deployments add ~0.1–1 ms per hop, which is negligible against multi-
  second tasks but would shave read-path throughput.
- **Simulated task payloads** in the Go worker isolate *orchestration*
  scalability from ML framework performance (measured separately in §4).
  End-to-end distributed training throughput is the compose of the two.
- Future work: repeat the scaling sweep on a multi-node cluster with the
  worker HPA active; measure orchestrator failover recovery time using the
  task-lease reaper; benchmark storage streaming under concurrent
  large-artifact downloads.

## 7. Reproducing these results

```bash
# Full suite: builds Go services, runs the fleet sweep + gateway benchmark
cd benchmarks
./run_benchmarks.sh --fleet "1 2 4 8" --jobs 6 --epochs 2

# ML training throughput (needs worker-ml deps: scikit-learn, torch, pandas)
python3 benchmark_training.py --samples 5000 --features 16 --epochs 10

# Aggregate any set of scaling runs into a speedup table
python3 report_scaling.py results/scaling_w*.json
```

Raw JSON outputs from the run reported here are committed under
[`benchmarks/results/`](../benchmarks/results/).

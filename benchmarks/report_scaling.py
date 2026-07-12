#!/usr/bin/env python3
"""
Aggregate benchmark_scaling.py outputs into a speedup/efficiency table.

Usage:
    python3 report_scaling.py results/scaling_w*.json
"""
import json
import sys


def main():
    if len(sys.argv) < 2:
        print('Usage: report_scaling.py <scaling_w*.json> ...', file=sys.stderr)
        sys.exit(1)

    runs = sorted(
        (json.load(open(path)) for path in sys.argv[1:]),
        key=lambda r: r['workers'],
    )
    baseline = runs[0]

    print(f"\nWorkload: {baseline['jobs']} jobs x {baseline['epochs_per_job']} "
          f"epochs = {baseline['total_tasks']} tasks "
          f"(baseline: {baseline['workers']} worker(s))\n")
    header = (f"{'Workers':>8} | {'Makespan (s)':>13} | {'Tasks/s':>8} | "
              f"{'Speedup':>8} | {'Efficiency':>10}")
    print(header)
    print('-' * len(header))
    for run in runs:
        speedup = baseline['makespan_s'] / run['makespan_s']
        efficiency = speedup / (run['workers'] / baseline['workers'])
        print(f"{run['workers']:>8} | {run['makespan_s']:>13.1f} | "
              f"{run['tasks_per_second']:>8.2f} | {speedup:>7.2f}x | "
              f"{efficiency * 100:>9.1f}%")
    print()


if __name__ == '__main__':
    main()

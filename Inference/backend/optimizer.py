"""
optimizer.py - Simulates intelligent request routing and GPU scheduling for KV Cognition
"""

clusters = [
    {"name": "H100-cluster", "gpu": "H100 80GB", "cost_hr": 3.2, "tokens_sec": 230, "cost_token": 0.00000386},
    {"name": "A100-cluster", "gpu": "A100 80GB", "cost_hr": 1.65, "tokens_sec": 125, "cost_token": 0.00000367},
    {"name": "RTX4090-cluster", "gpu": "RTX 4090", "cost_hr": 0.5, "tokens_sec": 45, "cost_token": 0.00000309},
    {"name": "L40S-cluster", "gpu": "L40S", "cost_hr": 0.87, "tokens_sec": 44, "cost_token": 0.00000549},
]

def select_best_cluster(tokens, latency_target):
    # Select cluster with lowest cost/token that meets throughput
    best = None
    for c in clusters:
        time_needed = tokens / c["tokens_sec"]
        if time_needed <= latency_target:
            if best is None or c["cost_token"] < best["cost_token"]:
                best = c
    return best

if __name__ == "__main__":
    tokens = 1000000
    latency = 10
    best = select_best_cluster(tokens, latency)
    print(f"Best cluster: {best['name']} ({best['gpu']})")

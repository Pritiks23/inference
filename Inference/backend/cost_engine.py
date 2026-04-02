"""
cost_engine.py - Real-Time Inference Cost Engine for KV Cognition
"""

clusters = [
    {"name": "H100-cluster", "gpu": "H100 80GB", "cost_hr": 3.2, "tokens_sec": 230, "cost_token": 0.00000386},
    {"name": "A100-cluster", "gpu": "A100 80GB", "cost_hr": 1.65, "tokens_sec": 125, "cost_token": 0.00000367},
    {"name": "RTX4090-cluster", "gpu": "RTX 4090", "cost_hr": 0.5, "tokens_sec": 45, "cost_token": 0.00000309},
    {"name": "L40S-cluster", "gpu": "L40S", "cost_hr": 0.87, "tokens_sec": 44, "cost_token": 0.00000549},
]

def calculate_cost(tokens, cluster_name, batch_boost=1.0, cost_reduction=1.0):
    c = next((x for x in clusters if x['name'] == cluster_name), None)
    if not c:
        raise ValueError("Cluster not found")
    tokens_sec = c['tokens_sec'] * batch_boost
    hours = tokens / tokens_sec / 3600
    raw_cost = c['cost_hr'] * hours
    optimized_cost = raw_cost * cost_reduction
    return optimized_cost, optimized_cost / tokens

if __name__ == "__main__":
    tokens = 1000000
    cost, per_token = calculate_cost(tokens, "RTX4090-cluster", batch_boost=1.3, cost_reduction=0.8)
    print(f"Optimized cost: ${cost:.2f} (${per_token:.8f} per token)")

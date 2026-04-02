"""
batcher.py - Simulates automated batch formation and model selection for KV Cognition
"""

def optimal_batch_size(latency_target, tokens_per_req, model_speed):
    """
    Returns optimal batch size for given latency and model speed.
    """
    max_batch = int(model_speed * latency_target / tokens_per_req)
    return max(1, min(max_batch, 32))  # cap batch size at 32

def select_model(models, tokens_per_sec_needed):
    """
    Selects the model that meets throughput at lowest cost.
    """
    best = None
    for m in models:
        if m['tokens_sec'] >= tokens_per_sec_needed:
            if best is None or m['cost_token'] < best['cost_token']:
                best = m
    return best

if __name__ == "__main__":
    models = [
        {'name': 'H100', 'tokens_sec': 230, 'cost_token': 0.00000386},
        {'name': 'A100', 'tokens_sec': 125, 'cost_token': 0.00000367},
    ]
    print("Optimal batch size:", optimal_batch_size(10, 100, 230))
    print("Best model:", select_model(models, 120))

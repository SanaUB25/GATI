import numpy as np


def simulate_delays(base_delay: float, count: int = 1000, seed: int = 42) -> list[float]:
    if count < 1:
        raise ValueError('count must be positive')
    rng = np.random.default_rng(seed)
    return np.maximum(0, rng.lognormal(mean=np.log(max(base_delay, 1)), sigma=0.35, size=count)).round(2).tolist()


def simulate_imported_scenarios(base_delay: float, scenarios: list[dict]) -> list[float]:
    """Evaluate scenario records supplied by Express from MongoDB, never from CSV."""
    if not scenarios:
        return []
    return [round(max(0, base_delay * float(item['traffic_factor']) + float(item['train_delay']) + float(item['maintenance_overrun']) * (1 + float(item['asset_risk']))), 2) for item in scenarios]

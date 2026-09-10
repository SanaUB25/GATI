import numpy as np


def simulate_delays(base_delay: float, count: int = 1000, seed: int = 42) -> list[float]:
    if count < 1:
        raise ValueError('count must be positive')
    rng = np.random.default_rng(seed)
    return np.maximum(0, rng.lognormal(mean=np.log(max(base_delay, 1)), sigma=0.35, size=count)).round(2).tolist()

import numpy as np


def summarize_history(delays: list[float]) -> dict:
    if not delays:
        raise ValueError('Historical delay data is required')
    values = np.asarray(delays, dtype=float)
    return {'count': int(values.size), 'mean': float(values.mean()), 'median': float(np.median(values)), 'p95': float(np.percentile(values, 95)), 'std': float(values.std())}

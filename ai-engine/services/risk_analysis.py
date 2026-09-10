import numpy as np


def summarize_outcomes(outcomes: list[float]) -> dict:
    if not outcomes:
        raise ValueError('At least one outcome is required')
    values = np.asarray(outcomes, dtype=float)
    var90 = float(np.percentile(values, 90))
    tail = values[values >= var90]
    return {
        'mean_delay': float(np.mean(values)),
        'p95_delay': float(np.percentile(values, 95)),
        'cvar10_delay': float(np.mean(tail)),
        'cascade_probability': 0.0,
        'emergency_rate': 0.0,
        'sample_count': int(values.size),
    }

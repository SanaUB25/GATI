import numpy as np


def summarize_outcomes(outcomes: list[float], scenarios: list[dict] | None = None) -> dict:
    if not outcomes:
        raise ValueError('At least one outcome is required')
    values = np.asarray(outcomes, dtype=float)
    var90 = float(np.percentile(values, 90))
    tail = values[values >= var90]
    scenarios = scenarios or []
    return {
        'mean_delay': float(np.mean(values)),
        'p95_delay': float(np.percentile(values, 95)),
        'cvar10_delay': float(np.mean(tail)),
        'cascade_probability': round(sum(1 for value in values if value >= float(np.percentile(values, 90))) / len(values), 4),
        'emergency_rate': round(sum(1 for scenario in scenarios if scenario.get('emergency_event')) / len(scenarios), 4) if scenarios else 0.0,
        'sample_count': int(values.size),
    }

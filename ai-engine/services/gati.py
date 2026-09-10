def calculate_gati(mean_delay: float, cvar10_delay: float) -> float:
    if mean_delay < 0 or cvar10_delay < 0:
        raise ValueError('Delay metrics cannot be negative')
    return round(0.6 * mean_delay + 0.4 * cvar10_delay, 3)

def calculate_priority(criticality: float, severity: float, overdue_days: float, weather_risk: float, asset_importance: float) -> float:
    values = [criticality, severity, overdue_days, weather_risk, asset_importance]
    if any(value < 0 for value in values):
        raise ValueError('Priority factors cannot be negative')
    score = 0.25 * criticality + 0.25 * severity + 0.2 * min(overdue_days / 30, 5) + 0.15 * weather_risk + 0.15 * asset_importance
    return round(min(score / 5 * 100, 100), 3)

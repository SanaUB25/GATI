SEASON_RISK = {'Monsoon': 1.35, 'Summer': 1.12, 'Winter': 1.08, 'Other': 1.0}


def priority_factors(criticality: float, severity: float, overdue_days: float, weather_risk: float,
                     asset_importance: float, season: str = 'Other', section_importance: float = 1,
                     urgency: float = 1, availability_impact: float = 1) -> dict:
    """Deterministic, auditable RiskClock score. Values are intentionally bounded."""
    values = [criticality, severity, overdue_days, weather_risk, asset_importance, section_importance, urgency, availability_impact]
    if any(value < 0 for value in values):
        raise ValueError('Priority factors cannot be negative')
    season_multiplier = SEASON_RISK.get(season, SEASON_RISK['Other'])
    components = {
        'defect_severity': severity * 5.0,
        'overdue_maintenance': min(overdue_days / 30, 5) * 4.0,
        'asset_criticality': criticality * 4.5,
        'weather_condition': weather_risk * 3.5,
        'asset_importance': asset_importance * 2.5,
        'track_section_importance': section_importance * 2.5,
        'urgency': urgency * 3.0,
        'availability_impact': availability_impact * 2.0,
    }
    base = sum(components.values())
    score = round(min(base * season_multiplier, 100), 3)
    return {'score': score, 'season_multiplier': season_multiplier, 'components': components,
            'influencing_factors': [key for key, value in components.items() if value > 0] + [f'season:{season}']}


def calculate_priority(criticality: float, severity: float, overdue_days: float, weather_risk: float,
                       asset_importance: float, season: str = 'Other', section_importance: float = 1, urgency: float = 1, availability_impact: float = 1) -> float:
    return priority_factors(criticality, severity, overdue_days, weather_risk, asset_importance, season, section_importance, urgency, availability_impact)['score']

from .optimizer import generate_plans


def plan_horizon(payload: dict, horizons: list[dict]) -> list[dict]:
    results = []
    for horizon in horizons:
        scoped = {**payload, 'windows': [window for window in payload.get('windows', []) if window['start_min'] >= horizon['start_min'] and window['end_min'] <= horizon['end_min']]}
        results.extend(generate_plans(scoped, plan_count=1))
    return results

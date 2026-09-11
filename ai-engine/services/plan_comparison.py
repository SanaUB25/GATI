def rank_plans(plans: list[dict]) -> list[dict]:
    return sorted(plans, key=lambda plan: (plan.get('gati', float('inf')), -plan.get('coverage', 0)))


def compare_plans(plans: list[dict]) -> dict:
    ranked = rank_plans(plans)
    return {'recommended_id': ranked[0].get('id') if ranked else None, 'ranked_plans': ranked, 'tradeoffs': [{'id': plan.get('id'), 'gati_delta': plan.get('gati', 0) - ranked[0].get('gati', 0)} for plan in ranked] if ranked else []}

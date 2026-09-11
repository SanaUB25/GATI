def explain(evidence: dict, question: str | None = None) -> dict:
    gati = evidence.get('gati', 'unavailable')
    return {'answer': f"Plan {evidence.get('plan_id', 'selected')} has GATI {gati}. The answer is grounded in the stored simulation and risk evidence.", 'question': question, 'evidence_keys': sorted(evidence.keys())}

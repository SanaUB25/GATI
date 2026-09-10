def repair_plan(plan: dict, disruption: dict) -> dict:
    affected = set(disruption.get('affected_task_ids', []))
    blocks = [{**block, 'status': 'FROZEN' if block.get('completed') or not affected.intersection(block.get('task_ids', [])) else 'MOVABLE'} for block in plan.get('blocks', [])]
    return {**plan, 'blocks': blocks, 'repair_reason': disruption.get('type', 'UNKNOWN'), 'status': 'REPAIRED'}

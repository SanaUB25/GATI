def repair_plan(plan: dict, disruption: dict) -> dict:
    """Repair only the unsettled tail: completed work and approved blocks remain immutable."""
    emergency = disruption.get('emergency_task', {})
    affected = set(disruption.get('affected_task_ids', []))
    fixed, movable = [], []
    for block in plan.get('blocks', []):
        frozen = block.get('completed') or block.get('approved') or block.get('status') in {'COMPLETED', 'FROZEN', 'APPROVED'}
        next_block = {**block, 'status': 'FROZEN' if frozen else 'MOVABLE'}
        (fixed if frozen else movable).append(next_block)
    if emergency:
        emergency_id = emergency.get('id', 'EMERGENCY')
        section = emergency.get('section_id')
        candidate = next((block for block in movable if section and section in block.get('section_ids', [])), movable[0] if movable else None)
        if candidate:
            candidate['task_ids'] = [*candidate.get('task_ids', []), emergency_id]
            candidate['emergency_added'] = True
        else:
            movable.append({'window_id': emergency.get('window_id', 'emergency-window'), 'task_ids': [emergency_id], 'status': 'MOVABLE', 'emergency_added': True})
        affected.add(emergency_id)
    original_delay = float(plan.get('metrics', {}).get('mean_delay', 0))
    delay_delta = float(disruption.get('estimated_delay_delta', emergency.get('duration_min', 0) if emergency else 0))
    repaired_metrics = {**plan.get('metrics', {}), 'mean_delay': original_delay + delay_delta}
    return {'original_plan_id': plan.get('id', plan.get('_id')), 'status': 'REPAIRED', 'repair_reason': disruption.get('type', 'EMERGENCY_MAINTENANCE'),
            'added_emergency': emergency or None, 'affected_task_ids': sorted(affected), 'frozen_blocks': fixed,
            'reoptimized_blocks': movable, 'blocks': [*fixed, *movable], 'comparison': {'original_mean_delay': original_delay, 'repaired_mean_delay': original_delay + delay_delta, 'delay_difference': delay_delta}, 'metrics': repaired_metrics}

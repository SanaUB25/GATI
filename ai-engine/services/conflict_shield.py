def detect_conflicts(assignments: list[dict], trains: list[dict] | None = None, safety_margin_min: int = 10) -> list[dict]:
    """Classify candidate overlaps; callers can render SAFE versus UNSAFE explicitly."""
    conflicts = []
    trains = trains or []
    for index, left in enumerate(assignments):
        for right in assignments[index + 1:]:
            same_section = left.get('section_id') and left.get('section_id') == right.get('section_id')
            same_window = left.get('window_id') == right.get('window_id')
            shared_resource = bool(set(left.get('resources', [])) & set(right.get('resources', [])))
            if same_section and same_window:
                conflicts.append({'classification': 'UNSAFE' if shared_resource else 'SAFE',
                                  'type': 'RESOURCE_OCCUPANCY' if shared_resource else 'COMPATIBLE_PARALLEL_WORK',
                                  'task_ids': [left['task_id'], right['task_id']], 'section_id': left.get('section_id'),
                                  'reason': 'Shared exclusive resource' if shared_resource else 'Distinct department resources in same block'})
    for assignment in assignments:
        start, end = assignment.get('start_min', 0), assignment.get('end_min', 0)
        for train in trains:
            uses_section = assignment.get('section_id') in train.get('route', [])
            occupies = max(start - safety_margin_min, train.get('departure', 0)) < min(end + safety_margin_min, train.get('arrival', 0))
            if uses_section and occupies:
                conflicts.append({'classification': 'UNSAFE', 'type': 'TRAIN_TIMETABLE', 'task_ids': [assignment['task_id']],
                                  'section_id': assignment.get('section_id'), 'train_id': train.get('id'),
                                  'reason': f'{safety_margin_min} minute safety margin infringed'})
    return conflicts

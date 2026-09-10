def detect_conflicts(assignments: list[dict]) -> list[dict]:
    seen_windows = {}
    conflicts = []
    for assignment in assignments:
        window_id = assignment['window_id']
        if window_id in seen_windows:
            conflicts.append({'type': 'WINDOW_OVERLAP', 'task_ids': [seen_windows[window_id], assignment['task_id']]})
        else:
            seen_windows[window_id] = assignment['task_id']
    return conflicts

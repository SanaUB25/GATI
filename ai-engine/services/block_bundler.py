def _overlap(left: dict, right: dict) -> bool:
    return max(left.get('earliest_start', 0), right.get('earliest_start', 0)) < min(left.get('latest_end', 1440), right.get('latest_end', 1440))


def bundle_tasks(tasks: list[dict]) -> list[dict]:
    """Bundle only same-section work with an overlapping possession and safe crews.

    Separate department crews may work in the same block; duplicate exclusive resources may not.
    """
    remaining = list(tasks)
    bundles = []
    while remaining:
        anchor = remaining.pop(0)
        group = [anchor]
        used_resources = set(anchor.get('resources', []))
        for other in remaining[:]:
            same_section = other.get('section_id', other.get('corridor_id')) == anchor.get('section_id', anchor.get('corridor_id'))
            safe_resources = not (used_resources & set(other.get('resources', [])))
            if same_section and _overlap(anchor, other) and safe_resources:
                group.append(other); used_resources.update(other.get('resources', [])); remaining.remove(other)
        departments = sorted({task.get('department', 'UNASSIGNED') for task in group})
        duration = max(task.get('duration_min', 0) for task in group)
        separate = sum(task.get('duration_min', 0) for task in group)
        bundles.append({'bundle_id': f"bundle-{len(bundles) + 1}", 'task_ids': [task['id'] for task in group],
                        'section_id': anchor.get('section_id', anchor.get('corridor_id')), 'departments': departments,
                        'tasks_combined': len(group), 'before_block_minutes': separate,
                        'after_block_minutes': duration, 'block_time_saved_minutes': max(0, separate - duration),
                        'window': {'start_min': max(task.get('earliest_start', 0) for task in group), 'end_min': min(task.get('latest_end', 1440) for task in group)}})
    return bundles

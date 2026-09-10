def bundle_tasks(tasks: list[dict]) -> list[dict]:
    bundles = []
    for task in tasks:
        compatible = [other['id'] for other in tasks if other['id'] != task['id'] and other.get('corridor_id') == task.get('corridor_id') and other.get('resources', []) == task.get('resources', [])]
        bundles.append({'task_ids': [task['id'], *compatible], 'corridor_id': task.get('corridor_id')})
    return bundles

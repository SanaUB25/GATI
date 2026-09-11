from ortools.sat.python import cp_model


def generate_plans(payload: dict, plan_count: int = 3, time_limit_seconds: int = 30) -> list[dict]:
    tasks = payload['tasks']
    windows = payload['windows']
    trains = payload.get('trains', [])
    safety_margin = int(payload.get('safety_margin_min', 10))
    results = []
    previous_assignments = []
    for profile in range(plan_count):
        model = cp_model.CpModel()
        choices = {}
        for task in tasks:
            for window in windows:
                in_task_window = window['start_min'] >= task.get('earliest_start', 0) and window['end_min'] <= task.get('latest_end', 1440)
                train_conflict = any(task.get('section_id') in train.get('route', []) and max(window['start_min'] - safety_margin, train.get('departure', 0)) < min(window['end_min'] + safety_margin, train.get('arrival', 0)) for train in trains)
                if window['end_min'] - window['start_min'] >= task['duration_min'] and in_task_window and not train_conflict:
                    choices[(task['id'], window['id'])] = model.NewBoolVar(f"assign_{task['id']}_{window['id']}")
            task_choices = [value for (task_id, _), value in choices.items() if task_id == task['id']]
            if task_choices:
                model.Add(sum(task_choices) <= 1)
        # CP-SAT hard constraints: the same section/resource cannot occupy a block twice.
        # Different department resources are allowed in parallel as one bundled block.
        for window in windows:
            for left_index, left in enumerate(tasks):
                for right in tasks[left_index + 1:]:
                    same_section = left.get('section_id') == right.get('section_id')
                    shared_resource = bool(set(left.get('resources', [left.get('resource', 'track')])) & set(right.get('resources', [right.get('resource', 'track')])))
                    if same_section and shared_resource:
                        a, b = choices.get((left['id'], window['id'])), choices.get((right['id'], window['id']))
                        if a is not None and b is not None: model.Add(a + b <= 1)
        if previous_assignments:
            differences = []
            for key, variable in choices.items():
                previous = previous_assignments[-1].get(key, 0)
                differences.append(variable if previous == 0 else 1 - variable)
            if differences:
                model.Add(sum(differences) >= min(2, len(differences)))
        objective = []
        for task in tasks:
            for window in windows:
                variable = choices.get((task['id'], window['id']))
                # OR-Tools variables cannot be evaluated as booleans.
                if variable is not None:
                    weight = int(task['priority_score'] * 100) - profile * int(task['duration_min'])
                    objective.append(weight * variable)
        model.Maximize(sum(objective))
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        status = solver.Solve(model)
        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            continue
        assignment = {key: int(solver.Value(variable)) for key, variable in choices.items()}
        previous_assignments.append(assignment)
        task_by_id = {task['id']: task for task in tasks}; window_by_id = {window['id']: window for window in windows}
        assignments = []
        for (task_id, window_id), value in assignment.items():
            if value:
                task, window = task_by_id[task_id], window_by_id[window_id]
                assignments.append({'task_id': task_id, 'window_id': window_id, 'section_id': task.get('section_id'), 'resources': task.get('resources', [task.get('resource', 'track')]), 'start_min': window['start_min'], 'end_min': window['end_min']})
        results.append({'id': f'plan_{len(results) + 1}', 'status': 'FEASIBLE', 'assignments': assignments, 'solver_status': solver.StatusName(status), 'objective': solver.ObjectiveValue()})
    return results

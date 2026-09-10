from ortools.sat.python import cp_model


def generate_plans(payload: dict, plan_count: int = 3, time_limit_seconds: int = 30) -> list[dict]:
    tasks = payload['tasks']
    windows = payload['windows']
    results = []
    previous_assignments = []
    for profile in range(plan_count):
        model = cp_model.CpModel()
        choices = {}
        for task in tasks:
            for window in windows:
                if window['end_min'] - window['start_min'] >= task['duration_min']:
                    choices[(task['id'], window['id'])] = model.NewBoolVar(f"assign_{task['id']}_{window['id']}")
            task_choices = [value for (task_id, _), value in choices.items() if task_id == task['id']]
            if task_choices:
                model.Add(sum(task_choices) <= 1)
        for window in windows:
            model.Add(sum(value for (task_id, window_id), value in choices.items() if window_id == window['id']) <= 1)
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
        results.append({'id': f'plan_{len(results) + 1}', 'status': 'FEASIBLE', 'assignments': [{'task_id': task_id, 'window_id': window_id} for (task_id, window_id), value in assignment.items() if value], 'solver_status': solver.StatusName(status), 'objective': solver.ObjectiveValue()})
    return results

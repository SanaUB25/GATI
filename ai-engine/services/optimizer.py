from ortools.sat.python import cp_model

def overlaps(a, b): return max(a['start_min'], b['start_min']) < min(a['end_min'], b['end_min'])
def freight(section, window, forecasts): return sum(round(float(f.get('capacity_demand',0))*100) for f in forecasts if f.get('section_id') == section and overlaps(window,f))
def train_occupies_section(train, section, start, end, safety_margin):
    """Protect only the train's deterministic traversal interval for this section.

    Timetable imports contain an end-to-end route interval, not a full
    section-by-section timetable.  Until detailed timing is imported, split
    that interval evenly across the ordered route; treating the whole journey
    as occupancy on every section incorrectly blocks an entire corridor.
    """
    route=train.get('route', [])
    if section not in route: return False
    index=route.index(section); span=max(1, train.get('arrival', 0)-train.get('departure', 0)); count=max(1, len(route))
    section_start=train.get('departure', 0) + index * span / count
    section_end=train.get('departure', 0) + (index + 1) * span / count
    return max(start-safety_margin, section_start) < min(end+safety_margin, section_end)

def generate_plans(payload: dict, plan_count: int = 3, time_limit_seconds: int = 30, diagnostics: bool = False):
    """Schedules task/bundle units only inside persisted non-BLOCKED COA possessions."""
    tasks=payload['tasks']; windows=[w for w in payload['windows'] if w.get('availability_status','AVAILABLE')!='BLOCKED']; by_id={t['id']:t for t in tasks}
    units=[{'id':f"task:{t['id']}",'task_ids':[t['id']],'section_id':t.get('section_id'),'duration_min':t['duration_min'],'departments':[t.get('department')],'resources':t.get('resources',[t.get('department')]),'time_saved':0} for t in tasks]
    for b in payload.get('bundles',[]):
        members=[by_id[i] for i in b['task_ids'] if i in by_id]
        if len(members)>1: units.append({'id':b['bundle_id'],'bundle_id':b['bundle_id'],'task_ids':b['task_ids'],'section_id':b['section_id'],'duration_min':b['after_block_minutes'],'departments':b['departments'],'resources':sorted({r for t in members for r in t.get('resources',[t.get('department')])}),'time_saved':b.get('block_time_saved_minutes',0)})
    profiles=[{'priority':100,'freight':20,'downtime':10},{'priority':75,'freight':65,'downtime':25},{'priority':125,'freight':10,'downtime':45}]; results=[]; previous=[]
    excluded={'COA BLOCKED': 0, 'DOES NOT FIT WINDOW': 0, 'OUTSIDE PLANNING WINDOW': 0, 'DEPARTMENT NOT ALLOWED': 0, 'TRAIN CONFLICT': 0}
    option_rows=[]
    for u in units:
        for raw_window in payload['windows']:
            if raw_window.get('availability_status','AVAILABLE') == 'BLOCKED':
                excluded['COA BLOCKED'] += 1; continue
            members=[by_id[i] for i in u['task_ids']]
            if raw_window.get('section_id') != u['section_id'] or raw_window['end_min']-raw_window['start_min'] < u['duration_min']:
                excluded['DOES NOT FIT WINDOW'] += 1; continue
            if not all(raw_window['start_min']>=t.get('earliest_start',0) and raw_window['end_min']<=t.get('latest_end',1440) for t in members):
                excluded['OUTSIDE PLANNING WINDOW'] += 1; continue
            if not all(t.get('department') in raw_window.get('allowed_departments',['ENGINEERING','SNT','TRD']) for t in members):
                excluded['DEPARTMENT NOT ALLOWED'] += 1; continue
            train=any(train_occupies_section(tr, u['section_id'], raw_window['start_min'], raw_window['end_min'], int(payload.get('safety_margin_min',10))) for tr in payload.get('trains',[]))
            if train: excluded['TRAIN CONFLICT'] += 1; continue
            option_rows.append({'unit_id':u['id'], 'task_ids':u['task_ids'], 'section_id':u['section_id'], 'window_id':raw_window['id'], 'duration_min':u['duration_min'], 'departments':u['departments']})
    run_profiles=[]
    for p in range(plan_count):
        weights={**profiles[p%3],**payload.get('tradeoff_weights',{})}; model=cp_model.CpModel(); choices={}
        for option in option_rows:
            choices[(option['unit_id'],option['window_id'])]=model.NewBoolVar(f"x_{option['unit_id']}_{option['window_id']}")
        for t in tasks:
            eligible=[v for (uid,_),v in choices.items() if t['id'] in next(u for u in units if u['id']==uid)['task_ids']]
            if eligible:model.Add(sum(eligible)<=1)
        # A coordinated bundle is one possession unit; unrelated overlapping
        # possessions consume the persisted network-section capacity.
        network={item.get('section_id'): int(item.get('capacity', 1)) for item in payload.get('network', [])}
        for key,var in choices.items():
            u=next(x for x in units if x['id']==key[0]); w=next(x for x in windows if x['id']==key[1])
            occupants=[v for k,v in choices.items() if next(x for x in units if x['id']==k[0])['section_id']==u['section_id'] and overlaps(w,next(x for x in windows if x['id']==k[1]))]
            if len(occupants)>1:model.Add(sum(occupants)<=network.get(u['section_id'], 1))
        for dept,capacity in payload.get('resource_capacities',{}).items():
            for key,var in choices.items():
                u=next(x for x in units if x['id']==key[0]); w=next(x for x in windows if x['id']==key[1])
                if dept not in u['resources']:continue
                same=[v for k,v in choices.items() if dept in next(x for x in units if x['id']==k[0])['resources'] and overlaps(w,next(x for x in windows if x['id']==k[1]))]
                if len(same)>1:model.Add(sum(same)<=int(capacity))
        if previous:
            diff=[v if previous[-1].get(k,0)==0 else 1-v for k,v in choices.items()]
            if diff:model.Add(sum(diff)>=1)
        obj=[]
        for (uid,wid),v in choices.items():
            u=next(x for x in units if x['id']==uid); w=next(x for x in windows if x['id']==wid); members=[by_id[i] for i in u['task_ids']]
            priority=sum(float(t.get('priority_score',0)) for t in members); downtime=sum(float(t.get('availability_impact',0))*t['duration_min'] for t in members)
            obj.append(int(round(weights['priority']*priority+weights['downtime']*downtime+u['time_saved']*50-weights['freight']*freight(u['section_id'],w,payload.get('goods_forecasts',[]))-u['duration_min']))*v)
        model.Maximize(sum(obj)); solver=cp_model.CpSolver(); solver.parameters.max_time_in_seconds=time_limit_seconds; status=solver.Solve(model)
        profile_evidence={'profile':p+1, 'weights':weights, 'status':solver.StatusName(status), 'decision_variables':len(choices), 'constraints':len(model.Proto().constraints), 'solve_time_seconds':solver.WallTime()}
        run_profiles.append(profile_evidence)
        if status not in (cp_model.OPTIMAL,cp_model.FEASIBLE):continue
        solution={k:int(solver.Value(v)) for k,v in choices.items()}; previous.append(solution); blocks=[]; assignments=[]
        for (uid,wid),chosen in solution.items():
            if not chosen:continue
            u=next(x for x in units if x['id']==uid); w=next(x for x in windows if x['id']==wid); block={'window_id':wid,'bundle_id':u.get('bundle_id'),'task_ids':u['task_ids'],'section_id':u['section_id'],'departments':u['departments'],'start_min':w['start_min'],'end_min':w['start_min']+u['duration_min'],'duration_min':u['duration_min']}; blocks.append(block); assignments += [{'task_id':tid,**block,'resources':u['resources']} for tid in u['task_ids']]
        # An empty CP-SAT solution is operationally infeasible for a planning run;
        # never present it as a candidate plan.
        if not blocks: continue
        results.append({'id':f'plan_{len(results)+1}','status':'FEASIBLE','assignments':assignments,'blocks':blocks,'solver_status':solver.StatusName(status),'objective':solver.ObjectiveValue(),'profile':p+1, 'solver_evidence':{**profile_evidence, 'objective_description':'maximize priority weight × task priority + downtime weight × availability impact × duration + 50 × bundle time saved − freight weight × overlapping freight demand − duration'}})
    evidence={'engine':'Google OR-Tools CP-SAT', 'decision':'One Boolean x(unit, COA window) is created only for an eligible task or bundle possession choice.', 'inputs':{'tasks':len(tasks), 'units':len(units), 'coa_windows':len(payload['windows']), 'usable_coa_windows':len(windows), 'feasible_options':len(option_rows), 'rejected_before_solver':sum(excluded.values()), 'exclusions':excluded}, 'hard_constraints':['One selected assignment at most per maintenance task', 'Section network capacity for overlapping possessions', 'Department resource capacity for overlapping possessions'], 'pre_filters':['Blocked COA windows are not variables', 'Section/duration, planning-window and allowed-department checks are not variables', f"Train-conflicting choices are not variables ({payload.get('safety_margin_min',10)} minute safety margin)"], 'objective':'maximize priority weight × task priority + downtime weight × availability impact × duration + 50 × bundle time saved − freight weight × overlapping freight demand − duration', 'profiles':run_profiles, 'eligible_options':option_rows[:100]}
    return (results, evidence) if diagnostics else results

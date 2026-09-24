from ortools.sat.python import cp_model

def overlaps(a, b): return max(a['start_min'], b['start_min']) < min(a['end_min'], b['end_min'])
def freight(section, window, forecasts): return sum(round(float(f.get('capacity_demand',0))*100) for f in forecasts if f.get('section_id') == section and overlaps(window,f))

def generate_plans(payload: dict, plan_count: int = 3, time_limit_seconds: int = 30) -> list[dict]:
    """Schedules task/bundle units only inside persisted non-BLOCKED COA possessions."""
    tasks=payload['tasks']; windows=[w for w in payload['windows'] if w.get('availability_status','AVAILABLE')!='BLOCKED']; by_id={t['id']:t for t in tasks}
    units=[{'id':f"task:{t['id']}",'task_ids':[t['id']],'section_id':t.get('section_id'),'duration_min':t['duration_min'],'departments':[t.get('department')],'resources':t.get('resources',[t.get('department')]),'time_saved':0} for t in tasks]
    for b in payload.get('bundles',[]):
        members=[by_id[i] for i in b['task_ids'] if i in by_id]
        if len(members)>1: units.append({'id':b['bundle_id'],'bundle_id':b['bundle_id'],'task_ids':b['task_ids'],'section_id':b['section_id'],'duration_min':b['after_block_minutes'],'departments':b['departments'],'resources':sorted({r for t in members for r in t.get('resources',[t.get('department')])}),'time_saved':b.get('block_time_saved_minutes',0)})
    profiles=[{'priority':100,'freight':20,'downtime':10},{'priority':75,'freight':65,'downtime':25},{'priority':125,'freight':10,'downtime':45}]; results=[]; previous=[]
    for p in range(plan_count):
        weights={**profiles[p%3],**payload.get('tradeoff_weights',{})}; model=cp_model.CpModel(); choices={}
        for u in units:
            for w in windows:
                members=[by_id[i] for i in u['task_ids']]; valid=w.get('section_id')==u['section_id'] and w['end_min']-w['start_min']>=u['duration_min'] and all(w['start_min']>=t.get('earliest_start',0) and w['end_min']<=t.get('latest_end',1440) and t.get('department') in w.get('allowed_departments',['ENGINEERING','SNT','TRD']) for t in members)
                train=any(u['section_id'] in tr.get('route',[]) and max(w['start_min']-int(payload.get('safety_margin_min',10)),tr.get('departure',0))<min(w['end_min']+int(payload.get('safety_margin_min',10)),tr.get('arrival',0)) for tr in payload.get('trains',[]))
                if valid and not train: choices[(u['id'],w['id'])]=model.NewBoolVar(f"x_{u['id']}_{w['id']}")
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
        if status not in (cp_model.OPTIMAL,cp_model.FEASIBLE):continue
        solution={k:int(solver.Value(v)) for k,v in choices.items()}; previous.append(solution); blocks=[]; assignments=[]
        for (uid,wid),chosen in solution.items():
            if not chosen:continue
            u=next(x for x in units if x['id']==uid); w=next(x for x in windows if x['id']==wid); block={'window_id':wid,'bundle_id':u.get('bundle_id'),'task_ids':u['task_ids'],'section_id':u['section_id'],'departments':u['departments'],'start_min':w['start_min'],'end_min':w['start_min']+u['duration_min'],'duration_min':u['duration_min']}; blocks.append(block); assignments += [{'task_id':tid,**block,'resources':u['resources']} for tid in u['task_ids']]
        # An empty CP-SAT solution is operationally infeasible for a planning run;
        # never present it as a candidate plan.
        if not blocks: continue
        results.append({'id':f'plan_{len(results)+1}','status':'FEASIBLE','assignments':assignments,'blocks':blocks,'solver_status':solver.StatusName(status),'objective':solver.ObjectiveValue(),'profile':p+1})
    return results

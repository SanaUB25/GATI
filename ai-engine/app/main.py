from fastapi import FastAPI
from pydantic import BaseModel, Field
from services.optimizer import generate_plans
from services.risk_analysis import summarize_outcomes
from services.gati import calculate_gati
from services.plan_comparison import compare_plans
from services.plan_repair import repair_plan
from services.calibration import calibrate
from services.report_generator import generate_report
from services.explainability_service import explain
from services.gemini_service import GeminiService
from services.scenario_simulator import simulate_delays, simulate_imported_scenarios
from services.priority_engine import calculate_priority, priority_factors
from services.block_bundler import bundle_tasks
from services.conflict_shield import detect_conflicts
from app.errors import register_exception_handlers

app = FastAPI(title='RAILVISTA AI Engine', version='1.0.0')
register_exception_handlers(app)

class Task(BaseModel):
    id: str
    duration_min: int = Field(gt=0)
    priority_score: float = Field(ge=0, le=100)
    resource: str = 'track'

class Window(BaseModel):
    id: str
    start_min: int = Field(ge=0)
    end_min: int = Field(gt=0)
    section_id: str = 'default'
    availability_status: str = 'AVAILABLE'
    allowed_departments: list[str] = ['ENGINEERING', 'SNT', 'TRD']

class PlanningRequest(BaseModel):
    tasks: list[Task]
    windows: list[Window]
    plan_count: int = Field(default=3, ge=1, le=10)
    time_limit_seconds: int = Field(default=30, ge=1, le=300)

class SimulationRequest(BaseModel):
    base_delay: float = Field(gt=0)
    count: int = Field(default=1000, ge=1, le=10000)
    seed: int = Field(default=42, ge=0)
    scenario_delays: list[dict] = Field(default_factory=list)

class PriorityRequest(BaseModel):
    criticality: float = Field(ge=0)
    severity: float = Field(ge=0)
    overdue_days: float = Field(default=0, ge=0)
    weather_risk: float = Field(default=0, ge=0)
    asset_importance: float = Field(default=1, ge=0)
    season: str = 'Other'
    section_importance: float = Field(default=1, ge=0)

class WorkflowTask(Task):
    criticality: float = Field(default=1, ge=0)
    severity: float = Field(default=1, ge=0)
    overdue_days: float = Field(default=0, ge=0)
    weather_risk: float = Field(default=0, ge=0)
    asset_importance: float = Field(default=1, ge=0)
    season: str = 'Other'
    section_importance: float = Field(default=1, ge=0)
    section_id: str = 'default'
    department: str = 'UNASSIGNED'
    earliest_start: int = Field(default=0, ge=0)
    latest_end: int = Field(default=1440, ge=1)
    corridor_id: str = 'default'
    resources: list[str] = []
    urgency: float = Field(default=1, ge=0)
    availability_impact: float = Field(default=1, ge=0)

class WorkflowRequest(BaseModel):
    tasks: list[WorkflowTask] = Field(min_length=1)
    windows: list[Window] = Field(min_length=1)
    scenario_count: int = Field(default=1000, ge=1, le=10000)
    seed: int = Field(default=42, ge=0)
    time_limit_seconds: int = Field(default=30, ge=1, le=300)
    scenario_delays: list[dict] = Field(default_factory=list)
    trains: list[dict] = Field(default_factory=list)
    goods_forecasts: list[dict] = Field(default_factory=list)
    resource_capacities: dict[str, int] = Field(default_factory=dict)
    tradeoff_weights: dict[str, int] = Field(default_factory=dict)
    safety_margin_min: int = Field(default=10, ge=0)

@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'railvista-ai-engine'}

@app.post('/v1/plans/generate')
def plans(request: PlanningRequest):
    return {'plans': generate_plans(request.model_dump(), request.plan_count, request.time_limit_seconds)}

@app.post('/v1/risk/analyze')
def risk(outcomes: list[float]):
    metrics = summarize_outcomes(outcomes)
    return {'metrics': metrics, 'gati': calculate_gati(metrics['mean_delay'], metrics['cvar10_delay'])}

@app.post('/v1/simulations')
def simulations(request: SimulationRequest):
    outcomes = simulate_imported_scenarios(request.base_delay, request.scenario_delays[:request.count]) if request.scenario_delays else simulate_delays(request.base_delay, request.count, request.seed)
    return {'outcomes': outcomes, 'metrics': summarize_outcomes(outcomes, request.scenario_delays), 'count': len(outcomes), 'seed': request.seed, 'source': 'mongodb-scenarios' if request.scenario_delays else 'generated'}

@app.post('/v1/priority')
def priority(request: PriorityRequest):
    return {'priority': priority_factors(**request.model_dump())}

@app.post('/v1/bundler')
def bundler(payload: dict):
    tasks = payload.get('tasks', [])
    if not tasks:
        raise ValueError('tasks is required')
    return {'bundles': bundle_tasks(tasks)}

@app.post('/v1/conflict')
def conflict(payload: dict):
    return {'conflicts': detect_conflicts(payload.get('assignments', []), payload.get('trains', []), payload.get('safety_margin_min', 10))}

@app.post('/v1/optimize')
def optimize(request: PlanningRequest):
    return {'plans': generate_plans(request.model_dump(), request.plan_count, request.time_limit_seconds)}

@app.post('/v1/simulate')
def simulate(request: SimulationRequest):
    return simulations(request)

@app.post('/v1/risk')
def analyze_risk(outcomes: list[float]):
    return risk(outcomes)

@app.post('/v1/gati')
def gati(payload: dict):
    return {'gati': calculate_gati(float(payload['mean_delay']), float(payload['cvar10_delay']))}

@app.post('/v1/explain')
def explain_alias(payload: dict):
    return explanation(payload)

@app.post('/v1/workflow/run')
def workflow_run(request: WorkflowRequest):
    raw_tasks = [task.model_dump() for task in request.tasks]
    scored_tasks = []
    for task in raw_tasks:
        scoring = priority_factors(task['criticality'], task['severity'], task['overdue_days'], task['weather_risk'], task['asset_importance'], task['season'], task['section_importance'], task['urgency'], task['availability_impact'])
        scored_tasks.append({**task, 'priority_score': scoring['score'], 'priority_factors': scoring})
    bundles = bundle_tasks(scored_tasks)
    candidates, optimization = generate_plans({'tasks': scored_tasks, 'windows': [window.model_dump() for window in request.windows], 'trains': request.trains, 'bundles': bundles, 'goods_forecasts': request.goods_forecasts, 'resource_capacities': request.resource_capacities, 'tradeoff_weights': request.tradeoff_weights, 'safety_margin_min': request.safety_margin_min}, 3, request.time_limit_seconds, diagnostics=True)
    plans = []
    for index, candidate in enumerate(candidates):
        assignments = candidate['assignments']
        assigned = [task for task in scored_tasks if any(item['task_id'] == task['id'] for item in assignments)]
        base_delay = max(sum(task['duration_min'] for task in assigned), 1)
        outcomes = simulate_imported_scenarios(base_delay, request.scenario_delays[:request.scenario_count]) if request.scenario_delays else simulate_delays(base_delay, request.scenario_count, request.seed + index)
        metrics = summarize_outcomes(outcomes, request.scenario_delays[:request.scenario_count])
        metrics['gati'] = calculate_gati(metrics['mean_delay'], metrics['cvar10_delay'])
        metrics['coverage'] = len({item['task_id'] for item in assignments}) / len(scored_tasks)
        metrics['asset_downtime_minutes'] = sum(task['duration_min'] * task.get('availability_impact', 1) for task in assigned)
        metrics['freight_penalty'] = sum(item.get('duration_min', 0) for item in assignments)
        plans.append({**candidate, 'metrics': metrics, 'outcomes': outcomes})
    all_assignments = [assignment for plan in plans for assignment in plan['assignments']]
    return {'tasks': scored_tasks, 'bundles': bundles, 'conflicts': detect_conflicts(all_assignments, request.trains, request.safety_margin_min), 'plans': plans, 'optimization': optimization}

@app.post('/v1/plans/compare')
def compare(payload: dict):
    return compare_plans(payload.get('plans', []))

@app.post('/v1/plans/repair')
def repair(payload: dict):
    return repair_plan(payload['plan'], payload['disruption'])

@app.post('/v1/calibration')
def calibration(payload: dict):
    return calibrate(payload['predicted'], payload['actual'])

@app.post('/v1/reports')
def report(payload: dict):
    return generate_report(payload.get('type', 'daily'), payload.get('evidence', {}))

@app.post('/v1/explanations')
def explanation(payload: dict):
    return GeminiService().explain_plan(payload.get('evidence', {}), payload.get('question'))

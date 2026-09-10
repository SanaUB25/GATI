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
from services.scenario_simulator import simulate_delays
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

class PlanningRequest(BaseModel):
    tasks: list[Task]
    windows: list[Window]
    plan_count: int = Field(default=3, ge=1, le=10)
    time_limit_seconds: int = Field(default=30, ge=1, le=300)

class SimulationRequest(BaseModel):
    base_delay: float = Field(gt=0)
    count: int = Field(default=1000, ge=1, le=10000)
    seed: int = Field(default=42, ge=0)

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
    return {'outcomes': simulate_delays(request.base_delay, request.count, request.seed), 'count': request.count, 'seed': request.seed}

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
    return explain(payload.get('evidence', {}), payload.get('question'))

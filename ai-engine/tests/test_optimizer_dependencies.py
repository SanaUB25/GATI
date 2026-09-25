from services.optimizer import generate_plans
from services.conflict_shield import detect_conflicts


def base_payload():
    return {'tasks': [{'id': 'a', 'section_id': 'S1', 'department': 'ENGINEERING', 'resources': ['ENGINEERING'], 'duration_min': 30, 'priority_score': 90, 'availability_impact': 5, 'earliest_start': 0, 'latest_end': 1440}, {'id': 'b', 'section_id': 'S1', 'department': 'SNT', 'resources': ['SNT'], 'duration_min': 20, 'priority_score': 60, 'availability_impact': 2, 'earliest_start': 0, 'latest_end': 1440}], 'windows': [{'id': 'coa', 'section_id': 'S1', 'start_min': 100, 'end_min': 160, 'availability_status': 'AVAILABLE', 'allowed_departments': ['ENGINEERING', 'SNT']}], 'resource_capacities': {'ENGINEERING': 1, 'SNT': 1}, 'trains': [], 'goods_forecasts': []}


def test_blocked_coa_and_train_make_work_infeasible():
    payload = base_payload(); payload['windows'][0]['availability_status'] = 'BLOCKED'
    assert generate_plans(payload) == []
    payload = base_payload(); payload['trains'] = [{'route': ['S1'], 'departure': 100, 'arrival': 160}]
    assert generate_plans(payload) == []


def test_bundle_is_a_real_shorter_solver_unit():
    payload = base_payload(); payload['bundles'] = [{'bundle_id': 'B1', 'task_ids': ['a', 'b'], 'section_id': 'S1', 'departments': ['ENGINEERING', 'SNT'], 'after_block_minutes': 30, 'block_time_saved_minutes': 20}]
    plans = generate_plans(payload, 1)
    assert plans and any(block['bundle_id'] == 'B1' for block in plans[0]['blocks'])


def test_freight_weight_changes_objective():
    payload = base_payload(); payload['goods_forecasts'] = [{'section_id': 'S1', 'start_min': 100, 'end_min': 160, 'capacity_demand': 1}]
    low = generate_plans({**payload, 'tradeoff_weights': {'freight': 1}}, 1)[0]['objective']
    high = generate_plans({**payload, 'tradeoff_weights': {'freight': 100}}, 1)[0]['objective']
    assert high < low


def test_forecast_capacity_demand_changes_objective():
    payload = base_payload()
    low = generate_plans({**payload, 'goods_forecasts': [{'section_id': 'S1', 'start_min': 100, 'end_min': 160, 'capacity_demand': .2}]}, 1)[0]['objective']
    high = generate_plans({**payload, 'goods_forecasts': [{'section_id': 'S1', 'start_min': 100, 'end_min': 160, 'capacity_demand': .9}]}, 1)[0]['objective']
    assert high < low


def test_conflict_shield_reports_protected_train_overlap():
    conflicts = detect_conflicts(
        [{'task_id': 'a', 'window_id': 'COA-001', 'section_id': 'S02', 'start_min': 690, 'end_min': 730, 'resources': ['ENGINEERING']}],
        [{'id': 'T005', 'route': ['S02'], 'departure': 570, 'arrival': 735}],
        safety_margin_min=10,
    )
    assert conflicts == [{'classification': 'UNSAFE', 'type': 'TRAIN_TIMETABLE', 'task_ids': ['a'], 'section_id': 'S02', 'train_id': 'T005', 'reason': '10 minute safety margin infringed'}]

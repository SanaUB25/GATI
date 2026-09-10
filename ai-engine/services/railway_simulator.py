def calculate_consequence(plan: dict, scenario: dict) -> dict:
    delay = float(scenario.get('maintenance_overrun_min', 0)) + float(scenario.get('traffic_delay_min', 0))
    return {'total_delay_min': delay, 'maximum_delay_min': delay, 'cascade_count': int(delay > 60), 'cancelled_trains': int(delay > 180), 'emergency_count': int(scenario.get('unexpected_failure', False))}

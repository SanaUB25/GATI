from services.gati import calculate_gati
from services.priority_engine import calculate_priority
from services.risk_analysis import summarize_outcomes


def test_gati_uses_mean_and_tail_risk():
    assert calculate_gati(10, 20) == 14


def test_priority_is_bounded():
    assert 0 <= calculate_priority(5, 5, 30, 5, 5) <= 100


def test_risk_metrics_include_tail():
    metrics = summarize_outcomes([1, 2, 3, 100])
    assert metrics['p95_delay'] >= metrics['mean_delay']
    assert metrics['cvar10_delay'] >= metrics['p95_delay']

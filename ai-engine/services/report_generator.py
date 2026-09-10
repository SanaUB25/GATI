from datetime import datetime, timezone


def generate_report(report_type: str, evidence: dict) -> dict:
    return {'report_type': report_type, 'generated_at': datetime.now(timezone.utc).isoformat(), 'title': f'RAILVISTA {report_type.title()} Report', 'evidence': evidence, 'generated_by': 'railvista-ai-engine'}

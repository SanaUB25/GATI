import os
import httpx


class GeminiService:
    """Gemini is limited to explaining persisted evidence, never decision maths."""
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.model = model or os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')

    def explain_plan(self, evidence: dict, question: str | None = None) -> dict:
        prompt = {'instruction': 'Explain only the supplied, already-calculated plan evidence in concise plain language. Treat supplied values as facts; do not calculate, optimize, simulate, rank candidates, invent missing values, infer unsupported causes, recommend changes beyond the evidence, claim safety certification, or alter deterministic results. Clearly distinguish evidence from explanatory wording.', 'evidence': evidence, 'question': question}
        if not self.api_key:
            return {'text': self._fallback(evidence), 'provider': 'local-evidence-summary', 'prompt': prompt}
        response = httpx.post(f'https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}', json={'contents': [{'parts': [{'text': str(prompt)}]}]}, timeout=20)
        response.raise_for_status()
        text = response.json()['candidates'][0]['content']['parts'][0]['text']
        return {'text': text, 'provider': 'gemini', 'prompt': prompt}

    @staticmethod
    def _fallback(evidence: dict) -> str:
        return f"The selected plan has GATI {evidence.get('gati', 'not available')}. This explanation is based on persisted plan metrics."

import { env } from '../config/env.js';

/** Calls to the Python service have one bounded, consistent failure mode. */
export async function aiRequest(path, body, { timeoutMs = 45_000 } = {}) {
  let response;
  try {
    response = await fetch(`${env.aiEngineBaseUrl}${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (cause) {
    const error = new Error(cause.name === 'TimeoutError' ? 'AI engine request timed out' : 'AI engine is unavailable; start FastAPI on port 8000');
    error.statusCode = 502; throw error;
  }
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`AI engine rejected the request: ${detail.slice(0, 300)}`);
    error.statusCode = 502; throw error;
  }
  return response.json();
}

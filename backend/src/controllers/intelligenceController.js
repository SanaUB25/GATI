import { env } from '../config/env.js';

async function aiRequest(path, body) {
  const response = await fetch(`${env.aiEngineBaseUrl}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) { const error = new Error('AI engine could not complete this request'); error.statusCode = 502; throw error; }
  return response.json();
}
export async function simulateController(req, res, next) { try { res.json({ data: await aiRequest('/v1/simulations', req.body), meta: { requestId: req.id } }); } catch (error) { next(error); } }
export async function analyzeRiskController(req, res, next) { try { res.json({ data: await aiRequest('/v1/risk/analyze', req.body.outcomes || []), meta: { requestId: req.id } }); } catch (error) { next(error); } }
export async function explanationController(req, res, next) { try { res.json({ data: await aiRequest('/v1/explanations', req.body), meta: { requestId: req.id } }); } catch (error) { next(error); } }

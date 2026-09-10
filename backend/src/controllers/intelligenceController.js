import { aiRequest } from '../services/aiEngineService.js';
import { listScenarioDelays } from '../services/operationalService.js';
export async function simulateController(req, res, next) { try { const count = req.body.count ?? 1000; const scenarioDelays = await listScenarioDelays(count); res.json({ data: await aiRequest('/v1/simulations', { ...req.body, scenario_delays: scenarioDelays }), meta: { requestId: req.id } }); } catch (error) { next(error); } }
export async function analyzeRiskController(req, res, next) { try { res.json({ data: await aiRequest('/v1/risk/analyze', req.body.outcomes || []), meta: { requestId: req.id } }); } catch (error) { next(error); } }
export async function explanationController(req, res, next) { try { res.json({ data: await aiRequest('/v1/explanations', req.body), meta: { requestId: req.id } }); } catch (error) { next(error); } }

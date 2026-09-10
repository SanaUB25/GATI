import { aiRequest } from '../services/aiEngineService.js';
export async function simulateController(req, res, next) { try { res.json({ data: await aiRequest('/v1/simulations', req.body), meta: { requestId: req.id } }); } catch (error) { next(error); } }
export async function analyzeRiskController(req, res, next) { try { res.json({ data: await aiRequest('/v1/risk/analyze', req.body.outcomes || []), meta: { requestId: req.id } }); } catch (error) { next(error); } }
export async function explanationController(req, res, next) { try { res.json({ data: await aiRequest('/v1/explanations', req.body), meta: { requestId: req.id } }); } catch (error) { next(error); } }

import { executeWorkflow } from '../services/workflowService.js';

export async function createPlanningRun(req, res, next) {
  try {
    const data = await executeWorkflow(req.body, req.user.sub, req.id);
    res.status(201).json({ data, meta: { requestId: req.id } });
  } catch (error) { next(error); }
}

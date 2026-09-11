import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { createPlanningRun } from '../controllers/planningRunController.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

export const planningRunRoutes = Router();
planningRunRoutes.post('/', authenticate, [
  body('corridorId').optional().isString().trim().notEmpty(),
  body('tasks').optional().isArray({ min: 1 }),
  body('windows').isArray({ min: 1 }),
  body('windows.*.id').isString().notEmpty(),
  body('windows.*.start_min').isInt({ min: 0 }),
  body('windows.*.end_min').isInt({ min: 1 }).custom((end, { req, path }) => {
    const index = Number(path.match(/\[(\d+)\]/)?.[1]);
    return end > req.body.windows[index].start_min;
  }).withMessage('Window end_min must be after start_min'),
  body('scenarioCount').optional().isInt({ min: 1, max: 10000 }),
  body('timeLimitSeconds').optional().isInt({ min: 1, max: 300 })
], validateRequest, createPlanningRun);

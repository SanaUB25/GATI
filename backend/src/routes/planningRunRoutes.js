import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { createPlanningRun } from '../controllers/planningRunController.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

export const planningRunRoutes = Router();
planningRunRoutes.post('/', authenticate, [
  body('corridorId').optional().isString().trim().notEmpty(),
  body('tasks').optional().isArray({ min: 1 }),
  body('scenarioCount').optional().isInt({ min: 1, max: 10000 }),
  body('timeLimitSeconds').optional().isInt({ min: 1, max: 300 }),
  body('baselineRunId').optional().isMongoId(),
  body('tradeoffWeights').optional().isObject(),
  body('tradeoffWeights').optional().custom((weights) => Object.keys(weights).every((key) => ['priority', 'freight', 'downtime'].includes(key))).withMessage('Only priority, freight, and downtime are adjustable trade-off weights'),
  body('tradeoffWeights.priority').optional().isInt({ min: 0, max: 10000 }),
  body('tradeoffWeights.freight').optional().isInt({ min: 0, max: 10000 }),
  body('tradeoffWeights.downtime').optional().isInt({ min: 0, max: 10000 })
], validateRequest, createPlanningRun);

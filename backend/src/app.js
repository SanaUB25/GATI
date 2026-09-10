import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'node:crypto';
import { env } from './config/env.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { planningRunRoutes } from './routes/planningRunRoutes.js';
import { operationalRoutes } from './routes/operationalRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use((req, res, next) => { req.id = crypto.randomUUID(); res.setHeader('X-Request-Id', req.id); next(); });
  app.use(morgan('combined'));
  app.use((req, res, next) => {
    if (!env.corsOrigins.includes(req.headers.origin) && req.headers.origin) return res.sendStatus(403);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? env.corsOrigins[0]);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/planning-runs', planningRunRoutes);
  app.use('/api', operationalRoutes);
  app.use(errorHandler);
  return app;
}

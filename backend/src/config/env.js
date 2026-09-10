import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const required = ['JWT_ACCESS_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/railvista',
  jwtSecret: process.env.JWT_ACCESS_SECRET,
  jwtTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  aiEngineBaseUrl: process.env.AI_ENGINE_BASE_URL ?? 'http://localhost:8000',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
  dataDir: path.resolve(process.env.DATA_DIR ?? path.join(projectRoot, 'data', 'raw'))
};

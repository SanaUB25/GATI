import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Authentication is required' });
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    res.status(401).json({ type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Token is invalid or expired' });
  }
}

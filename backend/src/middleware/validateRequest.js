import { validationResult } from 'express-validator';

export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ type: 'about:blank', title: 'Validation Error', status: 400, detail: 'One or more fields are invalid', errors: errors.array() });
  next();
}

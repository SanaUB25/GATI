import { login } from '../services/authService.js';

export async function loginController(req, res, next) {
  try {
    const result = await login(req.body.email, req.body.password);
    res.json({ data: result, meta: { requestId: req.id } });
  } catch (error) { next(error); }
}

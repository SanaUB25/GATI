import { Router } from 'express';
export const healthRoutes = Router();
healthRoutes.get('/health', (req, res) => res.json({ data: { status: 'ok', service: 'railvista-backend' }, meta: { requestId: req.id } }));

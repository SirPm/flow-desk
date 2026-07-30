import { Router } from 'express';
import { checkHealth } from '../services/health.service';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const result = await checkHealth();
  res.status(result.status === 'ok' ? 200 : 503).json(result);
});

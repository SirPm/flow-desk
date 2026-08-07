import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { parseOrThrow } from '../lib/validate';
import {
  createPosition,
  listPositions,
  removePosition,
  updatePosition,
} from '../services/positionService';

export const positionsRouter = Router();

const upsertSchema = z.object({
  title: z.string().min(1, 'title is required'),
});

positionsRouter.use(authenticate);

positionsRouter.get('/', async (req, res) => {
  const positions = await listPositions(req.user!.organizationId);
  res.status(200).json({ positions });
});

positionsRouter.post('/', authorize(Role.ADMIN), async (req, res) => {
  const input = parseOrThrow(upsertSchema, req.body);
  const position = await createPosition({
    ...input,
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
  });
  res.status(201).json({ position });
});

positionsRouter.patch('/:id', authorize(Role.ADMIN), async (req, res) => {
  const input = parseOrThrow(upsertSchema, req.body);
  const position = await updatePosition({
    id: req.params.id as string,
    ...input,
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
  });
  res.status(200).json({ position });
});

positionsRouter.delete('/:id', authorize(Role.ADMIN), async (req, res) => {
  await removePosition({
    id: req.params.id as string,
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
  });
  res.status(204).send();
});

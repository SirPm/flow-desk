import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { parseOrThrow } from '../lib/validate';
import {
  createDepartment,
  listDepartments,
  removeDepartment,
  updateDepartment,
} from '../services/departmentService';

export const departmentsRouter = Router();

const upsertSchema = z.object({
  name: z.string().min(1, 'name is required'),
});

departmentsRouter.use(authenticate);

departmentsRouter.get('/', async (req, res) => {
  const departments = await listDepartments(req.user!.organizationId);
  res.status(200).json({ departments });
});

departmentsRouter.post('/', authorize(Role.ADMIN), async (req, res) => {
  const input = parseOrThrow(upsertSchema, req.body);
  const department = await createDepartment({
    ...input,
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
  });
  res.status(201).json({ department });
});

departmentsRouter.patch('/:id', authorize(Role.ADMIN), async (req, res) => {
  const input = parseOrThrow(upsertSchema, req.body);
  const department = await updateDepartment({
    id: req.params.id as string,
    ...input,
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
  });
  res.status(200).json({ department });
});

departmentsRouter.delete('/:id', authorize(Role.ADMIN), async (req, res) => {
  await removeDepartment({
    id: req.params.id as string,
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
  });
  res.status(204).send();
});

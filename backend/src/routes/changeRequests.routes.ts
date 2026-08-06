import { Router } from 'express';
import { z } from 'zod';
import { ChangeRequestStatus, Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { parseOrThrow } from '../lib/validate';
import {
  createChangeRequest,
  getChangeRequestById,
  listChangeRequests,
  reviewChangeRequest,
} from '../services/changeRequestService';

export const changeRequestsRouter = Router();

const createSchema = z.object({
  employeeId: z.string().min(1, 'employeeId is required'),
  fieldChanged: z.string().min(1, 'fieldChanged is required'),
  oldValue: z.string(),
  newValue: z.string(),
  effectiveDate: z.coerce.date(),
});

const reviewSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
});

function isChangeRequestStatus(value: string): value is ChangeRequestStatus {
  return (Object.values(ChangeRequestStatus) as string[]).includes(value);
}

changeRequestsRouter.use(authenticate);

changeRequestsRouter.post('/', authorize(Role.ADMIN, Role.MANAGER), async (req, res) => {
  const input = parseOrThrow(createSchema, req.body);
  const request = await createChangeRequest({
    ...input,
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
  });
  res.status(201).json({ changeRequest: request });
});

changeRequestsRouter.get('/', async (req, res) => {
  const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
  const status = statusParam && isChangeRequestStatus(statusParam) ? statusParam : undefined;

  const employeeId =
    req.user!.role === Role.EMPLOYEE
      ? req.user!.sub
      : typeof req.query.employeeId === 'string'
        ? req.query.employeeId
        : undefined;

  const requests = await listChangeRequests({
    organizationId: req.user!.organizationId,
    employeeId,
    status,
  });
  res.status(200).json({ changeRequests: requests });
});

changeRequestsRouter.get('/:id', async (req, res) => {
  const request = await getChangeRequestById(req.params.id as string, req.user!.organizationId);
  res.status(200).json({ changeRequest: request });
});

changeRequestsRouter.post('/:id/review', authorize(Role.ADMIN), async (req, res) => {
  const input = parseOrThrow(reviewSchema, req.body);
  const request = await reviewChangeRequest({
    id: req.params.id as string,
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
    decision: input.decision,
  });
  res.status(200).json({ changeRequest: request });
});

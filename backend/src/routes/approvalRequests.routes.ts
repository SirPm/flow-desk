import { Router } from 'express';
import { z } from 'zod';
import { ApprovalActionType } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { parseOrThrow } from '../lib/validate';
import {
  actOnApprovalRequest,
  createApprovalRequest,
  getApprovalRequestById,
  listApprovalRequests,
} from '../services/approvalRequestService';

export const approvalRequestsRouter = Router();

const createSchema = z.object({
  workflowTemplateId: z.string().min(1, 'workflowTemplateId is required'),
});

const actSchema = z.object({
  action: z.nativeEnum(ApprovalActionType),
  note: z.string().min(1).optional(),
});

approvalRequestsRouter.use(authenticate);

approvalRequestsRouter.post('/', async (req, res) => {
  const input = parseOrThrow(createSchema, req.body);
  const request = await createApprovalRequest({
    ...input,
    requestedBy: req.user!.sub,
    organizationId: req.user!.organizationId,
  });
  res.status(201).json({ approvalRequest: request });
});

approvalRequestsRouter.get('/', async (req, res) => {
  const onlyMyQueue = req.query.mine === 'true';
  const requests = await listApprovalRequests({
    organizationId: req.user!.organizationId,
    actorRole: req.user!.role,
    onlyMyQueue,
  });
  res.status(200).json({ approvalRequests: requests });
});

approvalRequestsRouter.get('/:id', async (req, res) => {
  const request = await getApprovalRequestById(req.params.id as string, req.user!.organizationId);
  res.status(200).json({ approvalRequest: request });
});

approvalRequestsRouter.post('/:id/actions', async (req, res) => {
  const input = parseOrThrow(actSchema, req.body);
  const request = await actOnApprovalRequest({
    id: req.params.id as string,
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
    actorRole: req.user!.role,
    decision: input.action,
    note: input.note,
  });
  res.status(200).json({ approvalRequest: request });
});

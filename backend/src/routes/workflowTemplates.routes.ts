import { Router } from 'express';
import { z } from 'zod';
import { ChangeRequestField, Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { parseOrThrow } from '../lib/validate';
import {
  createWorkflowTemplate,
  getWorkflowTemplateById,
  listWorkflowTemplates,
} from '../services/workflowService';

export const workflowTemplatesRouter = Router();

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  steps: z.array(z.nativeEnum(Role)).min(1, 'At least one approval step is required'),
  isChangeRequestTemplate: z.boolean().default(false),
  changeRequestFields: z.array(z.nativeEnum(ChangeRequestField)).default([]),
});

workflowTemplatesRouter.use(authenticate);

workflowTemplatesRouter.post('/', authorize(Role.ADMIN), async (req, res) => {
  const input = parseOrThrow(createSchema, req.body);
  const template = await createWorkflowTemplate({
    ...input,
    createdBy: req.user!.sub,
    organizationId: req.user!.organizationId,
  });
  res.status(201).json({ workflowTemplate: template });
});

workflowTemplatesRouter.get('/', async (req, res) => {
  const templates = await listWorkflowTemplates(req.user!.organizationId);
  res.status(200).json({ workflowTemplates: templates });
});

workflowTemplatesRouter.get('/:id', async (req, res) => {
  const template = await getWorkflowTemplateById(req.params.id as string, req.user!.organizationId);
  res.status(200).json({ workflowTemplate: template });
});

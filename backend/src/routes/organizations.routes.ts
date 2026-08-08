import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { parseOrThrow } from '../lib/validate';
import {
  getOrganization,
  setChangeRequestTemplate,
  setFeatureFlag,
} from '../services/organizationService';

export const organizationsRouter = Router();

const setFeatureFlagSchema = z.object({
  key: z.string().min(1, 'key is required'),
  enabled: z.boolean(),
});

const setChangeRequestTemplateSchema = z.object({
  workflowTemplateId: z.string().min(1, 'workflowTemplateId is required').nullable(),
});

organizationsRouter.use(authenticate);

organizationsRouter.get('/me', async (req, res) => {
  const organization = await getOrganization(req.user!.organizationId);
  res.status(200).json({ organization });
});

organizationsRouter.patch('/feature-flags', authorize(Role.ADMIN), async (req, res) => {
  const input = parseOrThrow(setFeatureFlagSchema, req.body);
  const organization = await setFeatureFlag({
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
    ...input,
  });
  res.status(200).json({ organization });
});

organizationsRouter.patch('/change-request-template', authorize(Role.ADMIN), async (req, res) => {
  const input = parseOrThrow(setChangeRequestTemplateSchema, req.body);
  const organization = await setChangeRequestTemplate({
    organizationId: req.user!.organizationId,
    actorId: req.user!.sub,
    ...input,
  });
  res.status(200).json({ organization });
});

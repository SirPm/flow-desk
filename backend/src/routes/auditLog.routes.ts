import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { listAuditLogs } from '../services/auditLogService';

export const auditLogRouter = Router();

auditLogRouter.use(authenticate);

auditLogRouter.get('/', authorize(Role.ADMIN), async (req, res) => {
  const { actorId, action, entityType, from, to } = req.query;
  const logs = await listAuditLogs({
    organizationId: req.user!.organizationId,
    actorId: typeof actorId === 'string' ? actorId : undefined,
    action: typeof action === 'string' ? action : undefined,
    entityType: typeof entityType === 'string' ? entityType : undefined,
    from: typeof from === 'string' ? new Date(from) : undefined,
    to: typeof to === 'string' ? new Date(to) : undefined,
  });
  res.status(200).json({ auditLogs: logs });
});

import { type AuditLog } from '@prisma/client';
import { prisma } from '../lib/prisma';

type AuditLogWithActor = AuditLog & { actor: { id: string; name: string; email: string } };

export interface ListAuditLogsOptions {
  organizationId: string;
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: Date;
  to?: Date;
}

export function listAuditLogs(options: ListAuditLogsOptions): Promise<AuditLogWithActor[]> {
  const hasDateFilter = Boolean(options.from || options.to);

  return prisma.auditLog.findMany({
    where: {
      actor: { organizationId: options.organizationId },
      ...(options.actorId ? { actorId: options.actorId } : {}),
      ...(options.action ? { action: options.action } : {}),
      ...(options.entityType ? { entityType: options.entityType } : {}),
      ...(hasDateFilter
        ? {
            timestamp: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            },
          }
        : {}),
    },
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { timestamp: 'desc' },
    take: 200,
  });
}

import { type Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface LogActionInput {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

type PrismaLike = Pick<typeof prisma, 'auditLog'>;

export function logAction(input: LogActionInput, client: PrismaLike = prisma) {
  return client.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

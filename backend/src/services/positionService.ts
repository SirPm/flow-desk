import { ChangeRequestField, ChangeRequestStatus, type Position } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logAction } from './auditLogger';

export function listPositions(organizationId: string): Promise<Position[]> {
  return prisma.position.findMany({
    where: { organizationId },
    orderBy: { title: 'asc' },
  });
}

export interface CreatePositionInput {
  title: string;
  organizationId: string;
  actorId: string;
}

export async function createPosition(input: CreatePositionInput): Promise<Position> {
  const existing = await prisma.position.findFirst({
    where: { organizationId: input.organizationId, title: input.title },
  });
  if (existing) {
    throw new ValidationError('A position with this title already exists');
  }

  return prisma.$transaction(async (tx) => {
    const position = await tx.position.create({
      data: { title: input.title, organizationId: input.organizationId },
    });

    await logAction(
      {
        actorId: input.actorId,
        action: 'POSITION_CREATED',
        entityType: 'Position',
        entityId: position.id,
        metadata: { title: position.title },
      },
      tx,
    );

    return position;
  });
}

export interface UpdatePositionInput {
  id: string;
  title: string;
  organizationId: string;
  actorId: string;
}

export async function updatePosition(input: UpdatePositionInput): Promise<Position> {
  const position = await prisma.position.findUnique({ where: { id: input.id } });
  if (!position || position.organizationId !== input.organizationId) {
    throw new NotFoundError('Position not found');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.position.update({
      where: { id: input.id },
      data: { title: input.title },
    });

    await logAction(
      {
        actorId: input.actorId,
        action: 'POSITION_UPDATED',
        entityType: 'Position',
        entityId: updated.id,
        metadata: { title: updated.title },
      },
      tx,
    );

    return updated;
  });
}

export interface RemovePositionInput {
  id: string;
  organizationId: string;
  actorId: string;
}

export async function removePosition(input: RemovePositionInput): Promise<void> {
  const position = await prisma.position.findUnique({ where: { id: input.id } });
  if (!position || position.organizationId !== input.organizationId) {
    throw new NotFoundError('Position not found');
  }

  const [assignedUserCount, referencedChangeRequestCount] = await Promise.all([
    prisma.user.count({ where: { positionId: input.id } }),
    prisma.changeRequest.count({
      where: {
        fieldChanged: ChangeRequestField.POSITION,
        status: { in: [ChangeRequestStatus.PENDING, ChangeRequestStatus.SCHEDULED] },
        OR: [{ oldValue: input.id }, { newValue: input.id }],
      },
    }),
  ]);

  if (assignedUserCount > 0 || referencedChangeRequestCount > 0) {
    throw new ValidationError(
      'This position is still assigned to employees or referenced by an in-flight change request',
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.position.delete({ where: { id: input.id } });

    await logAction(
      {
        actorId: input.actorId,
        action: 'POSITION_DELETED',
        entityType: 'Position',
        entityId: input.id,
        metadata: { title: position.title },
      },
      tx,
    );
  });
}

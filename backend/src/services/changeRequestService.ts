import { ChangeRequestStatus, type ChangeRequest } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logAction } from './auditLogger';

export interface CreateChangeRequestInput {
  employeeId: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  effectiveDate: Date;
  organizationId: string;
  actorId: string;
}

export async function createChangeRequest(input: CreateChangeRequestInput): Promise<ChangeRequest> {
  const employee = await prisma.user.findUnique({ where: { id: input.employeeId } });
  if (!employee || employee.organizationId !== input.organizationId) {
    throw new NotFoundError('Employee not found');
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.changeRequest.create({
      data: {
        employeeId: input.employeeId,
        fieldChanged: input.fieldChanged,
        oldValue: input.oldValue,
        newValue: input.newValue,
        effectiveDate: input.effectiveDate,
      },
    });

    await logAction(
      {
        actorId: input.actorId,
        action: 'CHANGE_REQUEST_CREATED',
        entityType: 'ChangeRequest',
        entityId: request.id,
        metadata: { employeeId: request.employeeId, fieldChanged: request.fieldChanged },
      },
      tx,
    );

    return request;
  });
}

type ChangeRequestWithEmployee = ChangeRequest & {
  employee: { id: string; name: string; email: string };
};

export interface ListChangeRequestsOptions {
  organizationId: string;
  employeeId?: string;
  status?: ChangeRequestStatus;
}

export function listChangeRequests(
  options: ListChangeRequestsOptions,
): Promise<ChangeRequestWithEmployee[]> {
  return prisma.changeRequest.findMany({
    where: {
      employee: { organizationId: options.organizationId },
      ...(options.employeeId ? { employeeId: options.employeeId } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    include: { employee: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getChangeRequestById(
  id: string,
  organizationId: string,
): Promise<ChangeRequestWithEmployee> {
  const request = await prisma.changeRequest.findUnique({
    where: { id },
    include: { employee: { select: { id: true, name: true, email: true, organizationId: true } } },
  });

  if (!request || request.employee.organizationId !== organizationId) {
    throw new NotFoundError('Change request not found');
  }

  return request;
}

export type ChangeRequestDecision = 'APPROVE' | 'REJECT';

export interface ReviewChangeRequestInput {
  id: string;
  organizationId: string;
  actorId: string;
  decision: ChangeRequestDecision;
}

export async function reviewChangeRequest(input: ReviewChangeRequestInput): Promise<ChangeRequest> {
  const request = await prisma.changeRequest.findUnique({
    where: { id: input.id },
    include: { employee: { select: { organizationId: true } } },
  });

  if (!request || request.employee.organizationId !== input.organizationId) {
    throw new NotFoundError('Change request not found');
  }

  if (request.status !== ChangeRequestStatus.PENDING) {
    throw new ValidationError('Only pending change requests can be reviewed');
  }

  const status =
    input.decision === 'APPROVE' ? ChangeRequestStatus.SCHEDULED : ChangeRequestStatus.REJECTED;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.changeRequest.update({
      where: { id: input.id },
      data: { status },
    });

    await logAction(
      {
        actorId: input.actorId,
        action:
          input.decision === 'APPROVE' ? 'CHANGE_REQUEST_APPROVED' : 'CHANGE_REQUEST_REJECTED',
        entityType: 'ChangeRequest',
        entityId: input.id,
      },
      tx,
    );

    return updated;
  });
}

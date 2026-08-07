import {
  ChangeRequestField,
  ChangeRequestStatus,
  type ChangeRequest,
  type EmploymentType,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logAction } from './auditLogger';

export function buildUserUpdateData(
  fieldChanged: ChangeRequestField,
  newValue: string,
): Prisma.UserUpdateInput {
  switch (fieldChanged) {
    case ChangeRequestField.POSITION:
      return { position: { connect: { id: newValue } } };
    case ChangeRequestField.DEPARTMENT:
      return { department: { connect: { id: newValue } } };
    case ChangeRequestField.SALARY:
      return { salary: Number(newValue) };
    case ChangeRequestField.EMPLOYMENT_TYPE:
      return { employmentType: newValue as EmploymentType };
  }
}

export async function applyDueChangeRequests(now: Date = new Date()): Promise<ChangeRequest[]> {
  const due = await prisma.changeRequest.findMany({
    where: {
      status: ChangeRequestStatus.SCHEDULED,
      effectiveDate: { lte: now },
    },
  });

  if (due.length === 0) {
    return [];
  }

  const applied: ChangeRequest[] = [];

  for (const request of due) {
    const updatedRequest = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: request.employeeId },
        data: buildUserUpdateData(request.fieldChanged, request.newValue),
      });

      const result = await tx.changeRequest.update({
        where: { id: request.id },
        data: { status: ChangeRequestStatus.APPLIED },
      });

      await logAction(
        {
          actorId: request.employeeId,
          action: 'CHANGE_REQUEST_APPLIED',
          entityType: 'ChangeRequest',
          entityId: request.id,
          metadata: {
            employeeId: request.employeeId,
            fieldChanged: request.fieldChanged,
            newValue: request.newValue,
            automated: true,
          },
        },
        tx,
      );

      return result;
    });

    applied.push(updatedRequest);
  }

  return applied;
}

import { ChangeRequestStatus, type ChangeRequest } from '@prisma/client';
import { prisma } from '../lib/prisma';

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

  await prisma.changeRequest.updateMany({
    where: { id: { in: due.map((request) => request.id) } },
    data: { status: ChangeRequestStatus.APPLIED },
  });

  return due.map((request) => ({ ...request, status: ChangeRequestStatus.APPLIED }));
}

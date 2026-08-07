import { ChangeRequestField, ChangeRequestStatus, type Department } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logAction } from './auditLogger';

export function listDepartments(organizationId: string): Promise<Department[]> {
  return prisma.department.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
  });
}

export interface CreateDepartmentInput {
  name: string;
  organizationId: string;
  actorId: string;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  const existing = await prisma.department.findFirst({
    where: { organizationId: input.organizationId, name: input.name },
  });
  if (existing) {
    throw new ValidationError('A department with this name already exists');
  }

  return prisma.$transaction(async (tx) => {
    const department = await tx.department.create({
      data: { name: input.name, organizationId: input.organizationId },
    });

    await logAction(
      {
        actorId: input.actorId,
        action: 'DEPARTMENT_CREATED',
        entityType: 'Department',
        entityId: department.id,
        metadata: { name: department.name },
      },
      tx,
    );

    return department;
  });
}

export interface UpdateDepartmentInput {
  id: string;
  name: string;
  organizationId: string;
  actorId: string;
}

export async function updateDepartment(input: UpdateDepartmentInput): Promise<Department> {
  const department = await prisma.department.findUnique({ where: { id: input.id } });
  if (!department || department.organizationId !== input.organizationId) {
    throw new NotFoundError('Department not found');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.department.update({
      where: { id: input.id },
      data: { name: input.name },
    });

    await logAction(
      {
        actorId: input.actorId,
        action: 'DEPARTMENT_UPDATED',
        entityType: 'Department',
        entityId: updated.id,
        metadata: { name: updated.name },
      },
      tx,
    );

    return updated;
  });
}

export interface RemoveDepartmentInput {
  id: string;
  organizationId: string;
  actorId: string;
}

export async function removeDepartment(input: RemoveDepartmentInput): Promise<void> {
  const department = await prisma.department.findUnique({ where: { id: input.id } });
  if (!department || department.organizationId !== input.organizationId) {
    throw new NotFoundError('Department not found');
  }

  const [assignedUserCount, referencedChangeRequestCount] = await Promise.all([
    prisma.user.count({ where: { departmentId: input.id } }),
    prisma.changeRequest.count({
      where: {
        fieldChanged: ChangeRequestField.DEPARTMENT,
        status: { in: [ChangeRequestStatus.PENDING, ChangeRequestStatus.SCHEDULED] },
        OR: [{ oldValue: input.id }, { newValue: input.id }],
      },
    }),
  ]);

  if (assignedUserCount > 0 || referencedChangeRequestCount > 0) {
    throw new ValidationError(
      'This department is still assigned to employees or referenced by an in-flight change request',
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.department.delete({ where: { id: input.id } });

    await logAction(
      {
        actorId: input.actorId,
        action: 'DEPARTMENT_DELETED',
        entityType: 'Department',
        entityId: input.id,
        metadata: { name: department.name },
      },
      tx,
    );
  });
}

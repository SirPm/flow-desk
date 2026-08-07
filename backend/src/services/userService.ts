import { type EmploymentType, type Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';

export interface EmployeeSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
  employmentType: EmploymentType | null;
  salary: number | null;
}

const employeeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: { select: { id: true, name: true } },
  position: { select: { id: true, title: true } },
  employmentType: true,
  salary: true,
} as const;

export function listOrganizationUsers(organizationId: string): Promise<EmployeeSummary[]> {
  return prisma.user.findMany({
    where: { organizationId },
    select: employeeSelect,
    orderBy: { name: 'asc' },
  });
}

export async function getUserProfile(
  userId: string,
  organizationId: string,
): Promise<EmployeeSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...employeeSelect, organizationId: true },
  });

  if (!user || user.organizationId !== organizationId) {
    throw new NotFoundError('User not found');
  }

  const { organizationId: _organizationId, ...profile } = user;
  return profile;
}

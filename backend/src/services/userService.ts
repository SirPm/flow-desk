import { type Role } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface OrganizationUserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export function listOrganizationUsers(organizationId: string): Promise<OrganizationUserSummary[]> {
  return prisma.user.findMany({
    where: { organizationId },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
}

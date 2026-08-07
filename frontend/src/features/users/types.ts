import type { Role } from '../auth/types';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';

export interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
  employmentType: EmploymentType | null;
  salary?: number | null;
}

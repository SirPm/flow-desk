import type { Role } from '../auth/types';

export interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

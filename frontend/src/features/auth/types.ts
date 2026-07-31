export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

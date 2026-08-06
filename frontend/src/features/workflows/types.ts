import type { Role } from '../auth/types';

export interface WorkflowTemplate {
  id: string;
  name: string;
  steps: Role[];
  createdBy: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

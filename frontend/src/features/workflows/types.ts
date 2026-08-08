import type { Role } from '../auth/types';
import type { ChangeRequestField } from '../change-requests/types';

export interface WorkflowTemplate {
  id: string;
  name: string;
  steps: Role[];
  isChangeRequestTemplate: boolean;
  changeRequestFields: ChangeRequestField[];
  createdBy: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

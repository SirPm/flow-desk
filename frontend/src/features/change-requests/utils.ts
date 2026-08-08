import type { Role } from '../auth/types';
import type { Department, Position } from '../organization/types';
import { EMPLOYMENT_TYPE_LABELS } from '../users/constants';
import type { ChangeRequest, ChangeRequestField } from './types';

export function canReviewChangeRequest(request: ChangeRequest, role: Role | undefined): boolean {
  if (request.status !== 'PENDING') return false;
  const requiredRole =
    request.approvalRequest.workflowTemplate.steps[request.approvalRequest.currentStep];
  return role === requiredRole || role === 'ADMIN';
}

export const CHANGE_REQUEST_FIELD_LABELS: Record<ChangeRequestField, string> = {
  POSITION: 'Position',
  DEPARTMENT: 'Department',
  SALARY: 'Salary',
  EMPLOYMENT_TYPE: 'Employment Type',
};

export function resolveChangeRequestValue(
  fieldChanged: ChangeRequestField,
  value: string,
  { departments, positions }: { departments?: Department[]; positions?: Position[] },
): string {
  if (!value) return 'Not set';
  switch (fieldChanged) {
    case 'POSITION':
      return positions?.find((position) => position.id === value)?.title ?? value;
    case 'DEPARTMENT':
      return departments?.find((department) => department.id === value)?.name ?? value;
    case 'EMPLOYMENT_TYPE':
      return EMPLOYMENT_TYPE_LABELS[value as keyof typeof EMPLOYMENT_TYPE_LABELS] ?? value;
    default:
      return value;
  }
}

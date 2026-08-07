export type ChangeRequestStatus = 'PENDING' | 'SCHEDULED' | 'APPLIED' | 'REJECTED';
export type ChangeRequestDecision = 'APPROVE' | 'REJECT';
export type ChangeRequestField = 'POSITION' | 'DEPARTMENT' | 'SALARY' | 'EMPLOYMENT_TYPE';

export interface ChangeRequestEmployee {
  id: string;
  name: string;
  email: string;
}

export interface ChangeRequest {
  id: string;
  employeeId: string;
  fieldChanged: ChangeRequestField;
  oldValue: string;
  newValue: string;
  effectiveDate: string;
  status: ChangeRequestStatus;
  createdAt: string;
  updatedAt: string;
  employee?: ChangeRequestEmployee;
}

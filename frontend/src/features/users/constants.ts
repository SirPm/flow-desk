import type { EmploymentType } from './types';

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
};

export const EMPLOYMENT_TYPE_OPTIONS: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT'];

export function formatSalary(salary: number | null | undefined): string {
  if (salary == null) return '—';
  return salary.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

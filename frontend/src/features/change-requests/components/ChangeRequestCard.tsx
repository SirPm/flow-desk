import { useDepartments } from '../../organization/hooks/useDepartments';
import { usePositions } from '../../organization/hooks/usePositions';
import { EMPLOYMENT_TYPE_LABELS } from '../../users/constants';
import type { ChangeRequest, ChangeRequestDecision, ChangeRequestField } from '../types';
import { ChangeRequestStatusBadge } from './ChangeRequestStatusBadge';

const FIELD_LABELS: Record<ChangeRequestField, string> = {
  POSITION: 'Position',
  DEPARTMENT: 'Department',
  SALARY: 'Salary',
  EMPLOYMENT_TYPE: 'Employment Type',
};

export function ChangeRequestCard({
  request,
  canReview,
  onReview,
  isReviewing,
}: {
  request: ChangeRequest;
  canReview: boolean;
  onReview: (id: string, decision: ChangeRequestDecision) => void;
  isReviewing: boolean;
}) {
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();

  function resolveValue(value: string): string {
    if (!value) return 'Not set';
    switch (request.fieldChanged) {
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

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {request.employee?.name ?? request.employeeId} · {FIELD_LABELS[request.fieldChanged]}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {resolveValue(request.oldValue)} &rarr; {resolveValue(request.newValue)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Effective {new Date(request.effectiveDate).toLocaleDateString()}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ChangeRequestStatusBadge status={request.status} />
        {canReview && request.status === 'PENDING' && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isReviewing}
              onClick={() => onReview(request.id, 'APPROVE')}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={isReviewing}
              onClick={() => onReview(request.id, 'REJECT')}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

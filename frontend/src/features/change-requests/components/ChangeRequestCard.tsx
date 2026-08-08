import { Link } from 'react-router-dom';
import { useDepartments } from '../../organization/hooks/useDepartments';
import { usePositions } from '../../organization/hooks/usePositions';
import type { ChangeRequest, ChangeRequestDecision } from '../types';
import { CHANGE_REQUEST_FIELD_LABELS, resolveChangeRequestValue } from '../utils';
import { ChangeRequestStatusBadge } from './ChangeRequestStatusBadge';

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
    return resolveChangeRequestValue(request.fieldChanged, value, { departments, positions });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <Link
          to={`/change-requests/${request.id}`}
          className="text-sm font-semibold text-slate-900 hover:text-indigo-600 hover:underline"
        >
          {request.employee?.name ?? request.employeeId} ·{' '}
          {CHANGE_REQUEST_FIELD_LABELS[request.fieldChanged]}
        </Link>
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

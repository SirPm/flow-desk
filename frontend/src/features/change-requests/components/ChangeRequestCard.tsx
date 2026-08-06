import type { ChangeRequest, ChangeRequestDecision } from '../types';
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
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {request.employee?.name ?? request.employeeId} · {request.fieldChanged}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {request.oldValue} &rarr; {request.newValue}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Effective {new Date(request.effectiveDate).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-3">
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

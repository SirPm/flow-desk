import type { ChangeRequestStatus } from '../types';

const STATUS_STYLES: Record<ChangeRequestStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700',
  SCHEDULED: 'bg-indigo-50 text-indigo-700',
  APPLIED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

export function ChangeRequestStatusBadge({ status }: { status: ChangeRequestStatus }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

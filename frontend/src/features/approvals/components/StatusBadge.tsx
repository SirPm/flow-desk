import type { ApprovalStatus } from '../types';

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  SKIPPED: 'bg-amber-50 text-amber-700',
};

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

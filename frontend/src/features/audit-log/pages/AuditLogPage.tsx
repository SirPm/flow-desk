import { EmptyState } from '../../../components/EmptyState';

export function AuditLogPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
      <EmptyState
        title="No activity recorded yet"
        description="Approval actions, change requests, and permission overrides will be logged here."
      />
    </div>
  );
}

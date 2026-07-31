import { EmptyState } from '../../../components/EmptyState';

export function ApprovalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Approvals</h1>
      <EmptyState
        title="No approval requests yet"
        description="Requests assigned to your role will show up here."
      />
    </div>
  );
}

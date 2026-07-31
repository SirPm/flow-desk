import { EmptyState } from '../../../components/EmptyState';

export function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Workflows</h1>
      <EmptyState
        title="No workflow templates yet"
        description="Approval chains you build will show up here."
      />
    </div>
  );
}

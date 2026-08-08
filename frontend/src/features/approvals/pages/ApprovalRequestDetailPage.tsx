import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { useApprovalRequest } from '../hooks/useApprovalRequest';
import { ApprovalActionButtons } from '../components/ApprovalActionButtons';
import { ApprovalActionHistory } from '../components/ApprovalActionHistory';
import { StatusBadge } from '../components/StatusBadge';
import { StepTimeline } from '../components/StepTimeline';

export function ApprovalRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useAppSelector((state) => state.auth.user?.role);
  const { data: request, isLoading, isError } = useApprovalRequest(id ?? '');

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (isError || !request)
    return <p className="text-sm text-red-600">Approval request not found.</p>;

  const requiredRole = request.workflowTemplate.steps[request.currentStep];
  const canAct = request.status === 'PENDING' && (role === requiredRole || role === 'ADMIN');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900">
            {request.workflowTemplate.name ?? 'Approval request'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Request {request.id}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <StepTimeline
        steps={request.workflowTemplate.steps}
        currentStep={request.currentStep}
        status={request.status}
      />

      {canAct && <ApprovalActionButtons requestId={request.id} />}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Action history</h2>
        <ApprovalActionHistory actions={request.actions ?? []} />
      </div>
    </div>
  );
}

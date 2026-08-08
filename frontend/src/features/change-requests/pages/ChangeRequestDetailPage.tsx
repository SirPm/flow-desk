import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { useDepartments } from '../../organization/hooks/useDepartments';
import { usePositions } from '../../organization/hooks/usePositions';
import { ApprovalActionHistory } from '../../approvals/components/ApprovalActionHistory';
import { StepTimeline } from '../../approvals/components/StepTimeline';
import { useChangeRequest } from '../hooks/useChangeRequest';
import { ChangeRequestActionButtons } from '../components/ChangeRequestActionButtons';
import { ChangeRequestStatusBadge } from '../components/ChangeRequestStatusBadge';
import {
  CHANGE_REQUEST_FIELD_LABELS,
  canReviewChangeRequest,
  resolveChangeRequestValue,
} from '../utils';

export function ChangeRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useAppSelector((state) => state.auth.user?.role);
  const { data: request, isLoading, isError } = useChangeRequest(id ?? '');
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (isError || !request) return <p className="text-sm text-red-600">Change request not found.</p>;

  const canAct = canReviewChangeRequest(request, role);
  const resolveValue = (value: string) =>
    resolveChangeRequestValue(request.fieldChanged, value, { departments, positions });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900">
            {request.employee?.name ?? request.employeeId} ·{' '}
            {CHANGE_REQUEST_FIELD_LABELS[request.fieldChanged]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {resolveValue(request.oldValue)} &rarr; {resolveValue(request.newValue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Effective {new Date(request.effectiveDate).toLocaleDateString()}
          </p>
        </div>
        <ChangeRequestStatusBadge status={request.status} />
      </div>

      <StepTimeline
        steps={request.approvalRequest.workflowTemplate.steps}
        currentStep={request.approvalRequest.currentStep}
        status={request.approvalRequest.status}
      />

      {canAct && <ChangeRequestActionButtons requestId={request.id} />}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Action history</h2>
        <ApprovalActionHistory actions={request.approvalRequest.actions ?? []} />
      </div>
    </div>
  );
}

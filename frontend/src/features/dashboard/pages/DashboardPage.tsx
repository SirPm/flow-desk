import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/EmptyState';
import { useApprovalRequests } from '../../approvals/hooks/useApprovalRequests';
import { StatusBadge } from '../../approvals/components/StatusBadge';
import { useChangeRequests } from '../../change-requests/hooks/useChangeRequests';
import { ChangeRequestStatusBadge } from '../../change-requests/components/ChangeRequestStatusBadge';
import { CHANGE_REQUEST_FIELD_LABELS, canReviewChangeRequest } from '../../change-requests/utils';
import { useWorkflowTemplates } from '../../workflows/hooks/useWorkflowTemplates';
import { useOrganization } from '../../organization/hooks/useOrganization';

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role;

  const { data: organization } = useOrganization();
  const changeRequestsEnabled = organization?.featureFlags.changeRequests !== false;

  const { data: myApprovals, isLoading: approvalsLoading } = useApprovalRequests(true);
  const { data: changeRequests, isLoading: changeRequestsLoading } = useChangeRequests({
    status: 'PENDING',
  });
  const { data: workflowTemplates } = useWorkflowTemplates();

  const pendingApprovals = myApprovals ?? [];
  const relevantChangeRequests = changeRequestsEnabled
    ? (changeRequests ?? []).filter(
        (request) => role === 'EMPLOYEE' || canReviewChangeRequest(request, role),
      )
    : [];

  const canManageWorkflows = role === 'ADMIN' || role === 'MANAGER';
  const isLoading = approvalsLoading || (changeRequestsEnabled && changeRequestsLoading);
  const hasNothing =
    !isLoading && pendingApprovals.length === 0 && relevantChangeRequests.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome back{user ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-700">{user?.role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Pending your approval
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{pendingApprovals.length}</p>
        </div>
        {changeRequestsEnabled && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {role === 'EMPLOYEE' ? 'Your pending change requests' : 'Change requests to review'}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {relevantChangeRequests.length}
            </p>
          </div>
        )}
        {canManageWorkflows && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Workflow templates
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {workflowTemplates?.length ?? 0}
            </p>
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}

      {hasNothing && (
        <EmptyState
          title="Nothing to show yet"
          description="Once workflows and approval requests exist, your role-relevant activity will appear here."
        />
      )}

      {pendingApprovals.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Needs your approval</h2>
            <Link to="/approvals" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {pendingApprovals.slice(0, 5).map((request) => {
              const requiredRole = request.workflowTemplate.steps[request.currentStep];
              return (
                <li key={request.id}>
                  <Link
                    to={`/approvals/${request.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {request.workflowTemplate.name ?? 'Approval request'} · Step{' '}
                        {request.currentStep + 1} of {request.workflowTemplate.steps.length}
                        {requiredRole ? ` · awaiting ${requiredRole}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Request {request.id}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {relevantChangeRequests.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {role === 'EMPLOYEE' ? 'Your change requests' : 'Change requests to review'}
            </h2>
            <Link
              to="/change-requests"
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {relevantChangeRequests.slice(0, 5).map((request) => (
              <li key={request.id}>
                <Link
                  to={`/change-requests/${request.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {request.employee?.name ?? request.employeeId} ·{' '}
                      {CHANGE_REQUEST_FIELD_LABELS[request.fieldChanged]}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Effective {new Date(request.effectiveDate).toLocaleDateString()}
                    </p>
                  </div>
                  <ChangeRequestStatusBadge status={request.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

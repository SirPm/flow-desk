import { useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/EmptyState';
import { useOrganization } from '../../organization/hooks/useOrganization';
import { useChangeRequests } from '../hooks/useChangeRequests';
import { useReviewChangeRequest } from '../hooks/useReviewChangeRequest';
import { EditEmployeeInfoForm } from '../components/EditEmployeeInfoForm';
import { ChangeRequestCard } from '../components/ChangeRequestCard';
import { ChangeRequestWorkflowSettings } from '../components/ChangeRequestWorkflowSettings';
import { canReviewChangeRequest } from '../utils';
import type { ChangeRequestDecision, ChangeRequestStatus } from '../types';

const STATUS_FILTERS: { label: string; value: ChangeRequestStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export function ChangeRequestsPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const { data: organization } = useOrganization();
  const [status, setStatus] = useState<ChangeRequestStatus | undefined>(undefined);
  const { data: requests, isLoading, isError } = useChangeRequests({ status });
  const reviewChangeRequest = useReviewChangeRequest();

  const canCreate = role === 'ADMIN' || role === 'MANAGER';
  const changeRequestsEnabled = organization?.featureFlags.changeRequests !== false;

  function handleReview(id: string, decision: ChangeRequestDecision) {
    reviewChangeRequest.mutate({ id, decision });
  }

  if (!changeRequestsEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-slate-900">Change Requests</h1>
        <EmptyState
          title="Feature disabled"
          description="Change requests are currently disabled for your organization."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Change Requests</h1>

      {canCreate && (
        <ChangeRequestWorkflowSettings
          changeRequestTemplateId={organization?.changeRequestTemplateId ?? null}
          canEdit={role === 'ADMIN'}
        />
      )}

      {canCreate && <EditEmployeeInfoForm />}

      <div className="flex gap-1 self-start rounded-md border border-slate-200 bg-white p-1 text-sm">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={`rounded px-3 py-1 font-medium ${
              status === filter.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load change requests.</p>}

      {requests && requests.length === 0 && (
        <EmptyState
          title="No change requests yet"
          description="Employee info edits will appear here as pending, scheduled, applied, or rejected changes."
        />
      )}

      {requests && requests.length > 0 && (
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <ChangeRequestCard
              key={request.id}
              request={request}
              canReview={canReviewChangeRequest(request, role)}
              onReview={handleReview}
              isReviewing={reviewChangeRequest.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

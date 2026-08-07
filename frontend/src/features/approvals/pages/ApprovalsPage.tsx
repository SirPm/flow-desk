import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { useApprovalRequests } from '../hooks/useApprovalRequests';
import { StatusBadge } from '../components/StatusBadge';

export function ApprovalsPage() {
  const [mine, setMine] = useState(true);
  const { data: requests, isLoading, isError } = useApprovalRequests(mine);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Approvals</h1>
        <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => setMine(true)}
            className={`rounded px-3 py-1 font-medium ${mine ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            My queue
          </button>
          <button
            type="button"
            onClick={() => setMine(false)}
            className={`rounded px-3 py-1 font-medium ${!mine ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            All requests
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load approval requests.</p>}

      {requests && requests.length === 0 && (
        <EmptyState
          title="No approval requests yet"
          description="Requests assigned to your role will show up here."
        />
      )}

      {requests && requests.length > 0 && (
        <ul className="flex flex-col gap-2">
          {requests.map((request) => {
            const requiredRole = request.workflowTemplate.steps[request.currentStep];
            return (
              <li key={request.id}>
                <Link
                  to={`/approvals/${request.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      Step{' '}
                      {request.status !== 'APPROVED'
                        ? request.currentStep + 1
                        : request.workflowTemplate.steps.length}{' '}
                      of {request.workflowTemplate.steps.length}
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
      )}
    </div>
  );
}

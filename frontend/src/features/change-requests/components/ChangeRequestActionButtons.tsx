import { useReviewChangeRequest } from '../hooks/useReviewChangeRequest';
import { getErrorMessage } from '../../../lib/apiClient';

export function ChangeRequestActionButtons({ requestId }: { requestId: string }) {
  const review = useReviewChangeRequest();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      {review.isError && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(review.error)}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={review.isPending}
          onClick={() => review.mutate({ id: requestId, decision: 'APPROVE' })}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={review.isPending}
          onClick={() => review.mutate({ id: requestId, decision: 'REJECT' })}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

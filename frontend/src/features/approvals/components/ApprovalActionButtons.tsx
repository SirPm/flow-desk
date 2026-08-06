import { useState } from 'react';
import { useActOnApprovalRequest } from '../hooks/useActOnApprovalRequest';
import { getErrorMessage } from '../../../lib/apiClient';
import type { ApprovalActionType } from '../types';

export function ApprovalActionButtons({ requestId }: { requestId: string }) {
  const [note, setNote] = useState('');
  const [skipValidationError, setSkipValidationError] = useState('');
  const act = useActOnApprovalRequest();

  function handleAct(action: ApprovalActionType) {
    if (action === 'SKIP' && note.trim().length === 0) {
      setSkipValidationError('A reason is required to skip a step');
      return;
    }
    setSkipValidationError('');
    act.mutate(
      { id: requestId, action, note: note.trim() || undefined },
      { onSuccess: () => setNote('') },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="action-note" className="text-sm font-medium text-slate-700">
          Note <span className="font-normal text-slate-400">(required to skip)</span>
        </label>
        <textarea
          id="action-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      {skipValidationError && (
        <p role="alert" className="text-sm text-red-600">
          {skipValidationError}
        </p>
      )}
      {act.isError && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(act.error)}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={act.isPending}
          onClick={() => handleAct('APPROVE')}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={act.isPending}
          onClick={() => handleAct('SKIP')}
          className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-400 disabled:opacity-60"
        >
          Skip
        </button>
        <button
          type="button"
          disabled={act.isPending}
          onClick={() => handleAct('REJECT')}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

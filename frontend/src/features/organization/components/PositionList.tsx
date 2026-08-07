import { useState, type FormEvent } from 'react';
import { usePositions } from '../hooks/usePositions';
import { useCreatePosition } from '../hooks/useCreatePosition';
import { useDeletePosition } from '../hooks/useDeletePosition';
import { getErrorMessage } from '../../../lib/apiClient';

export function PositionList() {
  const { data: positions, isLoading, isError } = usePositions();
  const createPosition = useCreatePosition();
  const deletePosition = useDeletePosition();
  const [title, setTitle] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createPosition.mutate(title, { onSuccess: () => setTitle('') });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Positions</h2>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load positions.</p>}

      {positions && positions.length === 0 && (
        <p className="text-sm text-slate-500">No positions yet.</p>
      )}

      {positions && positions.length > 0 && (
        <ul className="flex flex-col gap-1">
          {positions.map((position) => (
            <li
              key={position.id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm text-slate-700"
            >
              {position.title}
              <button
                type="button"
                disabled={deletePosition.isPending}
                onClick={() => deletePosition.mutate(position.id)}
                className="text-xs font-medium text-red-600 hover:text-red-500 disabled:opacity-60"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Software Engineer"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={createPosition.isPending || !title}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {(createPosition.isError || deletePosition.isError) && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(createPosition.error ?? deletePosition.error)}
        </p>
      )}
    </div>
  );
}

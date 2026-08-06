import type { ApprovalAction } from '../types';

const ACTION_STYLES: Record<ApprovalAction['action'], string> = {
  APPROVE: 'bg-emerald-50 text-emerald-700',
  SKIP: 'bg-amber-50 text-amber-700',
  REJECT: 'bg-red-50 text-red-700',
};

export function ApprovalActionHistory({ actions }: { actions: ApprovalAction[] }) {
  if (actions.length === 0) {
    return <p className="text-sm text-slate-400">No actions have been taken yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      {actions.map((action) => (
        <li
          key={action.id}
          className="flex flex-col gap-1 rounded-md border border-slate-200 bg-white p-3 text-sm"
        >
          <div className="flex items-center justify-between">
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${ACTION_STYLES[action.action]}`}
            >
              {action.action}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(action.timestamp).toLocaleString()}
            </span>
          </div>
          {action.note && <p className="text-slate-600">{action.note}</p>}
        </li>
      ))}
    </ol>
  );
}

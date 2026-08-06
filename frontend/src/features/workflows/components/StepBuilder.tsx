import { useState } from 'react';
import { ALL_ROLES, type Role } from '../../auth/types';

export function StepBuilder({
  steps,
  onChange,
}: {
  steps: Role[];
  onChange: (steps: Role[]) => void;
}) {
  const [nextRole, setNextRole] = useState<Role>(ALL_ROLES[0]);

  function addStep() {
    onChange([...steps, nextRole]);
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {steps.map((role, index) => (
          <li
            key={`${role}-${index}`}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <span className="font-medium text-slate-700">
              {index + 1}. {role}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveStep(index, -1)}
                disabled={index === 0}
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                aria-label={`Move step ${index + 1} up`}
              >
                &uarr;
              </button>
              <button
                type="button"
                onClick={() => moveStep(index, 1)}
                disabled={index === steps.length - 1}
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                aria-label={`Move step ${index + 1} down`}
              >
                &darr;
              </button>
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="rounded px-2 py-1 text-red-500 hover:bg-red-50"
                aria-label={`Remove step ${index + 1}`}
              >
                &times;
              </button>
            </div>
          </li>
        ))}
        {steps.length === 0 && <li className="text-sm text-slate-400">No steps yet</li>}
      </ol>
      <div className="flex items-center gap-2">
        <select
          value={nextRole}
          onChange={(e) => setNextRole(e.target.value as Role)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addStep}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Add step
        </button>
      </div>
    </div>
  );
}

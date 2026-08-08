import type { Role } from '../../auth/types';
import type { ApprovalStatus } from '../types';

export function StepTimeline({
  steps,
  currentStep,
  status,
}: {
  steps: Role[];
  currentStep: number;
  status: ApprovalStatus;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <ol className="flex flex-wrap gap-2 text-sm">
        {steps.map((step, index) => {
          const isDone = index < currentStep || status === 'APPROVED';
          const isCurrent = index === currentStep && status === 'PENDING';
          return (
            <li
              key={`${step}-${index}`}
              className={`rounded-full px-3 py-1 font-medium ${
                isCurrent
                  ? 'bg-indigo-600 text-white'
                  : isDone
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              {index + 1}. {step}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

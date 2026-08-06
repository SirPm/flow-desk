import type { WorkflowTemplate } from '../types';

export function TemplateCard({
  template,
  onSubmitRequest,
  isSubmitting,
}: {
  template: WorkflowTemplate;
  onSubmitRequest: (templateId: string) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
        <p className="mt-1 text-xs text-slate-500">{template.steps.join(' → ')}</p>
      </div>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => onSubmitRequest(template.id)}
        className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Submit request
      </button>
    </div>
  );
}

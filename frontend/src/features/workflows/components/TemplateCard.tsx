import type { WorkflowTemplate } from '../types';
import { CHANGE_REQUEST_FIELD_LABELS } from '../../change-requests/utils';

export function TemplateCard({
  template,
  onSubmitRequest,
  isSubmitting,
  isDefaultForChangeRequests,
  onSetDefault,
  isSettingDefault,
}: {
  template: WorkflowTemplate;
  onSubmitRequest: (templateId: string) => void;
  isSubmitting: boolean;
  isDefaultForChangeRequests?: boolean;
  onSetDefault?: (templateId: string | null) => void;
  isSettingDefault?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
          {isDefaultForChangeRequests && (
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
              Default for change requests
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">{template.steps.join(' → ')}</p>
        {template.isChangeRequestTemplate && (
          <p className="mt-1 text-xs text-slate-400">
            {template.changeRequestFields.length > 0
              ? `Change requests: ${template.changeRequestFields
                  .map((field) => CHANGE_REQUEST_FIELD_LABELS[field])
                  .join(', ')}`
              : 'Change requests: all fields'}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onSetDefault && template.isChangeRequestTemplate && (
          <button
            type="button"
            disabled={isSettingDefault}
            onClick={() => onSetDefault(isDefaultForChangeRequests ? null : template.id)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDefaultForChangeRequests ? 'Unset default' : 'Set as default'}
          </button>
        )}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onSubmitRequest(template.id)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Submit request
        </button>
      </div>
    </div>
  );
}

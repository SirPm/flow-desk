import { useWorkflowTemplates } from '../../workflows/hooks/useWorkflowTemplates';
import { useSetChangeRequestTemplate } from '../../organization/hooks/useSetChangeRequestTemplate';
import { getErrorMessage } from '../../../lib/apiClient';

export function ChangeRequestWorkflowSettings({
  changeRequestTemplateId,
  canEdit,
}: {
  changeRequestTemplateId: string | null;
  canEdit: boolean;
}) {
  const { data: templates, isLoading } = useWorkflowTemplates();
  const setChangeRequestTemplate = useSetChangeRequestTemplate();

  const currentTemplate = templates?.find((template) => template.id === changeRequestTemplateId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">Review workflow</p>
        {currentTemplate ? (
          <p className="mt-1 text-xs text-slate-500">
            {currentTemplate.name} · {currentTemplate.steps.join(' → ')}
          </p>
        ) : (
          <p className="mt-1 text-xs text-amber-600">
            No default template configured — change requests can&apos;t be created until an admin
            sets one.
          </p>
        )}
        {setChangeRequestTemplate.isError && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {getErrorMessage(setChangeRequestTemplate.error)}
          </p>
        )}
      </div>

      {canEdit && (
        <select
          aria-label="Review workflow template"
          value={changeRequestTemplateId ?? ''}
          disabled={isLoading || setChangeRequestTemplate.isPending}
          onChange={(e) => setChangeRequestTemplate.mutate(e.target.value || null)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">No default template</option>
          {templates?.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

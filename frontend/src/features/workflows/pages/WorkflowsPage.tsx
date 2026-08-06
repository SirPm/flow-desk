import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/EmptyState';
import { useWorkflowTemplates } from '../hooks/useWorkflowTemplates';
import { useCreateApprovalRequest } from '../../approvals/hooks/useCreateApprovalRequest';
import { CreateTemplateForm } from '../components/CreateTemplateForm';
import { TemplateCard } from '../components/TemplateCard';

export function WorkflowsPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const { data: templates, isLoading, isError } = useWorkflowTemplates();
  const createRequest = useCreateApprovalRequest();
  const navigate = useNavigate();

  function handleSubmitRequest(templateId: string) {
    createRequest.mutate(templateId, {
      onSuccess: (request) => navigate(`/approvals/${request.id}`),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Workflows</h1>

      {role === 'ADMIN' && <CreateTemplateForm />}

      {isLoading && <p className="text-sm text-slate-500">Loading templates...</p>}
      {isError && <p className="text-sm text-red-600">Could not load workflow templates.</p>}

      {templates && templates.length === 0 && (
        <EmptyState
          title="No workflow templates yet"
          description="Approval chains you build will show up here."
        />
      )}

      {templates && templates.length > 0 && (
        <div className="flex flex-col gap-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSubmitRequest={handleSubmitRequest}
              isSubmitting={createRequest.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

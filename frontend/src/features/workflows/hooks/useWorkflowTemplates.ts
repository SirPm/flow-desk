import { useQuery } from '@tanstack/react-query';
import { listWorkflowTemplates } from '../api/workflowsApi';

export const workflowTemplatesQueryKey = ['workflow-templates'] as const;

export function useWorkflowTemplates() {
  return useQuery({
    queryKey: workflowTemplatesQueryKey,
    queryFn: listWorkflowTemplates,
  });
}

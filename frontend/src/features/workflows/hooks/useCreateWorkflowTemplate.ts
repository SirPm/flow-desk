import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkflowTemplate } from '../api/workflowsApi';
import { workflowTemplatesQueryKey } from './useWorkflowTemplates';

export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkflowTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowTemplatesQueryKey });
    },
  });
}

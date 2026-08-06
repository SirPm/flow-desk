import { apiClient } from '../../../lib/apiClient';
import type { Role } from '../../auth/types';
import type { WorkflowTemplate } from '../types';

export interface CreateWorkflowTemplatePayload {
  name: string;
  steps: Role[];
}

export async function listWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const { data } = await apiClient.get<{ workflowTemplates: WorkflowTemplate[] }>(
    '/workflow-templates',
  );
  return data.workflowTemplates;
}

export async function createWorkflowTemplate(
  payload: CreateWorkflowTemplatePayload,
): Promise<WorkflowTemplate> {
  const { data } = await apiClient.post<{ workflowTemplate: WorkflowTemplate }>(
    '/workflow-templates',
    payload,
  );
  return data.workflowTemplate;
}

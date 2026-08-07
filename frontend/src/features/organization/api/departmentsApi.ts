import { apiClient } from '../../../lib/apiClient';
import type { Department } from '../types';

export async function listDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<{ departments: Department[] }>('/departments');
  return data.departments;
}

export async function createDepartment(name: string): Promise<Department> {
  const { data } = await apiClient.post<{ department: Department }>('/departments', { name });
  return data.department;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/departments/${id}`);
}

import { apiClient } from '../../../lib/apiClient';
import type { Position } from '../types';

export async function listPositions(): Promise<Position[]> {
  const { data } = await apiClient.get<{ positions: Position[] }>('/positions');
  return data.positions;
}

export async function createPosition(title: string): Promise<Position> {
  const { data } = await apiClient.post<{ position: Position }>('/positions', { title });
  return data.position;
}

export async function deletePosition(id: string): Promise<void> {
  await apiClient.delete(`/positions/${id}`);
}

import { apiClient } from '../../../lib/apiClient';
import type { AuthResult } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/login', payload);
  return data;
}

export async function signup(payload: SignupPayload): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/signup', payload);
  return data;
}

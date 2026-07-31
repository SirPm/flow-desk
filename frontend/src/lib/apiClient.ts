import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import { AUTH_STORAGE_KEY } from '../features/auth/authSlice';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
});

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  const token = raw ? (JSON.parse(raw).token as string | null) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ApiErrorBody {
  error: { code: string; message: string };
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiErrorBody>;
    return axiosErr.response?.data?.error?.message ?? axiosErr.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

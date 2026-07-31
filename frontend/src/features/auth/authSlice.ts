import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthResult, AuthUser } from './types';

export const AUTH_STORAGE_KEY = 'flowdesk_auth';

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

function loadInitialState(): AuthState {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return { user: null, token: null };
  try {
    const parsed = JSON.parse(raw) as AuthState;
    return parsed;
  } catch {
    return { user: null, token: null };
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResult>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

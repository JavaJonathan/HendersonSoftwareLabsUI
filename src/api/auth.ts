import { apiFetch } from './client';
import type { LoginResponse, MeResponse } from '../types';

export function login(email: string, password: string) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return apiFetch<MeResponse>('/api/auth/me');
}

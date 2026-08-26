import { apiFetch } from './client';
import type {
  AdminClient,
  CreateClientPayload,
  CreateClientResult,
  CreateProjectPayload,
  ResetPasswordResult,
  SoftwareProject,
} from '../types';

export function getClients() {
  return apiFetch<AdminClient[]>('/api/admin/clients');
}

export function getClient(clientId: string) {
  return apiFetch<AdminClient>(`/api/admin/clients/${clientId}`);
}

export function createClient(payload: CreateClientPayload) {
  return apiFetch<CreateClientResult>('/api/admin/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function resetClientPassword(clientId: string) {
  return apiFetch<ResetPasswordResult>(`/api/admin/clients/${clientId}/reset-password`, {
    method: 'POST',
  });
}

export function getClientProjects(clientId: string) {
  return apiFetch<SoftwareProject[]>(`/api/admin/clients/${clientId}/projects`);
}

export function createProject(clientId: string, payload: CreateProjectPayload) {
  return apiFetch<SoftwareProject>(`/api/admin/clients/${clientId}/projects`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

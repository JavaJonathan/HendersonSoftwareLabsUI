import { apiFetch } from './client';
import type { SoftwareProject } from '../types';

export function getMyProjects() {
  return apiFetch<SoftwareProject[]>('/api/portal/projects');
}

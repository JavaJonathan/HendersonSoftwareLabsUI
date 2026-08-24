export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  email: string;
  companyName: string;
  isAdmin: boolean;
}

export interface MeResponse {
  email: string;
  companyName: string;
  contactName: string | null;
  isAdmin: boolean;
}

export interface SoftwareProject {
  id: number;
  name: string;
  description: string;
  status: 'Planning' | 'InProgress' | 'Live' | 'Maintenance' | 'OnHold' | 'Completed';
  url: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export const PROJECT_STATUSES: SoftwareProject['status'][] = [
  'Planning',
  'InProgress',
  'Live',
  'Maintenance',
  'OnHold',
  'Completed',
];

export const PROJECT_STATUS_LABELS: Record<SoftwareProject['status'], string> = {
  Planning: 'Planning',
  InProgress: 'In Progress',
  Live: 'Live',
  Maintenance: 'Maintenance',
  OnHold: 'On Hold',
  Completed: 'Completed',
};

export interface AdminClient {
  id: string;
  email: string;
  companyName: string;
  contactName: string | null;
  projectCount: number;
}

export interface CreateClientPayload {
  email: string;
  companyName: string;
  contactName?: string;
}

export interface CreateClientResult {
  id: string;
  email: string;
  companyName: string;
  generatedPassword: string;
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  status: SoftwareProject['status'];
  url?: string;
}

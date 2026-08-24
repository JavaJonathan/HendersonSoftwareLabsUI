export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  email: string;
  companyName: string;
}

export interface MeResponse {
  email: string;
  companyName: string;
  contactName: string | null;
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

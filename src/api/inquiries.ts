import { apiFetch } from './client';

export type InquiryStatus = 'New' | 'Contacted' | 'Archived';
export interface InquirySummary {
  id: number; name: string; email: string; createdAt: string; status: InquiryStatus; preview: string;
}
export interface Inquiry extends InquirySummary { message: string; statusUpdatedAt: string }
export interface InquiryList { items: InquirySummary[]; total: number; newCount: number; page: number; pageSize: number }
export const getInquiries = (status = 'New', page = 1) => apiFetch<InquiryList>(`/api/admin/inquiries?status=${encodeURIComponent(status)}&page=${page}`);
export const getInquiry = (id: number) => apiFetch<Inquiry>(`/api/admin/inquiries/${id}`);
export const updateInquiryStatus = (id: number, status: InquiryStatus) => apiFetch<void>(`/api/admin/inquiries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export interface ContactPayload { submissionId: string; name: string; email: string; message: string; website: string }
export async function submitInquiry(payload: ContactPayload) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contact`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(response.status === 429
      ? 'Too many attempts. Please try again in 15 minutes or email Jonathan directly.'
      : body?.message ?? 'We couldn’t save your inquiry. Check your entries and try again, or email Jonathan directly.');
  }
}

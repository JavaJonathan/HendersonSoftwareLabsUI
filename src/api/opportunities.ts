import { apiFetch, apiFetchBlob } from './client';

export type OpportunityEntityType = 'ActiveProject' | 'BusinessProspect';
export type OpportunitySourceType = 'ExplicitDemand' | 'OperationalSignal';
export type ActiveProjectDecision = 'Pursue' | 'Investigate' | 'Pass';
export type BusinessProspectDecision = 'Prioritize' | 'Watch' | 'Skip';
export type OpportunityRecommendation = ActiveProjectDecision | BusinessProspectDecision;
export type PriorityBand = 'High' | 'Medium' | 'Low';
export type BudgetStatus = 'Unknown' | 'Compatible' | 'Incompatible';
export type EvaluationProvider = 'Simulated' | 'Jev';

export const SOURCE_TYPE_LABELS: Record<OpportunitySourceType, string> = {
  ExplicitDemand: 'Explicit demand', OperationalSignal: 'Operational signal',
};

export const RECOMMENDATION_META: Record<OpportunityRecommendation, { chipColor: 'success' | 'warning' | 'default' }> = {
  Pursue: { chipColor: 'success' }, Investigate: { chipColor: 'warning' }, Pass: { chipColor: 'default' },
  Prioritize: { chipColor: 'success' }, Watch: { chipColor: 'warning' }, Skip: { chipColor: 'default' },
};

export interface OpportunitySummary {
  id: number;
  entityType: OpportunityEntityType;
  title: string;
  preview: string;
  sourceType: OpportunitySourceType | null;
  recommendation: OpportunityRecommendation | null;
  priorityBand: PriorityBand | null;
  budgetStatus: BudgetStatus | null;
  summary: string | null;
  evaluationStatus: 'Ready' | 'Failed' | 'Stale' | null;
  evaluationProvider: EvaluationProvider | null;
  userDecision: ActiveProjectDecision | BusinessProspectDecision | null;
  duplicateOfId: number | null;
  isSynthetic: boolean;
  createdAt: string;
  industry: string | null;
  geography: string | null;
  websiteDomain: string | null;
}

export interface OpportunityList { items: OpportunitySummary[]; total: number; page: number; pageSize: number }

export interface RadarPassage { id: string; text: string }
export interface RadarFactor { key: string; label: string; score: number; evidencePassageId: string; explanation: string }
export interface RadarResult {
  factors: RadarFactor[];
  knownFacts: string[];
  hypotheses: string[];
  missingInformation: string[];
  concerns: string[];
  keywordMatches: string[];
  summary: string;
  nextStep: string;
}

export interface OpportunityDetail {
  id: number;
  entityType: OpportunityEntityType;
  title: string;
  description: string;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceDate: string | null;
  externalId: string | null;
  passages: RadarPassage[];
  duplicateOfId: number | null;
  isSynthetic: boolean;
  notes: string;
  createdAt: string;
  activeProject: { sourceType: OpportunitySourceType; userDecision: ActiveProjectDecision | null } | null;
  businessProspect: {
    businessName: string; websiteUrl: string | null; normalizedWebsiteDomain: string | null;
    geography: string | null; industry: string | null; userDecision: BusinessProspectDecision | null;
  } | null;
  evaluation: null | {
    id: number; provider: EvaluationProvider; status: string; model: string; questionSetVersion: string;
    recommendation: OpportunityRecommendation | null; priorityBand: PriorityBand | null; budgetStatus: BudgetStatus;
    result: RadarResult | null; summary: string; nextStep: string;
    inputTokens: number | null; outputTokens: number | null; errorMessage: string | null; createdAt: string;
  };
}

export interface ActiveProjectPreferences {
  capabilities: string[];
  preferredProjectTypes: string[];
  excludedProjectTypes: string[];
  minimumBudget: number;
  minimumWeeks: number;
  maximumWeeks: number;
  incompleteInformationTolerance: 'Low' | 'Medium' | 'High';
  weights: { capabilityFit: number; problemClarity: number; independentScope: number; informationSufficiency: number };
}

export interface BusinessProspectPreferences {
  preferredIndustries: string[];
  excludedIndustries: string[];
  preferredGeographies: string[];
  excludedGeographies: string[];
  weights: {
    businessStrength: number; digitalPresenceWeakness: number; reputationMismatch: number;
    entryProjectStrength: number; geography: number; contactability: number; evidenceCompleteness: number;
  };
}

export interface RadarPreferences {
  activeProject: ActiveProjectPreferences;
  businessProspect: BusinessProspectPreferences;
  digestActiveProjectCount: number;
  digestBusinessProspectCount: number;
  updatedAt: string;
}

export interface ImportActiveProjectRequest {
  title: string; description: string; sourceType: OpportunitySourceType;
  sourceName?: string; sourceUrl?: string; sourceDate?: string; externalId?: string;
}

export interface ImportBusinessProspectRequest {
  businessName: string; evidence: string; websiteUrl?: string; geography?: string; industry?: string;
  sourceName?: string; sourceUrl?: string; sourceDate?: string; externalId?: string;
}

export interface ImportResult { id: number; created: boolean; updated: boolean; nearDuplicateOfId: number | null }

export interface RadarProviderStatus {
  activeProject: { liveAvailable: boolean; model: string };
  businessProspect: { liveAvailable: boolean; model: string };
}

export interface EvaluationPreview {
  provider: EvaluationProvider; recordCount: number; estimatedMaximumInputTokens: number; estimatedMaximumCostUsd: number;
  maximumBatchCostUsd: number; rollingDailyInputTokensUsed: number; rollingDailyInputTokenLimit: number;
  liveAvailable: boolean; allowed: boolean; reason: string | null; confirmationCode: string;
}

export interface KeywordRule { key: string; triggered: boolean; explanation: string }
export interface OpportunityComparison {
  baseline: null | {
    matchedTerms: string[]; keywordScore: number; recommendation: ActiveProjectDecision; budgetStatus: BudgetStatus;
    hardRules: KeywordRule[]; summary: string;
  };
  baselineUnavailableReason: string | null;
  semantic: null | {
    provider: EvaluationProvider; status: 'Ready' | 'Failed' | 'Stale'; model: string;
    recommendation: OpportunityRecommendation | null; priorityBand: PriorityBand | null; summary: string; createdAt: string;
  };
  isIllustration: boolean;
  note: string;
}

export interface OpportunityDigest {
  activeProjects: OpportunitySummary[]; activeProjectRequested: number; activeProjectReturned: number;
  businessProspects: OpportunitySummary[]; businessProspectRequested: number; businessProspectReturned: number;
}

const base = '/api/admin/opportunity-radar';

export const getOpportunities = (params: {
  entityType?: OpportunityEntityType; recommendation?: string; sourceType?: string; decision?: string; query?: string; page?: number;
} = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
  return apiFetch<OpportunityList>(`${base}?${query}`);
};
export const getOpportunity = (id: number) => apiFetch<OpportunityDetail>(`${base}/${id}`);
export const getOpportunityComparison = (id: number) => apiFetch<OpportunityComparison>(`${base}/${id}/comparison`);
export const getOpportunityDigest = (includeSynthetic = false) => apiFetch<OpportunityDigest>(`${base}/digest?includeSynthetic=${includeSynthetic}`);

export const importActiveProject = (payload: ImportActiveProjectRequest) =>
  apiFetch<ImportResult>(`${base}/import/active-projects`, { method: 'POST', body: JSON.stringify(payload) });
export const importActiveProjectCsv = (file: File) => {
  const body = new FormData(); body.set('file', file);
  return apiFetch<{ imported: { id: number; title: string; nearDuplicateOfId: number | null }[]; updated: { id: number; title: string }[] }>(
    `${base}/import/active-projects/csv`, { method: 'POST', body });
};
export const importBusinessProspect = (payload: ImportBusinessProspectRequest) =>
  apiFetch<ImportResult>(`${base}/import/business-prospects`, { method: 'POST', body: JSON.stringify(payload) });
export const importBusinessProspectCsv = (file: File) => {
  const body = new FormData(); body.set('file', file);
  return apiFetch<{ imported: { id: number; businessName: string; nearDuplicateOfId: number | null }[]; updated: { id: number; businessName: string }[] }>(
    `${base}/import/business-prospects/csv`, { method: 'POST', body });
};

export const loadOpportunitySamples = () => apiFetch<{ createdCount: number; ids: number[] }>(`${base}/samples`, { method: 'POST' });
export const getRadarProvider = () => apiFetch<RadarProviderStatus>(`${base}/provider`);
export const previewOpportunityEvaluation = (provider: EvaluationProvider, opportunityIds?: number[]) =>
  apiFetch<EvaluationPreview>(`${base}/evaluation-preview`, { method: 'POST', body: JSON.stringify({ opportunityIds, provider }) });
export const evaluateOpportunities = (provider: EvaluationProvider, opportunityIds?: number[], confirmationCode?: string) =>
  apiFetch<{ evaluatedCount: number; failedCount: number; provider: string }>(`${base}/evaluate`, { method: 'POST', body: JSON.stringify({ opportunityIds, provider, confirmationCode }) });
export const updateOpportunityReview = (id: number, decision: ActiveProjectDecision | BusinessProspectDecision | null, notes: string) =>
  apiFetch<void>(`${base}/${id}/review`, { method: 'PATCH', body: JSON.stringify({ decision, notes }) });
export const deleteOpportunity = (id: number) => apiFetch<void>(`${base}/${id}`, { method: 'DELETE' });
export const clearOpportunityDuplicate = (id: number) => apiFetch<void>(`${base}/${id}/duplicate`, { method: 'PATCH' });
export const getRadarPreferences = () => apiFetch<RadarPreferences>(`${base}/preferences`);
export const updateRadarPreferences = (value: Omit<RadarPreferences, 'updatedAt'>) =>
  apiFetch<RadarPreferences>(`${base}/preferences`, { method: 'PUT', body: JSON.stringify(value) });
export const downloadOpportunityExport = (includeSynthetic = false) => apiFetchBlob(`${base}/export?includeSynthetic=${includeSynthetic}`);

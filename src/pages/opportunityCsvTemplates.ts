import type { OpportunityEntityType } from '../api/opportunities.ts';

export interface OpportunityCsvTemplate {
  csv: string;
  filename: string;
  agentPrompt: string;
}

const ACTIVE_PROJECT_HEADER = 'title,description,source_type,source_name,source_url,source_date,external_id,research_confidence,research_confidence_reason,research_agent';
const BUSINESS_PROSPECT_HEADER = 'business_name,evidence,website_url,geography,industry,source_name,source_url,source_date,external_id,prospect_type,research_confidence,research_confidence_reason,research_agent';

const ACTIVE_PROJECT_CSV = `${ACTIVE_PROJECT_HEADER}
"Replace with project title","Replace this row with the full source description, including the requested outcome, scope, budget, timing, and constraints.",ExplicitDemand,"Example source","https://example.com/opportunities/replace-me",2026-09-25T00:00:00Z,"source-system-project-001",High,"The primary source states the scope, budget, and schedule.","Replace with agent name"
`;

const BUSINESS_PROSPECT_CSV = `${BUSINESS_PROSPECT_HEADER}
"Replace with business name","Replace this row with direct, source-backed evidence about the business, observed problem, and a focused first engagement.","https://example.com",Raleigh,"Professional services","Example source","https://example.com/about",2026-09-25T00:00:00Z,"source-system-business-001",OperationalPain,High,"The business website directly supports the supplied evidence.","Replace with agent name"
`;

const ACTIVE_PROJECT_AGENT_PROMPT = `Create an Opportunity Radar Active Project CSV.

Return only raw CSV text. Do not use a Markdown code fence, commentary, instruction rows, or blank rows. Use exactly this header and column order:
${ACTIVE_PROJECT_HEADER}

Replace the example row in the supplied CSV. Produce one row per source record and no more than 100 rows. The finished file must be UTF-8 CSV and no larger than 2 MB.

Field rules:
- title: Required. Use the source's project title, 1 to 200 characters.
- description: Required. Preserve the source-backed request, scope, constraints, budget, and timing when available, 20 to 30,000 characters. Do not invent facts.
- source_type: Required. Use exactly ExplicitDemand for a stated project request or OperationalSignal for observed recurring work or operational pain.
- source_name: Optional. Name the publication, marketplace, organization, or source, up to 200 characters.
- source_url: Optional. Use an absolute http or https URL, up to 1,000 characters.
- source_date: Optional. Use an ISO 8601 date or timestamp, preferably UTC such as 2026-09-25T00:00:00Z.
- external_id: Optional but strongly recommended. Use a stable source-system identifier, up to 200 characters. Reuse it on later research runs so the import updates the existing record instead of creating a duplicate.
- research_confidence: Optional. Use exactly Low, Medium, or High.
- research_confidence_reason: Optional. Briefly explain what supports the confidence level, up to 500 characters.
- research_agent: Optional. Identify the agent or workflow that produced the research, up to 100 characters.

Follow standard CSV quoting. Wrap fields that contain commas, quotes, or line breaks in double quotes, and escape a literal double quote by doubling it. Leave an optional value empty when the source does not support it.`;

const BUSINESS_PROSPECT_AGENT_PROMPT = `Create an Opportunity Radar Business Prospect CSV.

Return only raw CSV text. Do not use a Markdown code fence, commentary, instruction rows, or blank rows. Use exactly this header and column order:
${BUSINESS_PROSPECT_HEADER}

Replace the example row in the supplied CSV. Produce one row per source record and no more than 100 rows. The finished file must be UTF-8 CSV and no larger than 2 MB.

Field rules:
- business_name: Required. Use the business's public name, 1 to 200 characters.
- evidence: Required. Preserve direct, source-backed evidence about the business, observed problem, and plausible focused first engagement, 20 to 30,000 characters. Separate observations from inferences and do not invent facts.
- website_url: Optional. Use the business's absolute http or https URL, up to 1,000 characters.
- geography: Optional. Use a city, region, or service area supported by the source, up to 200 characters.
- industry: Optional. Use a concise industry supported by the source, up to 200 characters.
- source_name: Optional. Name the publication, directory, organization, or source, up to 200 characters.
- source_url: Optional. Use the absolute http or https URL that supports the evidence, up to 1,000 characters.
- source_date: Optional. Use an ISO 8601 date or timestamp, preferably UTC such as 2026-09-25T00:00:00Z.
- external_id: Optional but strongly recommended. Use a stable source-system identifier, up to 200 characters. Reuse it on later research runs so the import updates the existing record instead of creating a duplicate.
- prospect_type: Optional. Use exactly OperationalPain, DigitalPresence, Hybrid, or Unknown. Leave it empty if the evidence does not support a classification.
- research_confidence: Optional. Use exactly Low, Medium, or High.
- research_confidence_reason: Optional. Briefly explain what supports the confidence level, up to 500 characters.
- research_agent: Optional. Identify the agent or workflow that produced the research, up to 100 characters.

Follow standard CSV quoting. Wrap fields that contain commas, quotes, or line breaks in double quotes, and escape a literal double quote by doubling it. Leave an optional value empty when the source does not support it.`;

const TEMPLATES: Record<OpportunityEntityType, OpportunityCsvTemplate> = {
  ActiveProject: {
    csv: ACTIVE_PROJECT_CSV,
    filename: 'opportunity-radar-active-projects-import.csv',
    agentPrompt: ACTIVE_PROJECT_AGENT_PROMPT,
  },
  BusinessProspect: {
    csv: BUSINESS_PROSPECT_CSV,
    filename: 'opportunity-radar-business-prospects-import.csv',
    agentPrompt: BUSINESS_PROSPECT_AGENT_PROMPT,
  },
};

export function getOpportunityCsvTemplate(entityType: OpportunityEntityType): OpportunityCsvTemplate {
  return TEMPLATES[entityType];
}

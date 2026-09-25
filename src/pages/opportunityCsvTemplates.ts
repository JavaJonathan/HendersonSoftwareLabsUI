import type { OpportunityEntityType } from '../api/opportunities.ts';

export interface OpportunityCsvTemplate {
  csv: string;
  filename: string;
  agentPrompt: string;
}

const ACTIVE_PROJECT_HEADER = 'title,description,source_type,source_name,source_url,source_date,external_id,research_confidence,research_confidence_reason,research_agent';
const BUSINESS_PROSPECT_HEADER = 'business_name,evidence,website_url,geography,industry,source_name,source_url,source_date,external_id,prospect_type,research_confidence,research_confidence_reason,research_agent';

const ACTIVE_PROJECT_CSV = `${ACTIVE_PROJECT_HEADER}
"Replace with project title","Replace this row with the full source description, including the requested outcome, scope, budget, timing, and constraints.",ExplicitDemand,"Example source","https://example.com/opportunities/replace-me",2026-09-25,"source-system-project-001",High,"The primary source states the scope, budget, and schedule.","Replace with agent name"
`;

const BUSINESS_PROSPECT_CSV = `${BUSINESS_PROSPECT_HEADER}
"Replace with business name","Replace this row with direct, source-backed evidence about the business, observed problem, and a focused first engagement.","https://example.com",Raleigh,"Professional services","Example source","https://example.com/about",2026-09-25,"source-system-business-001",OperationalPain,High,"The business website directly supports the supplied evidence.","Replace with agent name"
`;

const ACTIVE_PROJECT_AGENT_PROMPT = `Create an Opportunity Radar Active Project CSV.

This file is for explicit software or automation demand only. If a finding only shows an established business's operational pain, manual workflow, hiring for manual work, or a weak digital presence, without a direct, stated request for software or automation help, it belongs in the Business Prospect file instead, not here.

Return only raw CSV text. Do not use a Markdown code fence, commentary, instruction rows, or blank rows. Use exactly this header and column order:
${ACTIVE_PROJECT_HEADER}

Replace the example row in the supplied CSV. Produce one row per distinct project listing, not one row per mirror or repost of the same project, prefer the original listing as the source when one exists, and no more than 100 rows. If no record for this run belongs in this file, do not submit a header-only file, skip this import instead. The finished file must be UTF-8 CSV and no larger than 2 MB.

Field rules:
- title: Required, 1 to 200 characters. Use the source's own project title, do not rewrite it to sound more attractive.
- description: Required, 20 to 30,000 characters. Do not invent facts. Use this labeled structure, in this order, with a blank line between each section so the application reads them as distinct passages:
  - Request: what the buyer explicitly requested.
  - Scope and constraints: required technology, deliverables, integrations, timing, location, or other material constraints.
  - Commercial signals: published budget, rate, project duration, client credibility, payment verification, or buying-intent signals; write "Not published" for important unavailable information rather than leaving it ambiguous.
  - Competition and freshness: posting date or age, proposal or applicant count, and whether the listing remains open, when available; state which material metrics could not be verified.
  - HSL fit: begin with "Analysis:" and give a concise assessment of alignment with Henderson Software Labs' capabilities.
  - Recommended proposal angle: begin with "Recommendation:" and describe a focused opening offer or proposal strategy.
  - Risk/verification: material concerns and anything that should be confirmed before applying.
- source_type: Required. Use exactly ExplicitDemand.
- source_name: Optional. Name the publication, marketplace, organization, or source, up to 200 characters.
- source_url: Optional. Use an absolute http or https URL, up to 1,000 characters.
- source_date: Optional. Use the source's published, posted, or last-updated date when available, as an ISO 8601 date or timestamp; include a precise UTC time only when the source itself publishes one, such as 2026-09-25T14:30:00Z, otherwise use a bare date such as 2026-09-25 rather than inventing a midnight timestamp. Do not substitute the date you accessed, crawled, or researched the page. Leave this field empty when the source provides no date of its own.
- external_id: Required whenever a stable identifier can reasonably be established, up to 200 characters. Prefer the source's own listing ID, project ID, posting ID, or stable article slug. When no source-provided ID exists, construct one deterministically from the source domain and the listing's stable identity, and reuse that exact value on every future run for this same listing even if its details change, so re-importing updates the existing record instead of creating a duplicate. Never derive it from today's date.
- research_confidence: Required. Use exactly Low, Medium, or High. This rates how well the evidence supports the facts, not how attractive the opportunity is for HSL or the likelihood of winning it, a well-matched opportunity can be Low confidence if the public evidence is thin, and a poorly-matched one can be High confidence if the evidence is solid. Normally exclude Low-confidence candidates from this file entirely. Include one only when the potential value is exceptional, research_confidence_reason clearly explains the uncertainty, and it names a practical next step to verify the finding.
  - High: the listing or another strong first-party source directly supports the request and material scope, with any unavailable competition or commercial metrics explicitly identified rather than guessed.
  - Medium: the demand itself is verified, but meaningful details are unavailable, ambiguous, or depend on a reasonable inference.
  - Low: the source is stale, incomplete, indirect, or difficult to verify.
- research_confidence_reason: Required, up to 500 characters. Explain what supports the confidence level; for Low confidence, name a concrete verification step.
- research_agent: Required. Use the exact fixed identifier your own persistent instructions or configuration have assigned to this specific recurring workflow, up to 100 characters, do not invent or vary it per run. If none has been assigned yet, adopt the format "<agent or tool name> - Opportunity Radar v1", record it in that same persistent configuration, and treat it as frozen for this workflow from this point on; advance the version number only when the underlying agent, model, or sourcing process itself materially changes.

Before finishing, check each row: mirrored or reposted listings are consolidated into one record, no listing repeats an external_id already used earlier in this file, every factual claim traces to the source rather than assumption, analysis and recommendations are clearly labeled as such, and every row has a confidence level, a confidence reason, and the research_agent value.

Follow standard CSV quoting. Wrap fields that contain commas, quotes, or line breaks in double quotes, and escape a literal double quote by doubling it. Leave an optional value empty when the source does not support it.`;

const BUSINESS_PROSPECT_AGENT_PROMPT = `Create an Opportunity Radar Business Prospect CSV.

This file is for an established business with an observed operational pain, inefficient manual workflow, hiring signal for manual work, weak digital presence, or similar signal, whether or not the business has stated any intention to buy software. If the source shows a direct, stated request for software or automation help instead, use the Active Project file for that record.

Return only raw CSV text. Do not use a Markdown code fence, commentary, instruction rows, or blank rows. Use exactly this header and column order:
${BUSINESS_PROSPECT_HEADER}

Replace the example row in the supplied CSV. Produce one row per distinct business opportunity, not one row per supporting source, and no more than 100 rows. When multiple sources support the same opportunity, cite the strongest one in source_url and note the other material sources inside evidence. If no record for this run belongs in this file, do not submit a header-only file, skip this import instead. The finished file must be UTF-8 CSV and no larger than 2 MB.

Field rules:
- business_name: Required, 1 to 200 characters. Use the business's current public name.
- evidence: Required, 20 to 30,000 characters. Do not restate the classification here, prospect_type already captures it. Never present an inferred workflow, buyer, financial benefit, or technical solution as a verified fact. Use this labeled structure, in this order, with a blank line between each section so the application reads them as distinct passages:
  - Signal type: the directly observed signal, such as hiring, data entry, invoice processing, a manual form, a customer complaint, disconnected systems, broken functionality, or digital conversion friction.
  - Observed evidence: the specific, source-backed facts, including scale, longevity, reputation, locations, customer traction, job duties, defects, or growth signals when supported.
  - Workflow hypothesis: begin with "Inference:" and explain the specific process that may be inefficient and how it follows from the observed evidence.
  - Potential HSL engagement: begin with "Recommendation:" and describe the smallest realistic first engagement that complements existing systems rather than replacing them.
  - Likely economic value: begin with "Inference:", then a cautious rating of Low, Moderate, or High with the operational reason. Do not claim unverified ROI or treat an employee's full salary as recoverable savings.
  - Likely buyer: begin with "Inference:", then the role most likely to control the workflow, such as owner, general manager, operations manager, office manager, or customer-service manager. Do not invent a person's identity.
  - Risk/verification: what must be confirmed during discovery, such as incumbent vendors, existing systems, integration rights, workflow volume, ownership, contracts, or whether the signal reflects growth rather than inefficiency.
  - Supporting sources: when material evidence comes from a source other than source_url, list its name and absolute URL here.
- website_url: Optional, up to 1,000 characters. Use the business's own official absolute http or https URL, not a directory or social-profile page unless that genuinely is the business's primary public presence.
- geography: Optional. Use a city, region, or service area supported by the source, up to 200 characters.
- industry: Optional. Use a concise industry supported by the source, up to 200 characters.
- source_name: Optional. Name the publication, directory, organization, or source, up to 200 characters.
- source_url: Required whenever a public supporting source exists, up to 1,000 characters. Use the strongest source for the primary opportunity signal, a relevant job listing, workflow page, or customer-feedback page can be stronger than the business homepage.
- source_date: Optional. Use the source's published, posted, or last-updated date when available, as an ISO 8601 date or timestamp; include a precise UTC time only when the source itself publishes one, such as 2026-09-25T14:30:00Z, otherwise use a bare date such as 2026-09-25 rather than inventing a midnight timestamp. Do not substitute the date you accessed, crawled, or researched the page. Leave this field empty when the source provides no date of its own.
- external_id: Required whenever a stable identifier can reasonably be established, up to 200 characters. Prefer the source's own stable identifier (a directory listing ID, posting ID, or article slug). When no source-provided ID exists, construct one deterministically from the business's official website hostname and its normalized name, and reuse that exact value on every future run for this same business even if the evidence, source, or recommended engagement changes, so re-importing updates the existing record instead of creating a duplicate. Never derive it from today's date. If two distinct businesses share one website hostname, such as separate franchise locations, add distinguishing detail to the constructed identifier so they do not collide into a single record.
- prospect_type: Required. Use exactly OperationalPain, DigitalPresence, Hybrid, or Unknown, based only on the supplied evidence, never inferred from industry norms or from a weak website alone. A weak website alone supports DigitalPresence, not OperationalPain or Hybrid. For a record worth including at all, one of the three real classifications should almost always apply.
  - OperationalPain: direct evidence supports a costly, repetitive, software-addressable workflow problem.
  - DigitalPresence: a specific, observable website or digital customer-experience problem, not simply a website that looks old or unattractive.
  - Hybrid: independent evidence supports both an operational workflow opportunity and a digital-presence opportunity.
  - Unknown: you deliberately reviewed the evidence and it qualifies as a prospect, but the evidence cannot distinguish between the three classifications above; for a selective workflow this should be rare.
- research_confidence: Required. Use exactly Low, Medium, or High. This rates how well the evidence supports the facts and classification, not the prospect's value, HSL fit, or likelihood of becoming a customer, a well-matched opportunity can be Low confidence if the public evidence is thin, and a poorly-matched one can be High confidence if the evidence is solid. A High rating can still carry an explicitly labeled inference for the proposed engagement itself, as long as it follows reasonably from the evidence. Normally exclude Low-confidence candidates from this file entirely. Include one only when the potential value is exceptional, research_confidence_reason clearly explains the uncertainty, and it names a practical next step to verify the finding.
  - High: multiple credible sources, or one strong first-party source, directly support the business identity, observed signal, and classification.
  - Medium: the business identity and core observations are supported, but the classification or the proposed engagement depends on a meaningful inference.
  - Low: the source is weak, stale, incomplete, or ambiguous.
- research_confidence_reason: Required, up to 500 characters. Explain what supports the confidence level; for Low confidence, name a concrete verification step.
- research_agent: Required. Use the exact fixed identifier your own persistent instructions or configuration have assigned to this specific recurring workflow, up to 100 characters, do not invent or vary it per run. If none has been assigned yet, adopt the format "<agent or tool name> - Opportunity Radar v1", record it in that same persistent configuration, and treat it as frozen for this workflow from this point on; advance the version number only when the underlying agent, model, or sourcing process itself materially changes.

Before finishing, check each row: sources for the same opportunity are consolidated into one record, no business repeats an external_id already used earlier in this file, every operational claim traces to observed evidence rather than industry assumption, DigitalPresence rows name a specific defect rather than a dated look, Hybrid rows have independent evidence for both halves, and every row has a classification, a confidence level, a confidence reason, and the research_agent value.

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

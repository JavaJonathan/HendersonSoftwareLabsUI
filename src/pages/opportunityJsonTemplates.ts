import type { OpportunityEntityType } from '../api/opportunities.ts';

export interface OpportunityJsonTemplate {
  schema: string;
  schemaFilename: string;
}

const RESEARCH_AGENT_PROPERTY = {
  type: 'string',
  maxLength: 100,
  description: 'The exact fixed identifier your own persistent instructions or configuration have assigned to this specific recurring workflow, do not invent or vary it per run. If none has been assigned yet, adopt the format "<agent or tool name> - Opportunity Radar v1", record it in that same persistent configuration, and treat it as frozen for this workflow from this point on; advance the version number only when the underlying agent, model, or sourcing process itself materially changes.',
};

const CONFIDENCE_REASON_PROPERTY = {
  type: 'string',
  maxLength: 500,
  description: 'What supports the confidence level; for Low, name a concrete verification step.',
};

function dateOrDateTimeProperty(description: string) {
  return {
    oneOf: [
      { type: 'string', format: 'date' },
      { type: 'string', format: 'date-time' },
    ],
    description,
  };
}

const ACTIVE_PROJECT_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Opportunity Radar Active Project import',
  description: 'Use this schema only for explicit software or automation demand: a person or organization directly requesting help. If a finding only shows an established business\'s operational pain, manual workflow, hiring for manual work, or a weak digital presence, with no direct stated request for software or automation help, use the sibling Business Prospect schema instead, not this one. Produce one item per distinct project listing, not one item per mirror or repost of the same project, preferring the original listing as the source when one exists, and no more than 100 items. If nothing from this run belongs here, submit an empty items array rather than guessing, and every fact must trace to a real source, never invent one to fill a field. Before finishing, check: mirrored or reposted listings are consolidated into one item, no item repeats an externalId already used earlier in this file, request contains only verified facts with fit/proposalAngle/risk carrying any analysis, and every item has a confidence level and reason.',
  type: 'object',
  required: ['researchAgent', 'items'],
  additionalProperties: false,
  examples: [{
    researchAgent: 'example-agent - Opportunity Radar v1',
    items: [{
      externalId: 'source-system-project-001',
      title: 'Shopify supplier reconciliation',
      request: 'Reconcile Shopify orders with supplier spreadsheets, flag mismatches, and produce a daily exception report.',
      sourceType: 'ExplicitDemand',
      sourceName: 'Example source',
      sourceUrl: 'https://example.com/opportunities/replace-me',
      sourceDate: '2026-09-25',
      budget: '$8,000 fixed',
      competition: { proposals: '5-10', interviewing: 1, hires: 0 },
      fit: "Strong match for HSL's integration and automation work.",
      proposalAngle: 'Lead with comparable reconciliation work and offer a paid architecture milestone.',
      risk: 'Supplier spreadsheet formats vary by vendor; confirm sample files before scoping.',
      confidence: { level: 'High', reason: 'The listing states scope, budget, and schedule directly.' },
    }],
  }],
  properties: {
    researchAgent: RESEARCH_AGENT_PROPERTY,
    items: {
      type: 'array',
      maxItems: 100,
      items: { $ref: '#/$defs/activeProject' },
    },
  },
  $defs: {
    activeProject: {
      type: 'object',
      required: ['title', 'request', 'sourceType', 'sourceUrl', 'confidence'],
      additionalProperties: false,
      properties: {
        title: {
          type: 'string', minLength: 1, maxLength: 200,
          description: "Use the source's own project title, do not rewrite it to sound more attractive.",
        },
        request: {
          type: 'string', minLength: 20, maxLength: 4000,
          description: 'What the buyer explicitly requested, including required technology, deliverables, integrations, timing, and location. The objective ask only, no analysis, put your own read in fit/proposalAngle/risk instead.',
        },
        sourceType: {
          const: 'ExplicitDemand',
          description: 'Always exactly this value.',
        },
        sourceName: { type: 'string', maxLength: 200, description: 'The publication, marketplace, organization, or source.' },
        sourceUrl: { type: 'string', format: 'uri', maxLength: 1000, description: 'An absolute http or https URL.' },
        sourceDate: dateOrDateTimeProperty(
          'The source\'s own published, posted, or last-updated date or timestamp. A bare date ("2026-09-25") or a precise UTC timestamp ("2026-09-25T14:30:00Z") only when the source itself publishes a time. Never the date you accessed, crawled, or researched the page. Omit when the source has no date of its own.',
        ),
        externalId: {
          type: 'string', maxLength: 200,
          description: "Required whenever a stable identifier can reasonably be established. Prefer the source's own listing ID, project ID, posting ID, or stable article slug. When none exists, construct one deterministically from the source domain and the listing's stable identity, and reuse that exact value on every future run for this same listing even if its details change, so re-importing updates the existing record instead of creating a duplicate. Never derive it from today's date.",
        },
        budget: {
          type: 'string', maxLength: 100,
          description: 'The published budget or rate exactly as stated, such as "$8,000 fixed" or "$60/hr". Omit rather than guessing when no budget is published.',
        },
        competition: {
          type: 'object',
          description: 'Include only the sub-fields the source actually publishes.',
          additionalProperties: false,
          properties: {
            proposals: { type: 'string', maxLength: 100, description: 'A range such as "5-10".' },
            interviewing: { type: 'integer', minimum: 0 },
            hires: { type: 'integer', minimum: 0 },
          },
        },
        fit: {
          type: 'string', maxLength: 1000,
          description: "Your own concise assessment of alignment with Henderson Software Labs' .NET, React, PostgreSQL, and integration/automation capabilities. Analysis, not evidence, never presented as a verified fact.",
        },
        proposalAngle: {
          type: 'string', maxLength: 1000,
          description: 'Your recommended opening offer or proposal strategy. Also analysis, not evidence.',
        },
        risk: {
          type: 'string', maxLength: 1000,
          description: 'Material concerns and anything that should be confirmed before applying.',
        },
        confidence: {
          type: 'object',
          required: ['level', 'reason'],
          additionalProperties: false,
          description: 'Rates how well the evidence supports the facts, not how attractive the opportunity is or the likelihood of winning it: a well-matched opportunity can be Low confidence if the public evidence is thin, and a poorly-matched one can be High confidence if the evidence is solid. Normally exclude Low-confidence candidates from this file entirely; include one only when the potential value is exceptional and reason names a practical next step to verify the finding.',
          properties: {
            level: {
              enum: ['Low', 'Medium', 'High'],
              description: 'High: the listing or another strong first-party source directly supports the request and material scope, with any unavailable competition or commercial metrics explicitly identified rather than guessed. Medium: the demand itself is verified, but meaningful details are unavailable, ambiguous, or depend on a reasonable inference. Low: the source is stale, incomplete, indirect, or difficult to verify.',
            },
            reason: CONFIDENCE_REASON_PROPERTY,
          },
        },
      },
    },
  },
};

const BUSINESS_PROSPECT_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Opportunity Radar Business Prospect import',
  description: 'Use this schema for an established business with an observed operational pain, inefficient manual workflow, hiring signal for manual work, weak digital presence, or similar signal, whether or not the business has stated any intention to buy software. If the source shows a direct, stated request for software or automation help instead, use the sibling Active Project schema for that record. Produce one item per distinct business opportunity, not one item per supporting source; when multiple sources support the same opportunity, add one evidence entry per source rather than merging them or duplicating the item, and no more than 100 items. If nothing from this run belongs here, submit an empty items array rather than guessing. Before finishing, check: sources for the same opportunity are separate evidence entries on one item, no item repeats an externalId already used earlier in this file, every evidence fact traces to observation rather than industry assumption, DigitalPresence items name a specific defect rather than a dated look, Hybrid items have independent evidence for both halves, and every item has a prospectType and a confidence level and reason.',
  type: 'object',
  required: ['researchAgent', 'items'],
  additionalProperties: false,
  examples: [{
    researchAgent: 'example-agent - Opportunity Radar v1',
    items: [{
      externalId: 'source-system-business-001',
      businessName: 'Riverside Family Dental',
      evidence: [
        { fact: 'Established dental practice, well known locally, with loyal customers for over fifteen years.', source: 'https://example.com/about', date: '2026-09-25' },
        { fact: 'The website is outdated, not mobile friendly, and has no online booking system.', source: 'https://example.com/reviews' },
      ],
      websiteUrl: 'https://example.com',
      geography: 'Raleigh',
      industry: 'Healthcare',
      prospectType: 'DigitalPresence',
      fit: 'The practice needs a modern, mobile-friendly site with online booking.',
      entryOffer: 'Prototype a booking-enabled homepage as a fixed-scope first engagement.',
      risk: 'Confirm whether an existing practice-management system already offers booking before proposing a new one.',
      confidence: { level: 'High', reason: 'The business website directly supports the observed weaknesses.' },
    }],
  }],
  properties: {
    researchAgent: RESEARCH_AGENT_PROPERTY,
    items: {
      type: 'array',
      maxItems: 100,
      items: { $ref: '#/$defs/businessProspect' },
    },
  },
  $defs: {
    businessProspect: {
      type: 'object',
      required: ['businessName', 'evidence', 'prospectType', 'confidence'],
      additionalProperties: false,
      properties: {
        businessName: { type: 'string', minLength: 1, maxLength: 200, description: "The business's current public name." },
        evidence: {
          type: 'array', minItems: 1, maxItems: 30,
          description: "Combined fact length across all entries must be 20 to 30,000 characters. Do not restate the prospectType classification here, that belongs in the prospectType field.",
          items: {
            type: 'object',
            required: ['fact', 'source'],
            additionalProperties: false,
            properties: {
              fact: {
                type: 'string', minLength: 1, maxLength: 2000,
                description: 'One directly observed, source-backed statement only, never an inferred workflow, buyer, financial benefit, or technical solution presented as verified.',
              },
              source: {
                type: 'string', maxLength: 1000,
                description: 'An absolute URL, or a plain citation (such as a publication name) when no URL exists.',
              },
              date: dateOrDateTimeProperty(
                "This fact's own published, posted, or last-updated date or timestamp, same rules as an Active Project sourceDate: never the date you accessed or researched the page, omit when the source has none of its own.",
              ),
            },
          },
        },
        websiteUrl: {
          type: 'string', format: 'uri', maxLength: 1000,
          description: "The business's own official absolute URL, not a directory or social-profile page unless that genuinely is the business's primary public presence.",
        },
        geography: { type: 'string', maxLength: 200, description: 'A city, region, or service area supported by the evidence.' },
        industry: {
          type: 'string', maxLength: 200,
          description: 'A concise industry supported by the evidence. Used for hard include/exclude screening, so omit rather than guess when genuinely ambiguous.',
        },
        externalId: {
          type: 'string', maxLength: 200,
          description: "Required whenever a stable identifier can reasonably be established. Prefer the business's own stable identifier (a directory listing ID, posting ID, or article slug). When none exists, construct one deterministically from the business's official website hostname and its normalized name, and reuse that exact value on every future run for this same business even if the evidence, source, or recommended engagement changes, so re-importing updates the existing record instead of creating a duplicate. Never derive it from today's date. If two distinct businesses share one website hostname, such as separate franchise locations, add distinguishing detail so they do not collide into a single record.",
        },
        prospectType: {
          enum: ['OperationalPain', 'DigitalPresence', 'Hybrid', 'Unknown'],
          description: 'Based only on the supplied evidence, never inferred from industry norms or from a weak website alone. OperationalPain: direct evidence supports a costly, repetitive, software-addressable workflow problem. DigitalPresence: a specific, observable website or digital customer-experience problem, not simply a website that looks old or unattractive; a weak website alone supports DigitalPresence, not OperationalPain or Hybrid. Hybrid: independent evidence supports both an operational workflow opportunity and a digital-presence opportunity. Unknown: you deliberately reviewed the evidence and it qualifies as a prospect, but the evidence cannot distinguish between the three real classifications above; for a selective workflow this should be rare.',
        },
        fit: {
          type: 'string', maxLength: 1000,
          description: 'Your own inference of the specific process that may be inefficient and how it follows from the evidence. Analysis, not evidence.',
        },
        entryOffer: {
          type: 'string', maxLength: 1000,
          description: 'The smallest realistic first engagement that complements existing systems rather than replacing them. Also analysis, not evidence.',
        },
        risk: {
          type: 'string', maxLength: 1000,
          description: 'What must be confirmed during discovery, such as incumbent vendors, existing systems, integration rights, workflow volume, ownership, contracts, or whether the signal reflects growth rather than inefficiency.',
        },
        confidence: {
          type: 'object',
          required: ['level', 'reason'],
          additionalProperties: false,
          description: "Rates how well the evidence supports the facts and classification, not the prospect's value, HSL fit, or likelihood of becoming a customer. A High rating can still carry an explicitly labeled inference in fit/entryOffer, as long as it follows reasonably from the evidence. Normally exclude Low-confidence candidates entirely; include one only when the potential value is exceptional and reason names a practical next step to verify the finding.",
          properties: {
            level: {
              enum: ['Low', 'Medium', 'High'],
              description: 'High: multiple credible sources, or one strong first-party source, directly support the business identity, observed signal, and classification. Medium: the business identity and core observations are supported, but the classification or the proposed engagement depends on a meaningful inference. Low: the source is weak, stale, incomplete, or ambiguous.',
            },
            reason: CONFIDENCE_REASON_PROPERTY,
          },
        },
      },
    },
  },
};

const TEMPLATES: Record<OpportunityEntityType, OpportunityJsonTemplate> = {
  ActiveProject: {
    schema: JSON.stringify(ACTIVE_PROJECT_SCHEMA, null, 2),
    schemaFilename: 'opportunity-radar-active-projects.schema.json',
  },
  BusinessProspect: {
    schema: JSON.stringify(BUSINESS_PROSPECT_SCHEMA, null, 2),
    schemaFilename: 'opportunity-radar-business-prospects.schema.json',
  },
};

export function getOpportunityJsonTemplate(entityType: OpportunityEntityType): OpportunityJsonTemplate {
  return TEMPLATES[entityType];
}

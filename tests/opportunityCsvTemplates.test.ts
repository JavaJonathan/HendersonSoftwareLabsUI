import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getOpportunityCsvTemplate } from '../src/pages/opportunityCsvTemplates.ts';

const ACTIVE_HEADER = 'title,description,source_type,source_name,source_url,source_date,external_id,research_confidence,research_confidence_reason,research_agent';
const BUSINESS_HEADER = 'business_name,evidence,website_url,geography,industry,source_name,source_url,source_date,external_id,prospect_type,research_confidence,research_confidence_reason,research_agent';

test('Active Project template is import-ready and documents its constrained values', () => {
  const template = getOpportunityCsvTemplate('ActiveProject');
  const lines = template.csv.trimEnd().split('\n');

  assert.equal(lines[0], ACTIVE_HEADER);
  assert.equal(lines.length, 2);
  assert.match(lines[1], /ExplicitDemand/);
  assert.match(lines[1], /https:\/\/example\.com\/opportunities\/replace-me/);
  assert.match(lines[1], /2026-09-25T00:00:00Z/);
  assert.equal(template.filename, 'opportunity-radar-active-projects-import.csv');
  assert.match(template.agentPrompt, /ExplicitDemand.*OperationalSignal/);
  assert.match(template.agentPrompt, /Low, Medium, or High/);
  assert.match(template.agentPrompt, /20 to 30,000 characters/);
  assert.match(template.agentPrompt, /no more than 100 rows/);
  assert.match(template.agentPrompt, /no larger than 2 MB/);
  assert.match(template.agentPrompt, /updates the existing record/);
  assert.match(template.agentPrompt, /Do not invent facts/);
});

test('Business Prospect template is import-ready and documents its constrained values', () => {
  const template = getOpportunityCsvTemplate('BusinessProspect');
  const lines = template.csv.trimEnd().split('\n');

  assert.equal(lines[0], BUSINESS_HEADER);
  assert.equal(lines.length, 2);
  assert.match(lines[1], /OperationalPain/);
  assert.match(lines[1], /https:\/\/example\.com/);
  assert.match(lines[1], /2026-09-25T00:00:00Z/);
  assert.equal(template.filename, 'opportunity-radar-business-prospects-import.csv');
  assert.match(template.agentPrompt, /OperationalPain, DigitalPresence, Hybrid, or Unknown/);
  assert.match(template.agentPrompt, /Low, Medium, or High/);
  assert.match(template.agentPrompt, /Separate observations from inferences/);
  assert.match(template.agentPrompt, /Return only raw CSV text/);
});

test('CSV templates and agent prompts follow the repository punctuation rule', () => {
  const copy = ['ActiveProject', 'BusinessProspect']
    .map(entityType => getOpportunityCsvTemplate(entityType as 'ActiveProject' | 'BusinessProspect'))
    .map(template => `${template.csv}\n${template.agentPrompt}`)
    .join('\n');

  assert.ok(!/[\u2013\u2014]/u.test(copy), 'house style forbids em and en dashes');
});

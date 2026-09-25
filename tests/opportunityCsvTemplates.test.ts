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
  assert.match(lines[1], /,2026-09-25,/);
  assert.equal(template.filename, 'opportunity-radar-active-projects-import.csv');
  assert.ok(!/OperationalSignal/.test(template.agentPrompt), 'Active Project prompt should not offer OperationalSignal');
  assert.match(template.agentPrompt, /Business Prospect file instead/);
  assert.match(template.agentPrompt, /Low, Medium, or High/);
  assert.match(template.agentPrompt, /not how attractive the opportunity is for HSL/);
  assert.match(template.agentPrompt, /20 to 30,000 characters/);
  assert.match(template.agentPrompt, /no more than 100 rows/);
  assert.match(template.agentPrompt, /no larger than 2 MB/);
  assert.match(template.agentPrompt, /do not submit a header-only file/);
  assert.match(template.agentPrompt, /inventing a midnight timestamp/);
  assert.match(template.agentPrompt, /Never derive it from today's date/);
  assert.match(template.agentPrompt, /updates the existing record/);
  assert.match(template.agentPrompt, /Do not invent facts/);
  assert.match(template.agentPrompt, /mirror or repost of the same project/);
  assert.match(template.agentPrompt, /Do not substitute the date you accessed, crawled, or researched the page/);
  assert.match(template.agentPrompt, /Normally exclude Low-confidence candidates/);
  assert.match(template.agentPrompt, /research_agent: Required/);
  assert.match(template.agentPrompt, /Opportunity Radar v1/);
  assert.match(template.agentPrompt, /prefer the original listing as the source/);
  assert.match(template.agentPrompt, /do not rewrite it to sound more attractive/);
  assert.match(template.agentPrompt, /blank line between each section/);
  assert.match(template.agentPrompt, /begin with "Analysis:" and give a concise assessment/);
  assert.match(template.agentPrompt, /begin with "Recommendation:" and describe a focused opening offer/);
  assert.match(template.agentPrompt, /research_confidence_reason: Required/);
});

test('Business Prospect template is import-ready and documents its constrained values', () => {
  const template = getOpportunityCsvTemplate('BusinessProspect');
  const lines = template.csv.trimEnd().split('\n');

  assert.equal(lines[0], BUSINESS_HEADER);
  assert.equal(lines.length, 2);
  assert.match(lines[1], /OperationalPain/);
  assert.match(lines[1], /https:\/\/example\.com/);
  assert.match(lines[1], /,2026-09-25,/);
  assert.equal(template.filename, 'opportunity-radar-business-prospects-import.csv');
  assert.match(template.agentPrompt, /Active Project file for that record/);
  assert.match(template.agentPrompt, /OperationalPain, DigitalPresence, Hybrid, or Unknown/);
  assert.match(template.agentPrompt, /Low, Medium, or High/);
  assert.match(template.agentPrompt, /not the prospect's value, HSL fit, or likelihood of becoming a customer/);
  assert.match(template.agentPrompt, /Never present an inferred workflow, buyer, financial benefit, or technical solution as a verified fact/);
  assert.match(template.agentPrompt, /Return only raw CSV text/);
  assert.match(template.agentPrompt, /do not submit a header-only file/);
  assert.match(template.agentPrompt, /inventing a midnight timestamp/);
  assert.match(template.agentPrompt, /Never derive it from today's date/);
  assert.match(template.agentPrompt, /not one row per supporting source/);
  assert.match(template.agentPrompt, /Do not substitute the date you accessed, crawled, or researched the page/);
  assert.match(template.agentPrompt, /Normally exclude Low-confidence candidates/);
  assert.match(template.agentPrompt, /research_agent: Required/);
  assert.match(template.agentPrompt, /Opportunity Radar v1/);
  assert.match(template.agentPrompt, /blank line between each section/);
  assert.match(template.agentPrompt, /begin with "Inference:"/);
  assert.match(template.agentPrompt, /begin with "Recommendation:" and describe the smallest realistic first engagement/);
  assert.match(template.agentPrompt, /Supporting sources:/);
  assert.match(template.agentPrompt, /add distinguishing detail to the constructed identifier/);
  assert.match(template.agentPrompt, /source_url: Required whenever a public supporting source exists/);
  assert.match(template.agentPrompt, /prospect_type: Required\./);
  assert.match(template.agentPrompt, /research_confidence_reason: Required/);
});

test('CSV templates and agent prompts follow the repository punctuation rule', () => {
  const copy = ['ActiveProject', 'BusinessProspect']
    .map(entityType => getOpportunityCsvTemplate(entityType as 'ActiveProject' | 'BusinessProspect'))
    .map(template => `${template.csv}\n${template.agentPrompt}`)
    .join('\n');

  assert.ok(!/[\u2013\u2014]/u.test(copy), 'house style forbids em and en dashes');
});

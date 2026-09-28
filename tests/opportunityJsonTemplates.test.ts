import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getOpportunityJsonTemplate } from '../src/pages/opportunityJsonTemplates.ts';

test('Active Project schema carries its own worked example and field rules', () => {
  const template = getOpportunityJsonTemplate('ActiveProject');
  const schema = JSON.parse(template.schema);

  assert.equal(template.schemaFilename, 'opportunity-radar-active-projects.schema.json');
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.deepEqual(schema.required.sort(), ['items', 'researchAgent']);
  assert.equal(schema.additionalProperties, false);

  assert.ok(Array.isArray(schema.examples) && schema.examples.length === 1, 'the schema embeds its own example instance');
  const example = schema.examples[0];
  assert.ok(Array.isArray(example.items) && example.items.length === 1);
  assert.equal(typeof example.researchAgent, 'string');
  const exampleItem = example.items[0];
  assert.equal(exampleItem.sourceType, 'ExplicitDemand');
  assert.equal(exampleItem.confidence.level, 'High');
  assert.equal(exampleItem.opportunityRating, 'High');
  assert.ok(exampleItem.competition && typeof exampleItem.competition === 'object');

  assert.ok(!/OperationalSignal/.test(schema.description), 'Active Project schema should not offer OperationalSignal');
  assert.match(schema.description, /Business Prospect schema instead/);
  assert.match(schema.description, /no more than 100 items/);
  assert.match(schema.description, /empty items array/);
  assert.match(schema.description, /never invent one to fill a field/);
  assert.match(schema.description, /mirror or repost of the same project/);

  const project = schema.$defs.activeProject;
  assert.deepEqual(project.required.sort(), ['confidence', 'opportunityRating', 'request', 'sourceType', 'sourceUrl', 'title']);
  assert.equal(project.additionalProperties, false);
  assert.equal(project.properties.request.minLength, 20);
  assert.equal(project.properties.request.maxLength, 4000);
  assert.match(project.properties.request.description, /objective ask only, no analysis/);
  assert.equal(project.properties.sourceType.const, 'ExplicitDemand');
  assert.match(project.properties.fit.description, /Analysis, not evidence/);
  assert.match(project.properties.externalId.description, /Never derive it from today's date/);
  assert.ok(!project.required.includes('externalId'), 'externalId stays optional');

  // sourceDate must accept a bare date, not only a full date-time.
  assert.deepEqual(
    project.properties.sourceDate.oneOf.map((option: { format: string }) => option.format).sort(),
    ['date', 'date-time'],
  );

  assert.deepEqual(project.properties.competition.additionalProperties, false);
  assert.deepEqual(project.properties.confidence.required.sort(), ['level', 'reason']);
  assert.equal(project.properties.confidence.additionalProperties, false);
  assert.deepEqual(project.properties.confidence.properties.level.enum, ['Low', 'Medium', 'High']);
  assert.match(project.properties.confidence.description, /Normally exclude Low-confidence candidates/);
  assert.match(project.properties.confidence.properties.level.description, /stale, incomplete, indirect, or difficult to verify/);
  assert.deepEqual(project.properties.opportunityRating.enum, ['Low', 'Medium', 'High']);
  assert.match(project.properties.opportunityRating.description, /not how good the opportunity is/);
});

test('Business Prospect schema carries its own worked example and field rules', () => {
  const template = getOpportunityJsonTemplate('BusinessProspect');
  const schema = JSON.parse(template.schema);

  assert.equal(template.schemaFilename, 'opportunity-radar-business-prospects.schema.json');
  assert.deepEqual(schema.required.sort(), ['items', 'researchAgent']);
  assert.equal(schema.additionalProperties, false);

  assert.ok(Array.isArray(schema.examples) && schema.examples.length === 1, 'the schema embeds its own example instance');
  const exampleItem = schema.examples[0].items[0];
  assert.equal(exampleItem.prospectType, 'DigitalPresence');
  assert.equal(exampleItem.opportunityRating, 'Medium');
  assert.ok(Array.isArray(exampleItem.evidence) && exampleItem.evidence.length >= 1);
  assert.equal(exampleItem.evidence[0].source, 'https://example.com/about');
  assert.ok(!('date' in exampleItem.evidence[1]), 'an evidence entry with no known date omits the property rather than using null');

  assert.match(schema.description, /Active Project schema for that record/);
  assert.match(schema.description, /not one item per supporting source/);
  assert.match(schema.description, /empty items array/);

  const prospect = schema.$defs.businessProspect;
  assert.deepEqual(prospect.required.sort(), ['businessName', 'confidence', 'evidence', 'opportunityRating', 'prospectType']);
  assert.equal(prospect.additionalProperties, false);
  assert.ok(!prospect.required.includes('externalId'), 'externalId stays optional');
  assert.equal(prospect.properties.evidence.minItems, 1);
  assert.equal(prospect.properties.evidence.maxItems, 30);
  assert.match(prospect.properties.evidence.description, /20 to 30,000 characters/);
  assert.deepEqual(prospect.properties.evidence.items.required.sort(), ['fact', 'source']);
  assert.equal(prospect.properties.evidence.items.additionalProperties, false);
  assert.match(prospect.properties.evidence.items.properties.fact.description, /never an inferred workflow, buyer, financial benefit, or technical solution presented as verified/);
  assert.deepEqual(
    prospect.properties.evidence.items.properties.date.oneOf.map((option: { format: string }) => option.format).sort(),
    ['date', 'date-time'],
  );
  assert.deepEqual(prospect.properties.prospectType.enum, ['OperationalPain', 'DigitalPresence', 'Hybrid', 'Unknown']);
  assert.match(prospect.properties.prospectType.description, /never inferred from industry norms or from a weak website alone/);
  assert.match(prospect.properties.externalId.description, /add distinguishing detail/);
  assert.deepEqual(prospect.properties.confidence.required.sort(), ['level', 'reason']);
  assert.equal(prospect.properties.confidence.additionalProperties, false);
  assert.match(prospect.properties.confidence.description, /not the prospect's value, HSL fit, or likelihood of becoming a customer/);
  assert.deepEqual(prospect.properties.opportunityRating.enum, ['Low', 'Medium', 'High']);
  assert.match(prospect.properties.opportunityRating.description, /not how good the opportunity is/);
});

test('JSON Schemas follow the repository punctuation rule', () => {
  const copy = ['ActiveProject', 'BusinessProspect']
    .map(entityType => getOpportunityJsonTemplate(entityType as 'ActiveProject' | 'BusinessProspect'))
    .map(template => template.schema)
    .join('\n');

  assert.ok(!/[\u2013\u2014]/u.test(copy), 'house style forbids em and en dashes');
});

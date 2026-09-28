import assert from 'node:assert/strict';
import test from 'node:test';
import type { RadarPreferences } from '../src/api/opportunities.ts';
import { validationError } from '../src/components/opportunities/radarPreferencesModel.ts';

function preferences(): RadarPreferences {
  return {
    activeProject: {
      preferredProjectTypes: [], excludedProjectTypes: [], minimumBudget: 0,
      incompleteInformationTolerance: 'Medium',
      weightsV2: {
        problemClarity: 15, hslDeliveryFit: 15, independentScope: 15,
        economicViability: 15, urgency: 15, buyerReadiness: 15, informationMarketFit: 10,
      },
    },
    businessProspect: {
      preferredIndustries: [], excludedIndustries: [],
      preferredGeographies: [], excludedGeographies: [],
      operationalPainWeights: {
        painEvidence: 15, automationFeasibility: 15, economicLeverage: 15,
        containedEngagement: 15, urgency: 10, hslDeliveryFit: 10,
        buyerAccess: 10, marketAccessFit: 10,
      },
      digitalPresenceWeights: {
        businessStrength: 15, digitalWeakness: 15, reputationMismatch: 15,
        entryProjectStrength: 15, urgency: 10, hslDeliveryFit: 10,
        buyerAccess: 10, marketAccessFit: 10,
      },
    },
    businessProfile: {
      positioning: 'Software studio', businessModel: 'Projects',
      idealCustomerTraits: ['Growing teams'], coreOffers: ['Automation'],
      secondaryOffers: [], capabilities: ['Integrations'], engagementModel: ['Projects'],
      capacityConstraints: ['Small team'], geographicFocus: ['Maryland'],
      priceBands: ['Flexible'], lastReviewedAt: null,
    },
    digestActiveProjectCount: 3, digestBusinessProspectCount: 2,
    updatedAt: '2026-09-28T00:00:00Z',
  };
}

test('valid Radar preferences have no client validation error', () => {
  assert.equal(validationError(preferences()), '');
  assert.equal(validationError(null), '');
});

test('Radar preference errors retain budget, weight, count, and profile priorities', () => {
  const value = preferences();
  value.activeProject.minimumBudget = -1;
  value.businessProspect.digitalPresenceWeights.urgency = 101;
  value.digestActiveProjectCount = 26;
  value.businessProfile.coreOffers = ['  '];
  assert.equal(validationError(value), 'Minimum budget cannot be negative.');
  value.activeProject.minimumBudget = 0;
  assert.equal(validationError(value), 'Each relative weight must be between 0 and 100.');
  value.businessProspect.digitalPresenceWeights.urgency = 10;
  assert.equal(validationError(value), 'Digest counts must stay between 0 and 25.');
  value.digestActiveProjectCount = 3;
  assert.equal(validationError(value), 'Complete every required business profile section before saving.');
});

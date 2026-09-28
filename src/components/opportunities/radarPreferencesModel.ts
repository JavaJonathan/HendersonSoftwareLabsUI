import type { RadarPreferences } from '../../api/opportunities';

export function validationError(preferences: RadarPreferences | null): string {
  if (!preferences) return '';
  if (preferences.activeProject.minimumBudget < 0) return 'Minimum budget cannot be negative.';

  const weights = [
    ...Object.values(preferences.activeProject.weightsV2),
    ...Object.values(preferences.businessProspect.operationalPainWeights),
    ...Object.values(preferences.businessProspect.digitalPresenceWeights),
  ];
  if (weights.some(weight => weight < 0 || weight > 100)) {
    return 'Each relative weight must be between 0 and 100.';
  }
  if (preferences.digestActiveProjectCount < 0 || preferences.digestActiveProjectCount > 25
    || preferences.digestBusinessProspectCount < 0 || preferences.digestBusinessProspectCount > 25) {
    return 'Digest counts must stay between 0 and 25.';
  }

  const profile = preferences.businessProfile;
  const requiredLists = [
    profile.idealCustomerTraits, profile.coreOffers, profile.capabilities,
    profile.engagementModel, profile.capacityConstraints, profile.geographicFocus,
    profile.priceBands,
  ];
  if (!profile.positioning.trim() || !profile.businessModel.trim()
    || requiredLists.some(items => !items.some(item => item.trim()))) {
    return 'Complete every required business profile section before saving.';
  }
  return '';
}


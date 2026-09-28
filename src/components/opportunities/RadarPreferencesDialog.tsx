import { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, FormControl, InputLabel, MenuItem,
  Select, Skeleton, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { RadarDialog as AppDialog } from './RadarDialog';
import { getRadarPreferences, updateRadarPreferences, type RadarPreferences } from '../../api/opportunities';
import { getApiErrorMessage } from '../../api/client';
import { validationError } from './radarPreferencesModel';

const ACTIVE_WEIGHTS = [
  ['problemClarity', 'Problem clarity'],
  ['hslDeliveryFit', 'HSL delivery fit'],
  ['independentScope', 'Independent scope'],
  ['economicViability', 'Economic viability'],
  ['urgency', 'Urgency'],
  ['buyerReadiness', 'Buyer readiness'],
  ['informationMarketFit', 'Information and market fit'],
] as const;

const OPERATIONAL_WEIGHTS = [
  ['painEvidence', 'Pain evidence'],
  ['automationFeasibility', 'Automation feasibility'],
  ['economicLeverage', 'Economic leverage'],
  ['containedEngagement', 'Contained engagement'],
  ['urgency', 'Urgency'],
  ['hslDeliveryFit', 'HSL delivery fit'],
  ['buyerAccess', 'Buyer access'],
  ['marketAccessFit', 'Market and local access'],
] as const;

const DIGITAL_WEIGHTS = [
  ['businessStrength', 'Business strength'],
  ['digitalWeakness', 'Digital weakness'],
  ['reputationMismatch', 'Reputation mismatch'],
  ['entryProjectStrength', 'Entry project'],
  ['urgency', 'Urgency'],
  ['hslDeliveryFit', 'HSL delivery fit'],
  ['buyerAccess', 'Buyer access'],
  ['marketAccessFit', 'Market and local access'],
] as const;

function ChipField({
  label, value, onChange, helperText,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  helperText?: string;
}) {
  return <Autocomplete
    multiple
    freeSolo
    options={[]}
    value={value}
    onChange={(_, next) => onChange(next)}
    renderInput={params => <TextField
      {...params}
      label={label}
      helperText={helperText}
      placeholder={value.length ? '' : 'Type and press Enter'}
    />}
  />;
}

function ProfileListField({ label, value, onChange, helperText }: { label: string; value: string[]; onChange: (value: string[]) => void; helperText?: string }) {
  return <TextField label={label} value={value.join('\n')} onChange={event => onChange(event.target.value.split('\n'))} helperText={helperText ?? 'One item per line.'} multiline minRows={3} fullWidth />;
}

export function PreferencesDialog({
  open, fullScreen, onClose, onSaved,
}: {
  open: boolean;
  fullScreen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<RadarPreferences | null>(null);
  const [section, setSection] = useState<'projects' | 'prospects' | 'profile' | 'digest'>('projects');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setSection('projects');
    getRadarPreferences()
      .then(setValue)
      .catch(() => setError('Unable to load preferences.'));
  }, [open]);

  const validation = validationError(value);

  async function save() {
    if (!value || validation) return;
    const clean = (items: string[]) => items.map(item => item.trim()).filter(Boolean);
    setBusy(true);
    setError('');
    try {
      await updateRadarPreferences({
        activeProject: value.activeProject,
        businessProspect: value.businessProspect,
        businessProfile: {
          ...value.businessProfile,
          idealCustomerTraits: clean(value.businessProfile.idealCustomerTraits),
          coreOffers: clean(value.businessProfile.coreOffers),
          secondaryOffers: clean(value.businessProfile.secondaryOffers),
          capabilities: clean(value.businessProfile.capabilities),
          engagementModel: clean(value.businessProfile.engagementModel),
          capacityConstraints: clean(value.businessProfile.capacityConstraints),
          geographicFocus: clean(value.businessProfile.geographicFocus),
          priceBands: clean(value.businessProfile.priceBands),
        },
        digestActiveProjectCount: value.digestActiveProjectCount,
        digestBusinessProspectCount: value.digestBusinessProspectCount,
      });
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save preferences.'));
    } finally {
      setBusy(false);
    }
  }

  return <AppDialog open={open} fullScreen={fullScreen} title="Opportunity Radar settings" busy={busy} maxWidth="md" onClose={onClose} actions={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={save} disabled={busy || !value || Boolean(validation)}>{busy ? 'Saving...' : 'Save preferences'}</Button></>}>
    <Stack spacing={2.5}>{error && <Alert severity="error">{error}</Alert>}{validation && <Alert severity="warning">{validation}</Alert>}{!value ? !error && <Stack spacing={1}><Skeleton height={48} /><Skeleton height={72} /><Skeleton height={72} /></Stack> : <>
      <Tabs value={section} onChange={(_, next) => setSection(next)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ '& .MuiTab-root': { px: { xs: 1, sm: 2 }, minWidth: 0, fontSize: { xs: 12, sm: 14 } } }}><Tab value="projects" label="Active Projects" /><Tab value="prospects" label="Business Prospects" /><Tab value="profile" label="Business Profile" /><Tab value="digest" label="Digest" /></Tabs>
      {section === 'projects' && <Stack spacing={2.25}>
        <ChipField label="Preferred project types" value={value.activeProject.preferredProjectTypes} onChange={preferredProjectTypes => setValue({ ...value, activeProject: { ...value.activeProject, preferredProjectTypes } })} />
        <ChipField label="Excluded project types" value={value.activeProject.excludedProjectTypes} onChange={excludedProjectTypes => setValue({ ...value, activeProject: { ...value.activeProject, excludedProjectTypes } })} helperText="Hard exclusions." />
        <TextField label="Minimum stated budget" type="number" value={value.activeProject.minimumBudget} onChange={event => setValue({ ...value, activeProject: { ...value.activeProject, minimumBudget: Number(event.target.value) } })} fullWidth />
        <FormControl><InputLabel>Incomplete information tolerance</InputLabel><Select label="Incomplete information tolerance" value={value.activeProject.incompleteInformationTolerance} onChange={event => setValue({ ...value, activeProject: { ...value.activeProject, incompleteInformationTolerance: event.target.value as RadarPreferences['activeProject']['incompleteInformationTolerance'] } })}>{['Low', 'Medium', 'High'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
        <WeightGrid title="Active Project weights" note="Values are relative and normalized to 100. Saving recomposes stored Jev judgments without provider usage." items={ACTIVE_WEIGHTS} values={value.activeProject.weightsV2} onChange={(key, weight) => setValue({ ...value, activeProject: { ...value.activeProject, weightsV2: { ...value.activeProject.weightsV2, [key]: weight } } })} />
      </Stack>}
      {section === 'prospects' && <Stack spacing={2.25}>
        <ChipField label="Preferred industries" value={value.businessProspect.preferredIndustries} onChange={preferredIndustries => setValue({ ...value, businessProspect: { ...value.businessProspect, preferredIndustries } })} />
        <ChipField label="Excluded industries" value={value.businessProspect.excludedIndustries} onChange={excludedIndustries => setValue({ ...value, businessProspect: { ...value.businessProspect, excludedIndustries } })} helperText="Hard exclusions." />
        <ChipField label="Preferred geographies" value={value.businessProspect.preferredGeographies} onChange={preferredGeographies => setValue({ ...value, businessProspect: { ...value.businessProspect, preferredGeographies } })} />
        <ChipField label="Excluded geographies" value={value.businessProspect.excludedGeographies} onChange={excludedGeographies => setValue({ ...value, businessProspect: { ...value.businessProspect, excludedGeographies } })} helperText="Hard exclusions." />
        <WeightGrid title="Operational Pain weights" note="Hybrid prospects use this profile." items={OPERATIONAL_WEIGHTS} values={value.businessProspect.operationalPainWeights} onChange={(key, weight) => setValue({ ...value, businessProspect: { ...value.businessProspect, operationalPainWeights: { ...value.businessProspect.operationalPainWeights, [key]: weight } } })} />
        <WeightGrid title="Digital Presence weights" note="Digital weakness informs entry work but does not add an automatic bonus." items={DIGITAL_WEIGHTS} values={value.businessProspect.digitalPresenceWeights} onChange={(key, weight) => setValue({ ...value, businessProspect: { ...value.businessProspect, digitalPresenceWeights: { ...value.businessProspect.digitalPresenceWeights, [key]: weight } } })} />
        <Alert severity="info">Saving weights recomposes existing Jev results locally and does not spend provider usage.</Alert>
      </Stack>}
      {section === 'profile' && <Stack spacing={2.25}>
        <Alert severity="info">This profile is always part of Jev's request for both lanes. Review it before saving changes, edits mark existing Jev evaluations stale.</Alert>
        <TextField label="Positioning" value={value.businessProfile.positioning} onChange={event => setValue({ ...value, businessProfile: { ...value.businessProfile, positioning: event.target.value } })} multiline minRows={3} fullWidth />
        <TextField label="Business model" value={value.businessProfile.businessModel} onChange={event => setValue({ ...value, businessProfile: { ...value.businessProfile, businessModel: event.target.value } })} multiline minRows={3} fullWidth />
        <ChipField label="Capabilities" value={value.businessProfile.capabilities} onChange={capabilities => setValue({ ...value, businessProfile: { ...value.businessProfile, capabilities } })} helperText="Shared by both Active Projects and Business Prospects." />
        <ProfileListField label="Ideal customer traits" value={value.businessProfile.idealCustomerTraits} onChange={idealCustomerTraits => setValue({ ...value, businessProfile: { ...value.businessProfile, idealCustomerTraits } })} />
        <ProfileListField label="Core offers" value={value.businessProfile.coreOffers} onChange={coreOffers => setValue({ ...value, businessProfile: { ...value.businessProfile, coreOffers } })} />
        <ProfileListField label="Secondary offers" value={value.businessProfile.secondaryOffers} onChange={secondaryOffers => setValue({ ...value, businessProfile: { ...value.businessProfile, secondaryOffers } })} />
        <ProfileListField label="Engagement model" value={value.businessProfile.engagementModel} onChange={engagementModel => setValue({ ...value, businessProfile: { ...value.businessProfile, engagementModel } })} />
        <ProfileListField label="Capacity and scope constraints" value={value.businessProfile.capacityConstraints} onChange={capacityConstraints => setValue({ ...value, businessProfile: { ...value.businessProfile, capacityConstraints } })} />
        <ProfileListField label="Geographic focus" value={value.businessProfile.geographicFocus} onChange={geographicFocus => setValue({ ...value, businessProfile: { ...value.businessProfile, geographicFocus } })} />
        <ProfileListField label="Approved price bands" value={value.businessProfile.priceBands} onChange={priceBands => setValue({ ...value, businessProfile: { ...value.businessProfile, priceBands } })} />
        <TextField label="Last reviewed" type="date" value={value.businessProfile.lastReviewedAt?.slice(0, 10) ?? ''} onChange={event => setValue({ ...value, businessProfile: { ...value.businessProfile, lastReviewedAt: event.target.value ? new Date(`${event.target.value}T12:00:00Z`).toISOString() : null } })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        <Alert severity="warning">The profile helps Jev understand HSL. It does not count as evidence that a buyer has urgency, budget, workflow pain, or economic value.</Alert>
      </Stack>}
      {section === 'digest' && <Stack spacing={2}><Typography sx={{ color: 'text.secondary' }}>Choose the maximum number of clear, unreviewed records shown in each daily view.</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Active projects" type="number" value={value.digestActiveProjectCount} onChange={event => setValue({ ...value, digestActiveProjectCount: Number(event.target.value) })} fullWidth /><TextField label="Business prospects" type="number" value={value.digestBusinessProspectCount} onChange={event => setValue({ ...value, digestBusinessProspectCount: Number(event.target.value) })} fullWidth /></Stack></Stack>}
    </>}</Stack>
  </AppDialog>;
}

function WeightGrid<K extends string>({
  title, note, items, values, onChange,
}: {
  title: string;
  note: string;
  items: readonly (readonly [K, string])[];
  values: Record<K, number>;
  onChange: (key: K, value: number) => void;
}) {
  return <Box>
    <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{note}</Typography>
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: 'minmax(0, 1fr)',
        sm: 'repeat(2, minmax(0, 1fr))',
        md: 'repeat(3, minmax(0, 1fr))',
      },
      gap: 1.5,
      mt: 1.5,
    }}>
      {items.map(([key, label]) => <TextField
        key={key}
        label={label}
        fullWidth
        type="number"
        size="small"
        value={values[key] ?? 0}
        onChange={event => onChange(key, Number(event.target.value))}
        slotProps={{ htmlInput: { min: 0, max: 100 } }}
      />)}
    </Box>
  </Box>;
}

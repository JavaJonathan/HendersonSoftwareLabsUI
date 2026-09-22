import { Tabs, Tab } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const LANES = [
  { path: '/admin/opportunities', label: 'Active Projects' },
  { path: '/admin/opportunities/prospects', label: 'Business Prospects' },
  { path: '/admin/opportunities/digest', label: 'Digest' },
];

export function OpportunityLaneTabs() {
  const { pathname } = useLocation();
  const active = LANES.find(lane => lane.path === pathname)?.path ?? LANES[0].path;
  return (
    <Tabs value={active} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
      {LANES.map(lane => (
        <Tab key={lane.path} value={lane.path} label={lane.label} component={RouterLink} to={lane.path} />
      ))}
    </Tabs>
  );
}

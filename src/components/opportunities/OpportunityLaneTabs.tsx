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
    <Tabs
      value={active}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label="Opportunity Radar views"
      sx={{
        mb: 3,
        minHeight: 46,
        borderBottom: 1,
        borderColor: 'divider',
        '& .MuiTab-root': { minHeight: 46, px: { xs: 1.75, sm: 2.5 }, fontWeight: 700 },
      }}
    >
      {LANES.map(lane => (
        <Tab key={lane.path} value={lane.path} label={lane.label} component={RouterLink} to={lane.path} />
      ))}
    </Tabs>
  );
}

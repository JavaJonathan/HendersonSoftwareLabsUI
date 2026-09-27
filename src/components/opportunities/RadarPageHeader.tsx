import type { ReactNode } from 'react';
import { Box, Chip, Link, Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Link as RouterLink } from 'react-router-dom';

export function RadarPageHeader({
  eyebrow, description, providerLabel, liveAvailable, actions,
}: {
  eyebrow: string;
  description: string;
  providerLabel?: string;
  liveAvailable?: boolean;
  actions?: ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Link
        component={RouterLink}
        to="/admin"
        underline="hover"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 14, fontWeight: 600, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4, borderRadius: 0.5 } }}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back to admin
      </Link>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={3}
        sx={{ mt: 3, justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 auto', width: { xs: '100%', lg: 'auto' } }}>
          <Typography variant="overline" sx={{ display: 'block', color: 'primary.main', lineHeight: 1.5, overflowWrap: 'anywhere' }}>{eyebrow}</Typography>
          <Typography component="h1" variant="h4" sx={{ mt: 1, fontSize: { xs: 30, sm: 36, lg: 40 }, lineHeight: 1.2, overflowWrap: 'anywhere' }}>
            Opportunity Radar
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1, maxWidth: 640, lineHeight: 1.65, overflowWrap: 'anywhere' }}>
            {description}
          </Typography>
          {providerLabel && (
            <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, minWidth: 0 }}>
              <Chip
                size="small"
                icon={<AutoAwesomeIcon />}
                label={providerLabel}
                color={liveAvailable ? 'success' : 'warning'}
                variant="outlined"
                sx={{
                  maxWidth: '100%', height: 'auto', minHeight: 24,
                  '& .MuiChip-icon': { flexShrink: 0 },
                  '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere', py: 0.25, lineHeight: 1.5 },
                }}
              />
            </Stack>
          )}
        </Box>
        {actions && <Box sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0, pt: { lg: 3.25 } }}>{actions}</Box>}
      </Stack>
    </Box>
  );
}

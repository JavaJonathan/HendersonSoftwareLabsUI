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
    <Box sx={{ mb: 2.5 }}>
      <Link
        component={RouterLink}
        to="/admin"
        underline="hover"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 14, fontWeight: 600 }}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 17 }} /> Back to admin
      </Link>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        sx={{ mt: 2.25, justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="primary.main">{eyebrow}</Typography>
          <Typography component="h1" variant="h4" sx={{ mt: 0.25, fontSize: { xs: 30, md: 40 } }}>
            Opportunity Radar
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 690, lineHeight: 1.65 }}>
            {description}
          </Typography>
          {providerLabel && (
            <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.75, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                icon={<AutoAwesomeIcon />}
                label={providerLabel}
                color={liveAvailable ? 'success' : 'warning'}
                variant="outlined"
              />
            </Stack>
          )}
        </Box>
        {actions}
      </Stack>
    </Box>
  );
}

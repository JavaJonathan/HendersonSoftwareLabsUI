import type { ReactNode } from 'react';
import { Box, Tooltip } from '@mui/material';

/** A small tooltipped icon for a boolean signal (provider failure, stale, duplicate, synthetic). Renders nothing when `show` is false. */
export function Flag({ show, label, icon, color }: { show: boolean; label: string; icon: ReactNode; color: string }) {
  if (!show) return null;
  return <Tooltip title={label}><Box sx={{ display: 'inline-flex', color, verticalAlign: 'middle', '& svg': { fontSize: 18 } }}>{icon}</Box></Tooltip>;
}

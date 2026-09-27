import type { ComponentProps } from 'react';
import { AppDialog } from '../common/AppDialog';

/** Radar-only form layout, leaving other authenticated dialogs unchanged. */
export function RadarDialog(props: Omit<ComponentProps<typeof AppDialog>, 'sx'>) {
  return <AppDialog {...props} sx={{
    '& .MuiDialogTitle-root': { p: { xs: 2, sm: 3 }, flexShrink: 0 },
    '& .MuiDialogContent-root': { px: { xs: 2, sm: 3 }, pt: 1, pb: 3, minHeight: 0, overflowY: 'auto', overflowWrap: 'anywhere' },
    '& .MuiDialogActions-root': { p: { xs: 2, sm: 3 }, flexShrink: 0, flexWrap: 'wrap', gap: 1, borderTop: 1, borderColor: 'divider', '& > :not(style) ~ :not(style)': { ml: 0 } },
    '& .MuiDialogActions-root .MuiButton-root': { minHeight: 44, whiteSpace: 'normal', lineHeight: 1.4, minWidth: 0, maxWidth: '100%' },
    '& .MuiFormControl-root': { minWidth: 0 },
    '& .MuiInputLabel-root': { maxWidth: 'calc(100% - 24px)' },
    '& .MuiTypography-root': { overflowWrap: 'anywhere' },
    '& .MuiChip-root': { maxWidth: '100%' },
    '& .MuiChip-label': { overflowWrap: 'anywhere' },
  }} />;
}

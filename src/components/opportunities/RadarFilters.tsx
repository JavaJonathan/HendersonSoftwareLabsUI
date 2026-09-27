import { useId, useState } from 'react';
import { Box, Button, Chip, Collapse, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, TextField, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

export interface RadarFilterField {
  key: string; label: string; value: string; values: string[]; labels?: Record<string, string>;
}
const readable = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, letter => letter.toUpperCase()).replace(/([A-Z][a-z]+) ([A-Z])/g, (_, first: string, last: string) => `${first} ${last.toLowerCase()}`);

export function RadarFilters({ search, query, placeholder, fields, onSearch, onFilter, onClear }: {
  search: string; query: string; placeholder: string; fields: RadarFilterField[];
  onSearch: (value: string) => void; onFilter: (key: string, value: string) => void; onClear: () => void;
}) {
  const id = useId();
  const mobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(false);
  const selected = fields.filter(field => field.value !== 'All');
  const labelFor = (field: RadarFilterField) => field.labels?.[field.value] ?? readable(field.value);
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
    <Stack spacing={2}>
      <TextField fullWidth size="small" placeholder={placeholder} value={search} onChange={event => onSearch(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }, htmlInput: { 'aria-label': 'Search opportunities' } }} />
      {mobile && <Button variant="outlined" startIcon={<TuneRoundedIcon />} endIcon={<ExpandMoreRoundedIcon sx={{ transform: expanded ? 'rotate(180deg)' : undefined }} />} aria-expanded={expanded} aria-controls={`${id}-filters`} onClick={() => setExpanded(value => !value)} sx={{ height: 44, alignSelf: 'flex-start' }}>Filters{selected.length ? ` (${selected.length})` : ''}</Button>}
      <Collapse in={!mobile || expanded} id={`${id}-filters`}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2, pt: 0.5 }}>
          {fields.map(field => <FormControl key={field.key} fullWidth size="small" sx={{ minWidth: 0 }}>
            <InputLabel id={`${id}-${field.key}-label`}>{field.label}</InputLabel>
            <Select labelId={`${id}-${field.key}-label`} id={`${id}-${field.key}`} label={field.label} value={field.value} onChange={event => onFilter(field.key, event.target.value)}>
              {field.values.map(value => <MenuItem key={value} value={value}>{field.labels?.[value] ?? readable(value)}</MenuItem>)}
            </Select>
          </FormControl>)}
        </Box>
      </Collapse>
      {(query || selected.length > 0) && <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }} aria-label="Active filters">
        {query && <Chip label={`Search: ${query}`} onDelete={() => { onSearch(''); onFilter('q', ''); }} size="small" sx={{ maxWidth: '100%', height: 'auto', minHeight: 32, '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere', py: 0.5 } }} />}
        {selected.map(field => <Chip key={field.key} label={`${field.label}: ${labelFor(field)}`} onDelete={() => onFilter(field.key, 'All')} size="small" sx={{ maxWidth: '100%', height: 'auto', minHeight: 32, '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere', py: 0.5 } }} />)}
        <Button size="small" onClick={onClear} sx={{ minHeight: 44 }}>Clear all</Button>
      </Stack>}
    </Stack>
  </Paper>;
}

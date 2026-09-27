import { Box, Container, Stack, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { Reveal } from '../motion/Reveal';

const SIGNALS = [
  'Your team copies the same information between systems.',
  'Important work moves through spreadsheets and email handoffs.',
  'Recurring reports take hours to prepare by hand.',
  'Answering one customer question means searching several tools.',
];

export function WorkflowRecognition() {
  return (
    <Container component="section" aria-labelledby="recognition-heading" maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
      <Reveal>
        <Typography id="recognition-heading" component="h2" variant="h4" sx={{ textAlign: 'center', mb: 3 }}>
          Does this sound like your business?
        </Typography>
        <Box component="ul" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5, m: 0, p: 0, listStyle: 'none' }}>
          {SIGNALS.map(signal => (
            <Stack component="li" key={signal} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <CheckCircleOutlinedIcon sx={{ color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
              <Typography color="text.secondary">{signal}</Typography>
            </Stack>
          ))}
        </Box>
      </Reveal>
    </Container>
  );
}

import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Reveal } from '../motion/Reveal';

const OFFERS = [
  {
    title: 'Production Readiness Audits',
    description: 'Built an application with AI? We assess its readiness for real users and provide prioritized findings and a remediation plan.',
    action: 'Discuss an application audit',
  },
  {
    title: 'Business Websites',
    description: 'For selected projects, we build websites that support customer acquisition and connect to business operations, such as intake, quoting, or scheduling.',
    action: 'Discuss a business website',
  },
];

export function SecondaryOffers() {
  return (
    <Container component="section" aria-labelledby="secondary-offers-heading" maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
      <Reveal>
        <Typography id="secondary-offers-heading" component="h2" variant="h5" sx={{ mb: 3 }}>
          Other ways we can help
        </Typography>
      </Reveal>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {OFFERS.map(offer => (
          <Reveal key={offer.title} fullWidth>
            <Paper variant="outlined" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography component="h3" sx={{ fontWeight: 700 }}>{offer.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, flexGrow: 1 }}>{offer.description}</Typography>
              <Button component={RouterLink} to="/contact" endIcon={<ArrowForwardIcon />} sx={{ textAlign: 'left' }}>{offer.action}</Button>
            </Paper>
          </Reveal>
        ))}
      </Box>
    </Container>
  );
}

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

const STEPS = [
  { title: 'Discover', description: 'We identify the bottlenecks slowing your business down.' },
  { title: 'Build', description: 'We create the right automation, integration, or tool for the job.' },
  { title: 'Support', description: 'We help you launch, refine, and maintain what we build.' },
];

export function HowItWorks() {
  return (
    <Container maxWidth="lg" id="how-it-works" sx={{ py: { xs: 4, md: 5 } }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
          How It Works
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 1 }}>
          A simple process. Real results.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        {STEPS.map((step, index) => (
          <Box key={step.title} sx={{ display: 'contents' }}>
            <Box sx={{ textAlign: 'center', maxWidth: 220 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {index + 1}
              </Box>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{step.title}</Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                {step.description}
              </Typography>
            </Box>

            {index < STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 0,
                  borderTop: '2px dashed',
                  borderColor: '#bfdbfe',
                  mt: '24px',
                  mx: 2,
                  minWidth: 40,
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Container>
  );
}

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

const COLUMNS = [
  {
    title: 'Company',
    links: ['About Us', 'Our Process', 'Careers'],
  },
  {
    title: 'Services',
    links: ['Workflow Automation', 'System Integrations', 'Custom Tools'],
  },
  {
    title: 'Resources',
    links: ['Blog', 'Case Studies', 'FAQs'],
  },
];

export function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#0b1120', color: 'rgba(255,255,255,0.7)' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 6,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr 1fr' },
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
              Henderson Software Labs
            </Typography>
            <Typography variant="body2" sx={{ mt: 1.5, maxWidth: 260, color: 'rgba(255,255,255,0.55)' }}>
              Custom software and automation for small businesses.
            </Typography>
            <Typography variant="caption" sx={{ mt: 3, display: 'block', color: 'rgba(255,255,255,0.4)' }}>
              © {new Date().getFullYear()} Henderson Software Labs. All rights reserved.
            </Typography>
          </Box>

          {COLUMNS.map((column) => (
            <Box key={column.title}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'white' }}>
                {column.title}
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {column.links.map((link) => (
                  <Typography key={link} variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                    {link}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'white' }}>
              Get in Touch
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                hello@hendersonsoftwarelabs.com
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                (614) 555-0124
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                Columbus, Ohio
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

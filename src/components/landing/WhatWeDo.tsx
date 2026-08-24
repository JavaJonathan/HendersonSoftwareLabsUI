import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import { Reveal } from '../motion/Reveal';

const ITEMS = [
  {
    title: 'Workflow Automation',
    description: 'Eliminate repetitive admin work and streamline recurring processes.',
    icon: SettingsOutlinedIcon,
  },
  {
    title: 'System Integrations',
    description: "Connect the tools your business already uses so data flows where it should.",
    icon: ExtensionOutlinedIcon,
  },
  {
    title: 'Custom Internal Tools',
    description: 'Build lightweight software tailored to your operations and team.',
    icon: ViewModuleOutlinedIcon,
  },
];

export function WhatWeDo() {
  return (
    <Container maxWidth="lg" id="what-we-do" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 5 } }}>
      <Reveal>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
            What We Do
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 1 }}>
            Solutions built around how you work.
          </Typography>
        </Box>
      </Reveal>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
        {ITEMS.map(({ title, description, icon: Icon }, index) => (
          <Reveal key={title} delay={index * 0.1}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 18px 34px -14px rgba(15, 23, 42, 0.18)',
                  borderColor: '#bfdbfe',
                },
                '&:hover .what-we-do-icon': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  transform: 'scale(1.08) rotate(-4deg)',
                },
              }}
            >
              <Box
                className="what-we-do-icon"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                  transition: 'transform 0.25s ease, background-color 0.25s ease, color 0.25s ease',
                }}
              >
                <Icon />
              </Box>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{title}</Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                {description}
              </Typography>
            </Paper>
          </Reveal>
        ))}
      </Box>
    </Container>
  );
}

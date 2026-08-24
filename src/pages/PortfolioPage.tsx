import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import WorkOutlinedIcon from '@mui/icons-material/WorkOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import { Footer } from '../components/layout/Footer';
import { Reveal } from '../components/motion/Reveal';
import { GradientBackdrop } from '../components/motion/GradientBackdrop';

const EXPERIENCE = [
  {
    company: 'IQVIA',
    location: 'Frederick, MD',
    title: 'Senior Software Engineer',
    dates: 'July 2019 - Present',
    bullets: [
      'Diagnosed and resolved critical production errors and outages',
      'Designed and implemented automation scripts for the Clinical Trial Process',
      'Leveraged SQL for data handling, verification, and advanced reporting',
      'Utilized BurpSuite to identify application vulnerabilities',
      'Collaborated with Business Analysts on client feature integration',
      'Awarded the Impact Program Reward for resolving a critical client issue',
    ],
  },
  {
    company: 'Freelance',
    location: 'Frederick, MD',
    title: 'Senior Software Engineer',
    dates: 'August 2020 - Present',
    bullets: [
      'Developed automation scripts and applications for a family-owned business',
      'Delivered high-quality software ahead of schedule',
      'Consulted on optimization strategies',
      'Conducted workflow analysis for innovative solutions',
    ],
  },
];

const SKILL_GROUPS = [
  { label: 'Programming Languages', icon: CodeOutlinedIcon, items: ['C#', 'JavaScript', 'SQL'] },
  {
    label: 'Tools & Technologies',
    icon: BuildOutlinedIcon,
    items: ['GitHub', 'Bitbucket', 'MS SQL Server', 'Visual Studio', 'VS Code', 'Postman', 'SourceTree', 'TeamCity', 'Jira', 'Co-Pilot'],
  },
  {
    label: 'Web Technologies',
    icon: LanguageOutlinedIcon,
    items: ['HTML', 'CSS', 'React.js', 'Express.js', 'Puppeteer.js', 'Material UI'],
  },
  { label: 'Database Management', icon: StorageOutlinedIcon, items: ['Database relationships', 'Table design'] },
  { label: 'Other', icon: BugReportOutlinedIcon, items: ['Debugging', 'Root Cause Analysis'] },
  { label: 'Soft Skills', icon: PsychologyOutlinedIcon, items: ['Problem-Solving', 'Critical-Thinking'] },
];

const PROJECTS = [
  {
    title: 'Digital Box',
    description: 'An Express.js/React.js application that digitizes shipping labels.',
    icon: LocalShippingOutlinedIcon,
  },
  {
    title: 'Product Migration Automation',
    description: 'A JavaScript/Puppeteer.js tool that automates migrating products between marketplaces.',
    icon: SyncAltOutlinedIcon,
  },
  {
    title: 'CSV Product Matcher',
    description: 'A C# automation script for comparing and matching records across CSV files.',
    icon: CompareArrowsOutlinedIcon,
  },
];

export function PortfolioPage() {
  return (
    <>
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <GradientBackdrop />

        <Container maxWidth="md" sx={{ pt: { xs: 4, md: 5 }, pb: { xs: 4, md: 5 }, position: 'relative' }}>
          <Reveal>
            <Link
              component={RouterLink}
              to="/"
              underline="none"
              color="text.secondary"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 14, fontWeight: 500, mb: 4 }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              Henderson Software Labs
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '18px',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 28,
                mb: 3,
              }}
            >
              JH
            </Box>
          </Reveal>

          <Reveal delay={0.14}>
            <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 }, color: 'text.primary', lineHeight: 1.1 }}>
              Jonathan Henderson
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 20, fontWeight: 600, color: 'primary.main' }}>
              Senior Software Engineer
            </Typography>
          </Reveal>

          <Reveal delay={0.2}>
            <Typography sx={{ mt: 3, maxWidth: 560, color: 'text.secondary', fontSize: 17 }}>
              Software engineer with 7 years of experience in full-stack development and software
              security within the pharmaceutical industry.
            </Typography>
          </Reveal>

          <Reveal delay={0.28}>
            <Stack direction="row" spacing={2} sx={{ mt: 4, flexWrap: 'wrap' }} useFlexGap>
              <Button
                variant="contained"
                size="large"
                href="mailto:Jonathan.Henderson24@yahoo.com"
                startIcon={<EmailOutlinedIcon />}
              >
                Email Me
              </Button>
              <Button
                variant="outlined"
                size="large"
                color="inherit"
                href="https://linkedin.com/in/javajonathan"
                target="_blank"
                rel="noreferrer"
                startIcon={<LinkedInIcon />}
              >
                LinkedIn
              </Button>
            </Stack>
          </Reveal>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 5 } }}>
        <Reveal>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
            <WorkOutlinedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
              Experience
            </Typography>
          </Stack>
        </Reveal>

        <Stack spacing={3}>
          {EXPERIENCE.map((job, index) => (
            <Reveal key={job.company + job.title} delay={index * 0.1}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3.5,
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 18px 34px -14px rgba(15, 23, 42, 0.16)',
                    borderColor: '#bfdbfe',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{job.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {job.company} · {job.location}
                    </Typography>
                  </Box>
                  <Chip label={job.dates} size="small" sx={{ bgcolor: 'primary.light', color: 'primary.main', fontWeight: 600 }} />
                </Box>

                <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
                  {job.bullets.map((bullet) => (
                    <Typography key={bullet} component="li" variant="body2" sx={{ color: 'text.secondary' }}>
                      {bullet}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            </Reveal>
          ))}
        </Stack>
      </Container>

      <Container maxWidth="md" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 5 } }}>
        <Reveal>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
            <CodeOutlinedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
              Skills
            </Typography>
          </Stack>
        </Reveal>

        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          {SKILL_GROUPS.map(({ label, icon: Icon, items }, index) => (
            <Reveal key={label} delay={index * 0.06}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                  <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
                  <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: 14 }}>{label}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
                  {items.map((item) => (
                    <Chip key={item} label={item} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                  ))}
                </Stack>
              </Paper>
            </Reveal>
          ))}
        </Box>
      </Container>

      <Container maxWidth="md" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 6 } }}>
        <Reveal>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
            <BuildOutlinedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
              Side Projects
            </Typography>
          </Stack>
        </Reveal>

        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
          {PROJECTS.map(({ title, description, icon: Icon }, index) => (
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
                  '&:hover .portfolio-project-icon': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    transform: 'scale(1.08) rotate(-4deg)',
                  },
                }}
              >
                <Box
                  className="portfolio-project-icon"
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

      <Footer />
    </>
  );
}

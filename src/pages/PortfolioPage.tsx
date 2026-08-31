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
import GitHubIcon from '@mui/icons-material/GitHub';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import WorkOutlinedIcon from '@mui/icons-material/WorkOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
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
      'Develop CompleteConsent / eConsent software that helps life-sciences organizations streamline clinical-trial operations',
      'Delivered a bulk site-access provisioning feature (SQL Server, C#/.NET REST API, React) that automated manual staff access management',
      'Designed database schemas and built the API and React UI for enterprise administration — enterprise, user, and group management',
      'Built a secure workflow that packages and archives site-level clinical-trial data into ZIP files with email and Amazon S3 delivery',
      'Designed a REST endpoint integrating an AI service for document parsing, cutting manual data-entry work',
      'Collaborated on an embedded video-conferencing feature for patient-provider communication, and on a secure clinical-trial reporting system',
      'Owned end-to-end feature delivery: design, estimation, implementation, code review, testing, deployment, and production validation',
      'Primary production-support owner — performed root-cause analysis and wrote AWS Lambda remediations that restored disrupted integrations',
      'Mentored two junior engineers and transferred production-support knowledge',
      'Promoted from Engineer I to Engineer II to Senior; received the IQVIA Ovation Award and multiple Impact Program recognitions',
    ],
  },
  {
    company: 'Independent Software Consultant',
    location: 'Frederick, MD',
    title: 'Software Engineer',
    dates: 'August 2020 - Present',
    bullets: [
      'Design and deliver custom software that replaces manual workflows for small-business operations',
      'Built and maintain a production .NET / React / PostgreSQL / AWS document and shipping platform with authentication, PDF processing, reporting, and search',
      'Built a React tool that checks order status across export, inventory, purchase-order, and ShipStation data',
      'Built a C# utility that reconciles and updates product datasets for downstream import',
      'Built multiple JavaScript / Puppeteer scrapers automating repetitive workflows, including marketplace product migration',
    ],
  },
];

const SKILL_GROUPS = [
  {
    label: 'Engineering',
    icon: CodeOutlinedIcon,
    items: ['C#', 'JavaScript', '.NET', 'Entity Framework', 'React', 'REST APIs'],
  },
  {
    label: 'Data',
    icon: StorageOutlinedIcon,
    items: ['SQL Server', 'PostgreSQL', 'Schema Design', 'Stored Procedures'],
  },
  {
    label: 'Cloud & Delivery',
    icon: CloudOutlinedIcon,
    items: ['AWS (S3, Lambda, RDS)', 'TeamCity', 'Octopus Deploy', 'Git', 'GitHub', 'Bitbucket', 'Postman', 'Jira'],
  },
  {
    label: 'Quality & AI Tools',
    icon: BugReportOutlinedIcon,
    items: ['NUnit', 'Jest', 'Unit & Integration Testing', 'Cursor', 'GitHub Copilot', 'Claude'],
  },
];

const RECOGNITION = [
  'IQVIA Ovation Award',
  'Promoted twice in 6 years',
  '3 Impact Program recognitions',
  'Mentored 2 junior engineers',
  '"Exceeds Expectations" reviews, 2020-2025',
];

const PROJECTS = [
  {
    title: 'Bulk Site Access Provisioning',
    description: 'Spreadsheet-driven bulk management of clinical-trial site-staff access, replacing a manual process. Built with SQL Server, C#/.NET, and React.',
    icon: GroupsOutlinedIcon,
  },
  {
    title: 'Secure Site Data Archiving',
    description: 'A workflow that packages site-level clinical-trial data into ZIP archives with email and Amazon S3 delivery.',
    icon: ArchiveOutlinedIcon,
  },
  {
    title: 'AI-Assisted Document Processing',
    description: 'A REST endpoint integrating an AI service to parse documents and cut manual data-entry work.',
    icon: AutoAwesomeOutlinedIcon,
  },
  {
    title: 'Digital Box Platform',
    description: 'A production .NET / React / PostgreSQL / AWS document and shipping platform with auth, PDF processing, reporting, and search.',
    icon: LocalShippingOutlinedIcon,
  },
  {
    title: 'Order Lookup Automation',
    description: 'A React tool that aggregates order status across export, inventory, purchase-order, and ShipStation data.',
    icon: SyncAltOutlinedIcon,
  },
  {
    title: 'Product Data Reconciliation',
    description: 'A C# utility that reconciles and updates product datasets for downstream import.',
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
            <Typography sx={{ mt: 3, maxWidth: 620, color: 'text.secondary', fontSize: 17 }}>
              Senior software engineer with 7+ years delivering regulated clinical-trial software with
              C#/.NET, React, SQL Server, and AWS — full-stack feature delivery, production
              problem-solving, technical design, and team mentorship.
            </Typography>
          </Reveal>

          <Reveal delay={0.28}>
            <Stack direction="row" spacing={2} sx={{ mt: 4, flexWrap: 'wrap' }} useFlexGap>
              <Button
                variant="contained"
                size="large"
                href="mailto:Jonathan.Henderson@HendersonSoftwareLabs.com"
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
              <Button
                variant="outlined"
                size="large"
                color="inherit"
                href="https://github.com/JavaJonathan"
                target="_blank"
                rel="noreferrer"
                startIcon={<GitHubIcon />}
              >
                GitHub
              </Button>
              <Button
                variant="outlined"
                size="large"
                color="inherit"
                component="a"
                href="/resume.pdf"
                download
                startIcon={<DownloadOutlinedIcon />}
              >
                Download Resume
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

      <Container maxWidth="md" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 5 } }}>
        <Reveal>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
            <EmojiEventsOutlinedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
              Recognition
            </Typography>
          </Stack>
        </Reveal>

        <Reveal delay={0.06}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
              {RECOGNITION.map((item) => (
                <Chip key={item} label={item} size="small" sx={{ bgcolor: 'primary.light', color: 'primary.main', fontWeight: 600 }} />
              ))}
            </Stack>
          </Paper>
        </Reveal>
      </Container>

      <Container maxWidth="md" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 6 } }}>
        <Reveal>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
            <BuildOutlinedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
              Selected Work
            </Typography>
          </Stack>
        </Reveal>

        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
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

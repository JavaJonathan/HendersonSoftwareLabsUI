import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { getInquiries } from '../api/inquiries';
import { getClients } from '../api/admin';
import { Reveal } from '../components/motion/Reveal';
import { GradientBackdrop } from '../components/motion/GradientBackdrop';
import { AuthedAppBar } from '../components/layout/AuthedAppBar';
import { CreateClientDialog } from '../components/admin/CreateClientDialog';
import { SURFACE_SUBTLE } from '../theme';
import type { AdminClient } from '../types';

/** Hidden at the widths where the column would push the table into a horizontal scroll. */
const HIDE_BELOW_SM = { display: { xs: 'none', sm: 'table-cell' } };
const HIDE_BELOW_MD = { display: { xs: 'none', md: 'table-cell' } };

/** Rendered by both the skeleton and the loaded table so the two have identical geometry. */
function ClientsTableHead() {
  return (
    <TableHead
      sx={{
        bgcolor: SURFACE_SUBTLE,
        '& th': {
          fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'text.secondary',
          borderBottomColor: 'divider',
        },
      }}
    >
      <TableRow>
        <TableCell>Company</TableCell>
        <TableCell sx={HIDE_BELOW_SM}>Email</TableCell>
        <TableCell sx={HIDE_BELOW_MD}>Contact</TableCell>
        <TableCell align="right">Projects</TableCell>
        <TableCell aria-hidden sx={{ width: { xs: 36, sm: 56 } }} />
      </TableRow>
    </TableHead>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const [newInquiries, setNewInquiries] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    getInquiries().then(data => { if (active) setNewInquiries(data.newCount); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);

  function loadClients() {
    setStatus('loading');
    getClients()
      .then((data) => {
        setClients(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: SURFACE_SUBTLE }}>
      <AuthedAppBar />

      {/* zIndex 0 makes this band its own stacking context. Without it GradientBackdrop's
          z-index:-1 layer paints before the page shell's opaque background and is invisible. */}
      <Box sx={{ position: 'relative', zIndex: 0, overflow: 'hidden', flexGrow: 1 }}>
        <GradientBackdrop variant="light" />

        <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 4, md: 6 }, pb: { xs: 3, md: 4 } }}>
          <Reveal>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <PeopleAltOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1 }}>
                Admin
              </Typography>
            </Stack>
          </Reveal>

          <Reveal delay={0.08}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ color: 'text.primary', fontSize: { xs: 26, md: 34 } }}>
                  Clients
                </Typography>
                <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                  Create client accounts and assign them software.
                </Typography>
              </Box>
              <Button component={RouterLink} to="/admin/inquiries" variant="outlined">Inquiries{newInquiries === null ? '' : ` (${newInquiries} new)`}</Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                New Client
              </Button>
            </Box>
          </Reveal>
        </Container>

        <Container component="main" maxWidth="lg" sx={{ position: 'relative', pt: { xs: 3, md: 4 }, pb: { xs: 6, md: 8 } }}>
          {status === 'loading' && (
            <Reveal y={12} fullWidth>
              <TableContainer
                component={Paper}
                variant="outlined"
                role="status"
                aria-label="Loading clients"
                sx={{
                  borderRadius: 3,
                  '& tbody tr:last-of-type td': { borderBottom: 0 },
                  // Buys the company column back the room the hidden columns used to take,
                  // so an email fits on one line instead of breaking mid-word.
                  '& td, & th': { px: { xs: 1.5, sm: 2 } },
                }}
              >
                <Table>
                  <ClientsTableHead />
                  <TableBody>
                    {[0, 1, 2, 3].map((row) => (
                      <TableRow key={row}>
                        <TableCell>
                          <Skeleton variant="text" width="55%" />
                        </TableCell>
                        <TableCell sx={HIDE_BELOW_SM}>
                          <Skeleton variant="text" width="80%" />
                        </TableCell>
                        <TableCell sx={HIDE_BELOW_MD}>
                          <Skeleton variant="text" width="45%" />
                        </TableCell>
                        <TableCell align="right">
                          <Skeleton variant="text" width={24} sx={{ ml: 'auto' }} />
                        </TableCell>
                        <TableCell sx={{ width: { xs: 36, sm: 56 } }} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Reveal>
          )}

          {status === 'error' && (
            <Reveal y={12} fullWidth>
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                Something went wrong loading clients. Please try again later.
              </Alert>
            </Reveal>
          )}

          {status === 'ready' && clients.length === 0 && (
            <Reveal y={12} fullWidth>
              <Paper variant="outlined" sx={{ p: 6, borderRadius: 3, textAlign: 'center', borderStyle: 'dashed' }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <PeopleAltOutlinedIcon fontSize="large" />
                </Box>
                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>No clients yet</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  Create one and we will generate their password for you.
                </Typography>
              </Paper>
            </Reveal>
          )}

          {status === 'ready' && clients.length > 0 && (
            <Reveal y={12} fullWidth>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  '& tbody tr:last-of-type td': { borderBottom: 0 },
                  // Buys the company column back the room the hidden columns used to take,
                  // so an email fits on one line instead of breaking mid-word.
                  '& td, & th': { px: { xs: 1.5, sm: 2 } },
                }}
              >
                <Table aria-label="Clients">
                  <ClientsTableHead />
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow
                        key={client.id}
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'background-color 0.18s ease',
                          '&:hover': { bgcolor: 'primary.light' },
                          '&:hover .client-row-chevron': { opacity: 1, transform: 'translateX(2px)' },
                        }}
                      >
                        <TableCell>
                          <Link
                            component={RouterLink}
                            to={`/admin/clients/${client.id}`}
                            underline="none"
                            onClick={(event) => event.stopPropagation()}
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              transition: 'color 0.18s ease',
                              '&:hover': { color: 'primary.main' },
                              '&:focus-visible': {
                                outline: 'none',
                                borderRadius: 1,
                                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)',
                              },
                            }}
                          >
                            {client.companyName}
                          </Link>
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.25,
                              color: 'text.secondary',
                              display: { xs: 'block', sm: 'none' },
                              fontSize: 12.5,
                              // An unbreakable address sets this column's min-content width and
                              // would push the table into a horizontal scroll on a phone.
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {client.email}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...HIDE_BELOW_SM, color: 'text.secondary' }}>{client.email}</TableCell>
                        <TableCell sx={{ ...HIDE_BELOW_MD, color: 'text.secondary' }}>
                          {client.contactName ?? '-'}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                            color: client.projectCount === 0 ? 'text.secondary' : 'text.primary',
                          }}
                        >
                          {client.projectCount}
                        </TableCell>
                        <TableCell align="right" sx={{ width: { xs: 36, sm: 56 }, pl: 0 }}>
                          <ChevronRightIcon
                            className="client-row-chevron"
                            sx={{
                              display: 'block',
                              color: 'text.secondary',
                              opacity: 0.4,
                              transition: 'opacity 0.18s ease, transform 0.18s ease',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Reveal>
          )}
        </Container>
      </Box>

      <CreateClientDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={loadClients}
      />
    </Box>
  );
}

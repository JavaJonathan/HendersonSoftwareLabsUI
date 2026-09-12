import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { PaybackChart } from './PaybackChart';
import { formatMoney, formatMonths, formatPercent } from '../../pages/tools/taskCostFormat';
import type { Investment, Projection } from '../../pages/tools/taskCostModel';

/**
 * The payback story: what it costs, when it is square, what it is worth after that.
 *
 * When nothing has been spent yet the panel inverts the question. Instead of an empty chart
 * it says what the saving could justify paying for, which is the number somebody scoping a
 * project actually needs and the one they are least likely to work out themselves.
 */

interface PaybackPanelProps {
  projection: Projection;
  investment: Investment;
  /** Opens the "Cost of the fix" panel in the controls column. */
  onAddCost: () => void;
  /** True when the improved time is slower, which makes payback meaningless. */
  isIncrease: boolean;
}

export function PaybackPanel({ projection, investment, onAddCost, isIncrease }: PaybackPanelProps) {
  const hasSpend = investment.buildCost > 0 || investment.monthlyCost > 0;

  if (isIncrease) return null;

  return (
    <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
        {hasSpend ? 'When does it pay for itself?' : 'What is this worth paying for?'}
      </Typography>

      {!hasSpend ? (
        <Box sx={{ mt: 1.5 }}>
          {projection.twelveMonthBudget === null ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 620 }}>
              There is no saving to pay anything back yet. Set a shorter time after improvement,
              or a higher run rate, and this fills in.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 620 }}>
                Working backwards from the saving rather than forwards from a quote:
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <TrendingUpRoundedIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box sx={{ minWidth: 200, flex: '1 1 240px' }}>
                  <Typography
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                      fontWeight: 800,
                      fontSize: { xs: 28, md: 34 },
                      color: 'primary.dark',
                      lineHeight: 1.1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatMoney(projection.twelveMonthBudget)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                    is what a fix could cost and still pay for itself inside a year.
                  </Typography>
                </Box>
                <Button variant="contained" size="small" onClick={onAddCost}>
                  Add a real cost
                </Button>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary' }}>
                Put in a quote or a build estimate and this becomes a break-even date, a
                projection, and a return on the spend.
              </Typography>
            </>
          )}
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 1.5,
              mt: 2,
            }}
          >
            <PaybackStat
              label="Break-even"
              value={
                projection.breakEvenMonth === null
                  ? 'Not within horizon'
                  : formatMonths(projection.breakEvenMonthExact ?? projection.breakEvenMonth)
              }
              tone={projection.breakEvenMonth === null ? 'warn' : 'good'}
              note={
                projection.breakEvenMonth === null
                  ? `Still behind after ${investment.horizonMonths} months`
                  : 'From the day the work starts'
              }
            />
            <PaybackStat
              label={`Net after ${investment.horizonMonths} months`}
              value={formatMoney(projection.netAtHorizon)}
              tone={projection.netAtHorizon >= 0 ? 'good' : 'warn'}
              note={`${formatMoney(projection.totalBenefit)} recovered, ${formatMoney(
                projection.totalCost,
              )} spent`}
            />
            <PaybackStat
              label="Return on the spend"
              value={projection.roi === null ? 'n/a' : formatPercent(projection.roi)}
              tone={projection.roi !== null && projection.roi >= 0 ? 'good' : 'warn'}
              note="Value recovered against total cost"
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <PaybackChart projection={projection} horizonMonths={investment.horizonMonths} />
          </Box>

          {projection.breakEvenMonth === null && (
            <Typography variant="body2" sx={{ mt: 1.5, color: '#b45309', fontWeight: 600 }}>
              At this cost the task does not earn the money back inside the horizon. Either the
              fix has to be cheaper, or it needs to cover more than this one task.
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
}

function PaybackStat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: 'good' | 'warn';
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontSize: 24,
          fontWeight: 800,
          mt: 0.25,
          lineHeight: 1.15,
          color: tone === 'good' ? '#059669' : '#b45309',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.5 }}>{note}</Typography>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { formatTaskCount, tasksHandled, type LineSnapshot } from './lineModel';

/**
 * The live "tasks handled" figure.
 *
 * Kept in its own component so that re-rendering several times a second touches one number and
 * nothing else on the page. The value is recomputed from the snapshot and the current clock
 * rather than accumulated, so a throttled background tab or a slow frame can never make it
 * drift: it is always whatever the elapsed time says it should be.
 *
 * It is `aria-hidden` on purpose. A live region on a figure that changes this often is a screen
 * reader denial of service; the same number is announced once, on arrival, by the section's
 * status region instead.
 */
export function TaskCounter({
  snapshot,
  active,
  reduce,
}: {
  snapshot: LineSnapshot;
  active: boolean;
  reduce: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;

    // Still advances under reduced motion, just less often. The number climbing is the
    // information here, not decoration, so it should not be switched off entirely.
    const period = reduce ? 1000 : 200;
    const id = window.setInterval(() => setNow(Date.now()), period);
    return () => window.clearInterval(id);
  }, [active, reduce]);

  return (
    <Box component="span" aria-hidden sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {formatTaskCount(tasksHandled(snapshot, now))}
    </Box>
  );
}

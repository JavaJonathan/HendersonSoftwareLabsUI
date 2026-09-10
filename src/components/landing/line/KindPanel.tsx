import { useRef, useState, type KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BoltRounded from '@mui/icons-material/BoltRounded';
import { STATION_KINDS, type StationKind } from './lineModel';
import { STATION_THEME } from './stationTheme';
import { STATION_ICONS } from './stationIcons';

/**
 * The keyboard and screen reader path through the game.
 *
 * The pile itself cannot be the accessible surface: thirty small targets that appear and vanish on
 * their own would be thirty tab stops and a stream of announcements nobody could follow. So the
 * tokens are pointer-only and this is the equivalent, which is a stronger claim than "accessible".
 * One press clears an entire column and credits every task in it, so a keyboard user contributes
 * at the same rate per action as anyone else and can absolutely drive an unlock on their own.
 *
 * A toolbar with roving tabindex, rather than seven separate tab stops, keeps the whole panel to
 * one stop in the page's tab order.
 */

interface Lane {
  kind: StationKind;
  waiting: number;
  automated: boolean;
}

interface KindPanelProps {
  lanes: Lane[];
  totalWaiting: number;
  onClearKind: (kind: StationKind, viaKeyboard: boolean) => void;
  onClearAll: (viaKeyboard: boolean) => void;
}

export function KindPanel({ lanes, totalWaiting, onClearKind, onClearAll }: KindPanelProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const count = lanes.length + 1;

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    if (next === null) return;

    event.preventDefault();
    const wrapped = (next + count) % count;
    setFocusIndex(wrapped);
    refs.current[wrapped]?.focus();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography
          component="span"
          id="line-panel-label"
          sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled', letterSpacing: 0.3, flexShrink: 0 }}
        >
          Clear by hand
        </Typography>

        <Box
          role="toolbar"
          aria-labelledby="line-panel-label"
          aria-orientation="horizontal"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            alignItems: 'center',
          }}
        >
        {lanes.map((lane, index) => {
          const Icon = STATION_ICONS[lane.kind];
          const meta = STATION_KINDS[lane.kind];
          const empty = lane.waiting === 0;

          return (
            <Box
              key={lane.kind}
              component="button"
              type="button"
              ref={(el: HTMLButtonElement | null) => {
                refs.current[index] = el;
              }}
              tabIndex={focusIndex === index ? 0 : -1}
              // aria-disabled rather than disabled: a disabled control drops out of the tab order
              // and explains nothing, where this one stays reachable and says why it is inert.
              aria-disabled={lane.automated || empty}
              aria-label={
                lane.automated
                  ? `${meta.label} is automated. It clears itself.`
                  : `Clear ${meta.label}. ${lane.waiting} ${lane.waiting === 1 ? 'task' : 'tasks'} waiting.`
              }
              onClick={() => {
                setFocusIndex(index);
                if (!lane.automated && !empty) onClearKind(lane.kind, false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (!lane.automated && !empty) onClearKind(lane.kind, true);
                  return;
                }
                handleKeyDown(event, index);
              }}
              sx={{
                px: { xs: 0.75, sm: 1 },
                py: 0.5,
                minHeight: 26,
                borderRadius: 9999,
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: { xs: 0.35, sm: 0.5 },
                cursor: lane.automated || empty ? 'default' : 'pointer',
                border: '1px solid',
                borderColor: lane.automated ? '#e2e8f0' : '#e2e8f0',
                bgcolor: lane.automated ? '#f8fafc' : '#ffffff',
                color: lane.automated ? 'text.disabled' : 'text.secondary',
                opacity: empty && !lane.automated ? 0.5 : 1,
                transition: 'opacity 0.2s ease, border-color 0.2s ease',
                outline: 'none',
                '&:hover': { borderColor: lane.automated || empty ? undefined : 'primary.main' },
                '&:focus-visible': { boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' },
              }}
            >
              <Icon sx={{ fontSize: 13, color: STATION_THEME[lane.kind].ink, opacity: lane.automated ? 0.45 : 1 }} />
              <Typography component="span" sx={{ fontSize: 11, fontWeight: 700 }}>
                {meta.label}
              </Typography>
              {!lane.automated && (
                <Typography
                  component="span"
                  sx={{ fontSize: 10.5, fontWeight: 800, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}
                >
                  {lane.waiting}
                </Typography>
              )}
            </Box>
          );
        })}

        <Box
          component="button"
          type="button"
          ref={(el: HTMLButtonElement | null) => {
            refs.current[lanes.length] = el;
          }}
          tabIndex={focusIndex === lanes.length ? 0 : -1}
          aria-disabled={totalWaiting === 0}
          aria-label={`Clear all ${totalWaiting} waiting ${totalWaiting === 1 ? 'task' : 'tasks'}.`}
          onClick={() => {
            setFocusIndex(lanes.length);
            if (totalWaiting > 0) onClearAll(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (totalWaiting > 0) onClearAll(true);
              return;
            }
            handleKeyDown(event, lanes.length);
          }}
          sx={{
            px: 1.25,
            py: 0.5,
            minHeight: 26,
            borderRadius: 9999,
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            cursor: totalWaiting === 0 ? 'default' : 'pointer',
            border: '1px solid',
            borderColor: 'primary.main',
            bgcolor: totalWaiting === 0 ? '#ffffff' : 'primary.main',
            color: totalWaiting === 0 ? 'text.disabled' : 'primary.contrastText',
            opacity: totalWaiting === 0 ? 0.6 : 1,
            transition: 'background-color 0.2s ease, opacity 0.2s ease',
            outline: 'none',
            '&:focus-visible': { boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' },
          }}
        >
          <BoltRounded sx={{ fontSize: 13 }} />
          <Typography component="span" sx={{ fontSize: 11, fontWeight: 800 }}>
            Clear everything
          </Typography>
        </Box>
        </Box>
      </Box>
    </Box>
  );
}

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AnimatePresence, motion } from 'framer-motion';
import { MOOD_LABELS, type Mood, type StationKind } from './lineModel';
import { NEUTRAL_BORDER, STATION_THEME } from './stationTheme';

/**
 * The activity feed: what just happened on the line, in the spirit of a multiplayer kill feed.
 *
 * This is what replaced the machine character. It does the one thing the character could not do
 * without: it gives a click somewhere to land, as a line of text. And it does the thing the
 * character never really did: it says out loud that other people are here, because "someone
 * cleared 4 Notify" is a shared world stated in four words.
 *
 * The header keeps the status wording ("Swamped", "Keeping up") that the mood chip used to carry.
 * On a plain strip it reads drier and better: a line reporting "Swamped" is wit, a cartoon face
 * reporting it is a mascot. `MOOD_ASIDE` fills the rest of that header row with one emoji and a
 * few words of how it feels ("buried, could use a hand"), the one place this section allows
 * itself a bit of feeling; it is text, not a drawn face, and there is nothing animated about it,
 * so it does not reopen the case against the character.
 *
 * The whole strip is `aria-hidden`. The live region in TheLine already announces the visitor's
 * own clears and every unlock; echoing those here plus a stream of other people's activity would
 * be a screen-reader firehose nobody asked for. This is decorative reinforcement for sighted
 * users only.
 */

export interface FeedRow {
  id: number;
  /** Drives the dot colour. Null for a line with no single subject. */
  kind: StationKind | null;
  text: string;
}

const MOOD_TONE: Record<Mood, string> = {
  calm: '#047857',
  busy: '#b45309',
  swamped: '#c2410c',
};

/**
 * Fills the header row beside the status word, in an emoji and a few words rather than the
 * header's own colour, so it reads as a small aside and not a second, louder status.
 */
const MOOD_ASIDE: Record<Mood, { emoji: string; text: string }> = {
  calm: { emoji: '🙂', text: 'all clear, nothing urgent' },
  busy: { emoji: '😅', text: 'starting to stack up' },
  swamped: { emoji: '😰', text: 'buried, could use a hand' },
};

interface ActivityFeedProps {
  mood: Mood;
  waiting: number;
  rows: FeedRow[];
  reduce: boolean;
}

export function ActivityFeed({ mood, waiting, rows, reduce }: ActivityFeedProps) {
  return (
    <Box
      data-feed
      aria-hidden
      sx={{
        mx: { xs: 1.25, sm: 2 },
        mb: 2,
        px: { xs: 1.5, sm: 2 },
        py: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: NEUTRAL_BORDER,
        bgcolor: '#fbfcfd',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 1,
          pb: 0.75,
          mb: 0.75,
          borderBottom: '1px solid',
          borderColor: '#eef2f7',
        }}
      >
        <Typography
          data-mood={mood}
          sx={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.3, color: MOOD_TONE[mood], flexShrink: 0 }}
        >
          {MOOD_LABELS[mood]}
        </Typography>
        <Typography
          sx={{
            flexGrow: 1,
            minWidth: 0,
            fontSize: 12.5,
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {MOOD_ASIDE[mood].emoji} {MOOD_ASIDE[mood].text}
        </Typography>
        <Typography
          sx={{ flexShrink: 0, fontSize: 11, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}
        >
          {waiting} waiting
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minHeight: 20 }}>
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <Box
              key={row.id}
              data-feed-row
              component={motion.div}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.15 } }}
              transition={{ duration: reduce ? 0 : 0.2, ease: 'easeOut' }}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
            >
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor: row.kind ? STATION_THEME[row.kind].ink : '#94a3b8',
                }}
              />
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.3 }}>
                {row.text}
              </Typography>
            </Box>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
}

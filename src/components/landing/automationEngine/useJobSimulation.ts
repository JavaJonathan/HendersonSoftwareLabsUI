import { useEffect, useReducer, useRef, useState } from 'react';
import type { MotionValue } from 'framer-motion';
import { ENTRY_X, EXIT_X, LANE_DY, RAIL_Y, STAGE_FRACS } from './geometry';

/**
 * The pipeline's living heartbeat. One requestAnimationFrame loop advances a small pool of
 * job tokens along the rail; the dial governs how fast they move, how often they jam, how
 * often something slips, and how big the backlog gets. Positions are written straight to the
 * SVG nodes' `transform` every frame — React only re-renders when a job is added or removed,
 * and the counters sync a few times a second. The loop is fully stopped when the section is
 * off screen, the tab is hidden, or the visitor prefers reduced motion.
 */

export interface Job {
  id: number;
  kindIndex: number;
  /** 0 = just entered, 1 = exited. */
  progress: number;
  /** -1 | 0 | 1 vertical lane around the rail. */
  lane: number;
  status: 'flowing' | 'stuck' | 'done';
  nextStage: number;
  stuckUntil: number;
  errorUntil: number;
  doneAt: number;
  el: SVGGElement | null;
}

export interface SimStats {
  handled: number;
  backlog: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

function fracToStage(p: number) {
  let s = 0;
  while (s < STAGE_FRACS.length && p >= STAGE_FRACS[s]) s += 1;
  return s;
}

function makeJob(id: number, kindIndex: number, progress: number, lane: number): Job {
  return {
    id,
    kindIndex,
    progress,
    lane,
    status: 'flowing',
    nextStage: fracToStage(progress),
    stuckUntil: 0,
    errorUntil: 0,
    doneAt: 0,
    el: null,
  };
}

/** A calm starting frame — a few jobs spread along the pipeline, used while paused. */
function seedJobs(kindCount: number): Job[] {
  return [0.1, 0.32, 0.5, 0.68, 0.86].map((p, k) => makeJob(-1 - k, k % Math.max(1, kindCount), p, (k % 3) - 1));
}

/** So "handled today" doesn't read as an empty system the instant the page loads. */
const seedHandled = () => 40 + Math.floor(Math.random() * 90);

function paramsFor(dial: number) {
  const t = dial / 100;
  return {
    speed: lerp(0.045, 0.32, t), // progress per second
    spawnMs: lerp(1500, 780, t),
    jamChance: lerp(0.62, 0.012, t),
    jamMs: lerp(3200, 240, t),
    errorChance: lerp(0.28, 0, t),
    cap: dial < 30 ? 7 : 15,
  };
}

interface Options {
  dial: MotionValue<number>;
  active: boolean;
  reduce: boolean;
  kindCount: number;
}

export function useJobSimulation({ dial, active, reduce, kindCount }: Options) {
  const running = active && !reduce && kindCount > 0;

  const listRef = useRef<Job[]>(seedJobs(kindCount));
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const statsRef = useRef<SimStats>({ handled: seedHandled(), backlog: 0 });
  const [stats, setStats] = useState<SimStats>(() => ({ ...statsRef.current }));

  const kindCountRef = useRef(kindCount);
  kindCountRef.current = kindCount;
  const firstRun = useRef(true);

  // Re-seed when the preset (kind count) changes so tokens match the new world.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    listRef.current = seedJobs(kindCountRef.current);
    statsRef.current = { handled: seedHandled(), backlog: 0 };
    setStats({ ...statsRef.current });
    bump();
  }, [kindCount]);

  useEffect(() => {
    if (!running) return;

    let raf = 0;
    let alive = true;
    let last = performance.now();
    let nextSpawn = last + 700;
    let lastStatsSync = 0;
    let nextId = 1;

    const step = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const list = listRef.current;
      const p = paramsFor(dial.get());
      let structural = false;

      // spawn / backlog
      if (now >= nextSpawn) {
        nextSpawn = now + p.spawnMs * (0.75 + Math.random() * 0.5);
        if (list.length < p.cap) {
          list.push(makeJob(nextId++, Math.floor(Math.random() * kindCountRef.current), 0, Math.floor(Math.random() * 3) - 1));
          structural = true;
        } else {
          statsRef.current.backlog += 1;
        }
      }

      for (let i = list.length - 1; i >= 0; i -= 1) {
        const job = list[i];

        if (job.status === 'done') {
          if (now - job.doneAt > 420) {
            list.splice(i, 1);
            structural = true;
            if (statsRef.current.backlog > 0 && list.length < p.cap) {
              statsRef.current.backlog -= 1;
              list.push(makeJob(nextId++, Math.floor(Math.random() * kindCountRef.current), 0, Math.floor(Math.random() * 3) - 1));
            }
          }
          continue;
        }

        if (job.status === 'stuck') {
          if (now >= job.stuckUntil) job.status = 'flowing';
          continue;
        }

        job.progress += p.speed * dt;

        // stage crossing
        if (job.nextStage < STAGE_FRACS.length && job.progress >= STAGE_FRACS[job.nextStage]) {
          job.nextStage += 1;
          if (Math.random() < p.jamChance) {
            job.status = 'stuck';
            job.stuckUntil = now + p.jamMs * (0.55 + Math.random() * 0.9);
          }
          if (Math.random() < p.errorChance) {
            job.errorUntil = now + 520;
            job.progress = Math.max(0, job.progress - 0.05);
            job.nextStage = Math.max(0, job.nextStage - 1);
          }
        }

        if (job.progress >= 1) {
          job.progress = 1;
          job.status = 'done';
          job.doneAt = now;
          statsRef.current.handled += 1;
        }
      }

      // write transforms
      for (let i = 0; i < list.length; i += 1) {
        const job = list[i];
        if (!job.el) continue;
        const x = lerp(ENTRY_X, EXIT_X, job.progress);
        const y = RAIL_Y + job.lane * LANE_DY;
        const scale = job.status === 'done' ? 1 + Math.min(1, (now - job.doneAt) / 420) * 0.6 : 1;
        job.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(2)})`);
        job.el.setAttribute('opacity', job.status === 'done' ? String(clamp01(1 - (now - job.doneAt) / 420)) : '1');
        job.el.dataset.state = job.errorUntil > now ? 'error' : job.status;
      }

      if (structural) bump();
      if (now - lastStatsSync > 260) {
        lastStatsSync = now;
        const s = statsRef.current;
        setStats((prev) => (prev.handled === s.handled && prev.backlog === s.backlog ? prev : { ...s }));
      }

      raf = requestAnimationFrame(step);
    };

    const onVisibility = () => {
      if (document.hidden) {
        alive = false;
        cancelAnimationFrame(raf);
      } else if (!alive) {
        alive = true;
        last = performance.now();
        nextSpawn = last + 400;
        raf = requestAnimationFrame(step);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(step);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [running, dial]);

  return { jobs: listRef.current, stats, running };
}

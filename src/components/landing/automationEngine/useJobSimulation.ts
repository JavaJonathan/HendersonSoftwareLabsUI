import { useEffect, useReducer, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import { ENTRY_X, EXIT_X, LANE_DY, RAIL_Y, STAGE_FRACS } from './geometry';

/**
 * The pipeline's living heartbeat. One requestAnimationFrame loop moves a small pool of
 * task cards along the belt - a handful at a time, never a swarm. The dial governs their
 * speed and how often they jam or slip; cards keep a following distance so they queue
 * rather than overlap. Positions are written straight to the SVG nodes every frame; React
 * only re-renders on add/remove. The loop is fully stopped when the section is off screen,
 * the tab is hidden, or reduced motion is on.
 */

export interface Job {
  id: number;
  kindIndex: number;
  /** 0 = just entered, ~1 = exiting. */
  progress: number;
  /** -1 | 1 - the lane above or below the belt. */
  lane: number;
  status: 'flowing' | 'stuck' | 'done';
  nextStage: number;
  stuckUntil: number;
  errorUntil: number;
  doneAt: number;
  el: SVGGElement | null;
}

/** Minimum spacing between two cards in the same lane, in progress units. */
const MIN_GAP = 0.09;
const DONE_MS = 520;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
const randLane = () => (Math.random() < 0.5 ? -1 : 1);

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

/** A calm starting frame - a few cards spread along the belt, used while paused. */
function seedJobs(kindCount: number): Job[] {
  return [0.14, 0.44, 0.74].map((p, k) => makeJob(-1 - k, k % Math.max(1, kindCount), p, k % 2 === 0 ? -1 : 1));
}

function paramsFor(dial: number) {
  const t = dial / 100;
  return {
    speed: lerp(0.05, 0.26, t), // progress per second
    spawnMs: lerp(2800, 1400, t),
    jamChance: lerp(0.5, 0.01, t),
    jamMs: lerp(2600, 220, t),
    errorChance: lerp(0.22, 0, t),
    cap: dial < 30 ? 4 : 6,
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

  const kindCountRef = useRef(kindCount);
  kindCountRef.current = kindCount;
  const firstRun = useRef(true);

  // Re-seed when the preset (kind count) changes so cards match the new world.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    listRef.current = seedJobs(kindCountRef.current);
    bump();
  }, [kindCount]);

  useEffect(() => {
    if (!running) return;

    let raf = 0;
    let alive = true;
    let last = performance.now();
    let nextSpawn = last + 600;
    let nextId = 1;

    const step = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const list = listRef.current;
      const p = paramsFor(dial.get());
      let structural = false;

      if (now >= nextSpawn) {
        nextSpawn = now + p.spawnMs * (0.75 + Math.random() * 0.5);
        const activeCount = list.filter((j) => j.status !== 'done').length;
        if (activeCount < p.cap) {
          list.push(makeJob(nextId++, Math.floor(Math.random() * kindCountRef.current), 0, randLane()));
          structural = true;
        }
      }

      for (let i = list.length - 1; i >= 0; i -= 1) {
        const job = list[i];

        if (job.status === 'done') {
          job.progress += p.speed * dt * 1.15;
          if (now - job.doneAt > DONE_MS || job.progress > 1.25) {
            list.splice(i, 1);
            structural = true;
          }
          continue;
        }

        if (job.status === 'stuck') {
          if (now >= job.stuckUntil) job.status = 'flowing';
          continue;
        }

        job.progress += p.speed * dt;

        // stage crossing - chance to jam or slip
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

        // keep a following distance from the nearest card ahead in the same lane
        let aheadGap = Infinity;
        for (let k = 0; k < list.length; k += 1) {
          const other = list[k];
          if (other === job || other.lane !== job.lane || other.status === 'done') continue;
          const gap = other.progress - job.progress;
          if (gap > 0 && gap < aheadGap) aheadGap = gap;
        }
        if (aheadGap < MIN_GAP) job.progress -= (MIN_GAP - aheadGap) * 0.5;

        if (job.progress >= 1) {
          job.progress = 1;
          job.status = 'done';
          job.doneAt = now;
        }
      }

      for (let i = 0; i < list.length; i += 1) {
        const job = list[i];
        if (!job.el) continue;
        const x = lerp(ENTRY_X, EXIT_X, job.progress);
        const y = RAIL_Y + job.lane * LANE_DY;
        job.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        job.el.setAttribute('opacity', job.status === 'done' ? clamp01(1 - (now - job.doneAt) / DONE_MS).toFixed(2) : '1');
        job.el.dataset.state = job.errorUntil > now ? 'error' : job.status;
      }

      if (structural) bump();
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

  return { jobs: listRef.current };
}

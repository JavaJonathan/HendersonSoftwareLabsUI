import {
  STATION_KIND_ORDER,
  type KindState,
  type LineSnapshot,
  type StationKind,
} from '../components/landing/line/lineModel';

/**
 * Client for the public Line endpoints.
 *
 * These deliberately use plain `fetch` rather than `apiFetch`. `apiFetch` attaches the stored
 * bearer token and calls the unauthorized handler on any 401, which logs the user out: wiring a
 * decorative, anonymous homepage widget into that path means a hiccup on a marketing toy could
 * sign a client out of their portal. That mattered when this made one request per visitor. It
 * matters considerably more now that it polls. Nothing here sends credentials or reads the token.
 *
 * Every failure mode is a thrown error the caller turns into local-only play. The Line must never
 * be able to break the homepage.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

/** Long enough for a cold container, short enough that nobody watches a spinner. */
const TIMEOUT_MS = 6000;

export class LineApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ClearCounts = Partial<Record<StationKind, number>>;

export interface FlushResult {
  snapshot: LineSnapshot;
  /** What the server actually credited, which is what the client reconciles against. */
  accepted: ClearCounts;
}

function requireBaseUrl(): string {
  if (!API_BASE_URL) {
    // Misconfigured build. Treated exactly like an unreachable API: local play, no crash.
    throw new LineApiError(0, 'No API base URL configured.');
  }
  return API_BASE_URL;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  if (body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string') {
    return (body as { message: string }).message;
  }
  return fallback;
}

function toKindState(raw: unknown): KindState {
  const r = (raw ?? {}) as Record<string, unknown>;
  const unlockedAt =
    typeof r.unlockedAt === 'string' && Number.isFinite(Date.parse(r.unlockedAt)) ? r.unlockedAt : null;

  return {
    handCleared: typeof r.handCleared === 'number' && r.handCleared > 0 ? Math.floor(r.handCleared) : 0,
    helpers: typeof r.helpers === 'number' && r.helpers > 0 ? Math.floor(r.helpers) : 0,
    unlockedAt,
  };
}

/**
 * Builds a complete snapshot whatever the server sent. Every kind this build knows about gets an
 * entry, so no rendering path has to guard against a missing key, and a kind a newer server adds
 * is simply ignored rather than breaking the page.
 */
function toSnapshot(raw: unknown, receivedAt: number): LineSnapshot {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawKinds = (r.kinds ?? {}) as Record<string, unknown>;

  const kinds = {} as Record<StationKind, KindState>;
  for (const kind of STATION_KIND_ORDER) {
    kinds[kind] = toKindState(rawKinds[kind]);
  }

  const nextThreshold =
    typeof r.nextThreshold === 'number' && r.nextThreshold > 0 ? Math.floor(r.nextThreshold) : null;

  return {
    kinds,
    totalHandCleared:
      typeof r.totalHandCleared === 'number' && r.totalHandCleared > 0 ? Math.floor(r.totalHandCleared) : 0,
    unlockedCount: STATION_KIND_ORDER.filter((kind) => kinds[kind].unlockedAt !== null).length,
    nextThreshold,
    ticket: typeof r.ticket === 'string' && r.ticket.length > 0 ? r.ticket : null,
    snapshotAt: typeof r.snapshotAt === 'string' ? r.snapshotAt : new Date(receivedAt).toISOString(),
    receivedAt,
  };
}

function toAccepted(raw: unknown): ClearCounts {
  const r = (raw ?? {}) as Record<string, unknown>;
  const accepted: ClearCounts = {};

  for (const kind of STATION_KIND_ORDER) {
    const value = r[kind];
    if (typeof value === 'number' && value > 0) accepted[kind] = Math.floor(value);
  }

  return accepted;
}

/** Body shape shared by the fetch and beacon paths. */
function clearsBody(ticket: string | null, clears: ClearCounts, firstTime: StationKind[]) {
  return { ticket, clears, firstTime };
}

export async function fetchLine(): Promise<LineSnapshot> {
  const base = requireBaseUrl();

  const response = await fetch(`${base}/api/line`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new LineApiError(response.status, await readErrorMessage(response, 'Could not load the line.'));
  }

  // Stamped here rather than taken from the payload, so every later elapsed-time calculation is
  // measured against this machine's own clock. See serverNow() in lineModel.ts.
  const receivedAt = Date.now();
  return toSnapshot(await response.json(), receivedAt);
}

export async function flushClears(
  ticket: string | null,
  clears: ClearCounts,
  firstTime: StationKind[],
): Promise<FlushResult> {
  const base = requireBaseUrl();

  const response = await fetch(`${base}/api/line/clears`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(clearsBody(ticket, clears, firstTime)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new LineApiError(response.status, await readErrorMessage(response, 'Could not send your clears.'));
  }

  const receivedAt = Date.now();
  const payload = await response.json();

  return {
    snapshot: toSnapshot(payload, receivedAt),
    accepted: toAccepted((payload as Record<string, unknown>)?.accepted),
  };
}

/**
 * Last-gasp flush as the page goes away.
 *
 * `sendBeacon` cannot perform a CORS preflight, so a cross-origin beacon has to be CORS-simple or
 * the browser drops it **with no error anywhere**. That means a `text/plain` body and no custom
 * headers, which is exactly why the ticket travels inside the body rather than in one, and why the
 * API reads its request body by hand instead of taking a `[FromBody]` parameter. Local same-origin
 * testing passes either way, so this is the one thing here that has to be checked cross-origin.
 *
 * Fire and forget: the response is opaque, so the caller clears its pending counts optimistically.
 * Losing a beacon costs a handful of clears on a counter in the tens of thousands.
 */
export function beaconClears(
  ticket: string | null,
  clears: ClearCounts,
  firstTime: StationKind[],
): boolean {
  if (!API_BASE_URL || typeof navigator === 'undefined' || !navigator.sendBeacon) return false;

  try {
    const blob = new Blob([JSON.stringify(clearsBody(ticket, clears, firstTime))], {
      type: 'text/plain',
    });
    return navigator.sendBeacon(`${API_BASE_URL}/api/line/clears`, blob);
  } catch {
    return false;
  }
}

/**
 * Text-field parsing and validation for the calculator. Separate from the model so the
 * model only ever sees clean numbers. Each parser returns a value that is always safe to
 * feed the model (an invalid entry falls back sensibly) plus a human error string for the
 * field to display - so bad input is flagged without ever breaking the results.
 */

export interface FieldParse {
  /** Always finite and safe for calculation - the fallback is used when `error` is set. */
  value: number;
  error: string | null;
}

export interface RangeOptions {
  min?: number;
  /** When true, `min` is an exclusive bound (value must be strictly greater). */
  minExclusive?: boolean;
  max?: number;
  /** Treat an empty string as valid, resolving to `emptyValue` (default 0). */
  allowEmpty?: boolean;
  emptyValue?: number;
  /** Value handed to the model when the entry is invalid. Defaults to `emptyValue` or 0. */
  fallback?: number;
}

/** Strip anything that is not a digit or a single decimal point. */
export function sanitizeNumeric(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

export function parseRange(raw: string, opts: RangeOptions): FieldParse {
  const fallback = opts.fallback ?? opts.emptyValue ?? 0;
  const trimmed = raw.trim();

  if (trimmed === '') {
    return opts.allowEmpty
      ? { value: opts.emptyValue ?? 0, error: null }
      : { value: fallback, error: 'Enter a value' };
  }

  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { value: fallback, error: 'Enter a number' };

  if (opts.min !== undefined && (opts.minExclusive ? n <= opts.min : n < opts.min)) {
    return {
      value: fallback,
      error: opts.minExclusive ? `Must be more than ${opts.min}` : `Must be ${opts.min} or more`,
    };
  }
  if (opts.max !== undefined && n > opts.max) {
    return { value: fallback, error: `Must be ${opts.max} or less` };
  }

  return { value: n, error: null };
}

export interface HourlyParse {
  /** True when the field is non-empty (distinguishes a blank cost from an explicit 0). */
  supplied: boolean;
  /** A number only when supplied and valid; `null` otherwise - fed straight to the model. */
  value: number | null;
  error: string | null;
}

export function parseHourly(raw: string): HourlyParse {
  const trimmed = raw.trim();
  if (trimmed === '') return { supplied: false, value: null, error: null };

  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { supplied: true, value: null, error: 'Enter a number' };
  if (n < 0) return { supplied: true, value: null, error: 'Must be 0 or more' };

  return { supplied: true, value: n, error: null };
}

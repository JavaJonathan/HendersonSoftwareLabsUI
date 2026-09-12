import { useEffect, useRef, useState } from 'react';

/**
 * Live pixel width of an element, via `ResizeObserver`.
 *
 * Charts in this project are hand-drawn SVG with a 1:1 user-unit-to-pixel viewBox rather
 * than a fixed viewBox that scales. That costs this hook, and buys labels that stay at a
 * readable size on a phone instead of shrinking with the drawing.
 *
 * `fallback` is used for the first paint and in any environment without ResizeObserver.
 */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

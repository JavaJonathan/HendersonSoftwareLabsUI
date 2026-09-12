import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Live pixel width of an element, via `ResizeObserver`.
 *
 * Charts in this project are hand-drawn SVG with a 1:1 user-unit-to-pixel viewBox rather
 * than a fixed viewBox that scales. That costs this hook, and buys labels that stay at a
 * readable size on a phone instead of shrinking with the drawing.
 *
 * `fallback` is used only in an environment without `ResizeObserver`, never for a real
 * first paint. `ResizeObserver`'s own first callback fires asynchronously, after the
 * browser's first paint, so relying on it alone means that first frame renders at
 * `fallback` regardless of the element's real width, most visibly on a narrow phone: a
 * `PaybackChart` with `fallback=620` briefly rendering 620px wide inside a ~380px-wide
 * card is real horizontal overflow of the whole page for that one frame, and with nothing
 * clamping horizontal scroll back to 0, the page can be left scrolled off-center even
 * after the chart corrects itself down to the right width. `useLayoutEffect` measures the
 * element synchronously, before that first paint, so the first frame a visitor ever sees
 * already has the right number.
 */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measured = element.getBoundingClientRect().width;
    if (measured > 0) setWidth(measured);

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

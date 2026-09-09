import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router keeps the scroll position across client-side navigations, so following a
 * link like the footer's "About the team" from halfway down one page drops you halfway
 * down the next. Reset to the top on every pathname change, but leave in-page `#anchor`
 * navigations (the NavBar's "Services" / "How it works") alone so they still scroll to
 * their section.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

import { useEffect } from 'react';

/**
 * Page-level `<head>` management for a single route.
 *
 * This is a client-rendered SPA, so the shell's static `<title>` is all a crawler sees until
 * the bundle runs. Setting the title, description, canonical and social tags per route is
 * what makes a public tool findable and makes its link unfurl properly when somebody pastes
 * it into Slack. Everything written here is reverted on unmount so no other route inherits it.
 */

interface PageMeta {
  title: string;
  description: string;
  /** Absolute canonical URL, without the query string. */
  canonical?: string;
  /** Serialized JSON-LD to publish for this page. */
  jsonLd?: string;
}

/** Find or create a `<meta>` by name/property, remembering whether we created it. */
function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) {
    const previous = existing.getAttribute('content');
    existing.setAttribute('content', content);
    return () => {
      if (previous === null) existing.removeAttribute('content');
      else existing.setAttribute('content', previous);
    };
  }

  const created = document.createElement('meta');
  created.setAttribute(attr, key);
  created.setAttribute('content', content);
  document.head.appendChild(created);
  return () => created.remove();
}

export function usePageMeta({ title, description, canonical, jsonLd }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const cleanups = [
      upsertMeta('name', 'description', description),
      upsertMeta('property', 'og:title', title),
      upsertMeta('property', 'og:description', description),
      upsertMeta('property', 'og:type', 'website'),
      upsertMeta('name', 'twitter:card', 'summary_large_image'),
      upsertMeta('name', 'twitter:title', title),
      upsertMeta('name', 'twitter:description', description),
    ];

    if (canonical) {
      cleanups.push(upsertMeta('property', 'og:url', canonical));
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = canonical;
      document.head.appendChild(link);
      cleanups.push(() => link.remove());
    }

    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = jsonLd;
      document.head.appendChild(script);
      cleanups.push(() => script.remove());
    }

    return () => {
      document.title = previousTitle;
      for (const cleanup of cleanups) cleanup();
    };
  }, [title, description, canonical, jsonLd]);
}

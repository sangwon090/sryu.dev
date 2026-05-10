import { defaultLocale, locales, type Locale } from './ui';

export { defaultLocale, locales, type Locale };

/**
 * Routing convention:
 *   - Korean: lives under /ko/.   e.g. /ko/posts/foo
 *   - English: lives under /en/.  e.g. /en/posts/foo
 *   - Root /: language-detect redirect to /ko/ or /en/.
 */

/** Extract the locale from a URL pathname. Falls back to defaultLocale. */
export function getLocaleFromPath(pathname: string): Locale {
  const seg = pathname.replace(/^\/+/, '').split('/')[0];
  if (seg === 'en') return 'en';
  if (seg === 'ko') return 'ko';
  return defaultLocale;
}

/** Build a path under the given locale. `path` can start with `/` or not. */
export function localizedPath(locale: Locale, path: string = ''): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `/${locale}/${clean}` : `/${locale}/`;
}

/** Strip the leading locale segment (if present) from a pathname. */
function stripLocale(pathname: string): string {
  const trimmed = pathname.replace(/^\/+/, '');
  const segs = trimmed.split('/');
  if (segs[0] === 'en' || segs[0] === 'ko') {
    return segs.slice(1).join('/');
  }
  return trimmed;
}

/** Translate the current pathname to the equivalent under the target locale. */
export function switchLocalePath(currentPath: string, target: Locale): string {
  const stripped = stripLocale(currentPath);
  return localizedPath(target, stripped);
}

/** Format a Date according to the locale. Stable across SSR. */
export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (locale === 'ko') {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Year-only formatting, stable across SSR. */
export function formatYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return String(d.getUTCFullYear());
}

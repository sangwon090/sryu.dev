import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';
import { localizedPath } from '../i18n/utils';

export type Post = CollectionEntry<'posts'>;

/** Number of posts per page in /posts/ listings. */
export const POSTS_PAGE_SIZE = 12;

/** True in production builds; in dev we surface drafts so authors can preview them. */
const isProd = import.meta.env.PROD;

/** All non-draft (in prod) posts, sorted newest-first. */
export async function getAllPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => {
    return isProd ? data.draft !== true : true;
  });
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** All posts in a given locale, newest-first. */
export async function getPostsByLocale(locale: Locale): Promise<Post[]> {
  const all = await getAllPosts();
  return all.filter((p) => p.data.lang === locale);
}

/**
 * The "post slug" is the part of the entry id with the leading `<lang>/` stripped.
 * Two posts that are translations of each other should share the same post slug.
 */
export function getPostSlug(post: Post): string {
  const id = post.id; // e.g. "en/hello-world" or "ko/hello-world"
  const parts = id.split('/');
  if (parts.length > 1 && (parts[0] === 'en' || parts[0] === 'ko')) {
    return parts.slice(1).join('/');
  }
  return id;
}

/** URL path for a post under its locale's routing convention. */
export function postPath(post: Post): string {
  return localizedPath(post.data.lang, `posts/${getPostSlug(post)}/`);
}

/**
 * Find the corresponding translation of a post in a different locale.
 * Returns undefined if no manual or original counterpart exists.
 */
export async function findTranslation(
  post: Post,
  targetLocale: Locale,
): Promise<Post | undefined> {
  if (post.data.lang === targetLocale) return post;
  const slug = getPostSlug(post);
  const all = await getAllPosts();
  return all.find(
    (p) =>
      p.data.lang === targetLocale &&
      (getPostSlug(p) === slug ||
        p.data.canonicalTranslationOf === slug ||
        post.data.canonicalTranslationOf === getPostSlug(p)),
  );
}

/** Tally tags across a post set. */
export function tagCounts(posts: Post[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const tag of p.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

/** Posts grouped by year (descending). */
export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
  const map = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.data.date.getUTCFullYear();
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(p);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, posts]) => ({ year, posts }));
}

/** Estimated reading time in minutes from raw markdown body. */
export function estimateReadingTime(body: string | undefined, locale: Locale): number {
  if (!body) return 1;
  // Rough WPM: 220 for English; for Korean, count characters at ~500 cpm.
  const wordCount = body.trim().split(/\s+/).length;
  if (locale === 'ko') {
    const chars = body.replace(/\s+/g, '').length;
    return Math.max(1, Math.round(chars / 500));
  }
  return Math.max(1, Math.round(wordCount / 220));
}

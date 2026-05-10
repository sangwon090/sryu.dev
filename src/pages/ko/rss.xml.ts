import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getPostsByLocale, postPath } from '../../utils/posts';
import { t } from '../../i18n/ui';

export const GET: APIRoute = async ({ site }) => {
  const locale = 'ko' as const;
  const posts = await getPostsByLocale(locale);

  return rss({
    title: t(locale, 'site.title'),
    description: t(locale, 'site.subtitle'),
    site: site ?? 'https://blog.sryu.dev',
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.description,
      link: postPath(p),
      categories: p.data.tags,
    })),
    customData: `<language>ko-KR</language>`,
  });
};

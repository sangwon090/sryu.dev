import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),

  /** Language of the post content. */
  lang: z.enum(['en', 'ko']),

  /** Original language of the source article (if translated). */
  originalLang: z.enum(['en', 'ko']).optional(),

  /**
   * - original: the canonical version
   * - manual:   manually translated by a human
   * - machine:  machine-translated, not yet reviewed
   */
  translationType: z.enum(['original', 'manual', 'machine']).default('original'),

  /**
   * Slug of the source post this is a translation of. Used to link
   * translated versions back to their original.
   */
  canonicalTranslationOf: z.string().optional(),

  draft: z.boolean().default(false),
  featured: z.boolean().default(false),

  /** Optional series this post belongs to. */
  series: z.string().optional(),

  /** When false, the utterances comments section is not rendered. */
  comments: z.boolean().default(true),

  /**
   * Pin this post's comments to an existing GitHub issue number. Used for
   * legacy posts whose comments live on the old blog's issue tracker. When
   * unset, utterances auto-creates an issue keyed by URL pathname.
   */
  commentsIssue: z.number().int().positive().optional(),

  /** Free-form citations or references. */
  citations: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url().optional(),
        author: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .optional(),
});

/**
 * Posts live under `src/content/posts/<lang>/<slug>.{md,mdx}`.
 * The first path segment is treated as the language hint, but the
 * authoritative language is the `lang` frontmatter field.
 */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: postSchema,
});

export const collections = { posts };
export type PostFrontmatter = z.infer<typeof postSchema>;

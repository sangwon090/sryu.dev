# blog.sryu.dev

Personal technical blog. Built with [Astro](https://astro.build/).

## Run locally

Requires Node 20+ and pnpm.

```sh
pnpm install
pnpm dev      # dev server at http://localhost:4321
pnpm build    # static build + Pagefind indexing → dist/
pnpm preview  # serve the built site
```

## Layout

```
src/
  components/      # UI: header, footer, ToC, theme toggle, …
  content/posts/   # Articles, organized by language
    en/<slug>.md   # English posts
    ko/<slug>.md   # Korean posts
  i18n/            # UI strings + locale helpers
  layouts/         # BaseLayout, ArticleLayout
  pages/[lang]/    # Per-locale routes (en, ko)
  styles/          # tokens.css (design tokens), fonts.css, global.css
  utils/           # Post helpers, ToC builder
public/            # Static assets (favicon, …)
```

## Authoring a post

Create `src/content/posts/<lang>/<slug>.md`:

```yaml
---
title: 'Post title'
description: 'One-line description used in lists.'
date: 2026-05-10
tags: ['systems', 'linux']
series: 'Runtime Notes'  # optional
lang: en                 # 'en' | 'ko'
translationType: original # 'original' | 'manual' | 'machine'
originalLang: en         # only when this is a translation
canonicalTranslationOf: post-slug  # only for translations
draft: false
featured: false
citations:
  - title: 'Some reference'
    url: 'https://example.com'
---

Content goes here. Markdown + (optionally) `.mdx`.
```

Two posts that are translations of each other should share the same
file slug under their respective `<lang>/` folders. The article page
auto-detects the counterpart and links it from the language switcher.

Machine-translated posts:
- get a visible notice at the top of the article,
- are emitted with `<meta name="robots" content="noindex,follow">`,
- still appear in lists, marked with a quiet badge.

## Theming

CSS variables live in `src/styles/tokens.css`. The dark theme is
defined in `[data-theme='dark']`. An inline script in `<head>` reads
`localStorage['theme']` and applies `data-theme` before paint to
prevent flicker.

The theme toggle writes back to `localStorage` and flips the
attribute. The CSS `@media (prefers-color-scheme: dark)` block kicks
in only when the user hasn't manually chosen.

## Search

Powered by [Pagefind](https://pagefind.app/). The search index is
generated as a post-build step (`pnpm build` runs `pagefind --site
dist`). The static search page at `/<lang>/search/` lazy-loads the
client and filters by `lang`.

In `pnpm dev`, the index is missing — that's expected. Run a full
`pnpm build && pnpm preview` to test search.

## Deployment

A GitHub Actions workflow at `.github/workflows/deploy.yml` builds
on every push to `main` and publishes to GitHub Pages.

To deploy under a custom domain (e.g. `blog.sryu.dev`):
1. In repo settings → Pages, set the custom domain.
2. Add a `CNAME` file to `public/` with the bare domain.
3. Update `site` in `astro.config.mjs` if it differs.

If deploying to `<user>.github.io/<repo>/` instead of a custom
domain, set `base: '/<repo>/'` in `astro.config.mjs`.

## Design notes

- Article width: 42rem (`--width-prose`).
- Sidebar ToC kicks in at ≥ 1100px viewport; below that it collapses
  into an inline `<details>`.
- Code blocks use Shiki with `github-light` / `github-dark-dimmed`.
- Math via `remark-math` + `rehype-katex`. KaTeX CSS is imported in
  `BaseLayout`.
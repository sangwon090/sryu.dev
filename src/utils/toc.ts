import type { MarkdownHeading } from 'astro';

export interface TocItem {
  depth: number;
  text: string;
  slug: string;
  children: TocItem[];
}

/**
 * Build a nested ToC tree from Astro's flat heading list.
 * Includes h2 and h3 by default — h1 is the article title and is omitted.
 */
export function buildToc(
  headings: MarkdownHeading[],
  { minDepth = 2, maxDepth = 3 } = {},
): TocItem[] {
  const filtered = headings.filter((h) => h.depth >= minDepth && h.depth <= maxDepth);
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const h of filtered) {
    const node: TocItem = { depth: h.depth, text: h.text, slug: h.slug, children: [] };
    while (stack.length && stack[stack.length - 1].depth >= h.depth) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  }

  return root;
}

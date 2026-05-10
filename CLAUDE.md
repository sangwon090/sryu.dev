You are a senior frontend engineer and design systems specialist.

Design and implement a personal technical blog using Astro.js. The blog should feel minimal, text-first, serious, and handcrafted. It must not look like a generic AI-generated template, startup landing page, Notion clone, portfolio template, or over-designed personal brand site.

The target audience is general software developers and security researchers. The blog should support long-form technical writing about systems, infrastructure, security, AI runtimes, compilers, debugging, and engineering notes.

Core design direction:
- Text-first and article-first.
- Minimal, quiet, and content-centered.
- No glassmorphism, neumorphism, heavy gradients, flashy cards, terminal gimmicks, or cyberpunk styling.
- No excessive animation. Use only fast, subtle, functional transitions.
- The site should feel like a carefully maintained personal technical library, not a marketing website.
- The reading experience is more important than visual decoration.

Technology:
- Use Astro.js.
- Prefer static site generation so the blog can be deployed to GitHub Pages or similar static hosting.
- Avoid SSR unless there is a strong reason.
- Use additional libraries only when they are genuinely necessary.
- Ask before introducing large UI frameworks or heavy dependencies.
- Tailwind CSS is acceptable if it helps maintain a consistent design system.
- The final architecture should be simple, maintainable, and suitable for a personal technical blog.

Theme:
- Support both light and dark mode.
- Follow the user’s system theme by default.
- Provide a manual theme toggle.
- Prevent flash of incorrect theme on initial page load.
- Persist manual theme choice.
- Use an inline early theme script in the document head if needed to avoid theme flicker.

Color system:
- Light mode background should be warm ivory / slightly yellowish, similar to Claude’s warm paper-like background.
- Dark mode background should be a deep neutral gray, not pure black and not bright gray.
- Use a restrained muted amber / warm ochre accent color.
- Accent color should be used sparingly for links, focus states, active navigation, subtle borders, and citations.
- Avoid saturated colors.
- Avoid colorful decorative gradients.
- Code blocks should have a restrained VS Code dark-like appearance, but not overly high-contrast or flashy.

Typography:
- Headings should use a serif typeface.
- Primary heading font: MaruBuri.
- Body text should use a sans-serif typeface.
- Primary body font: Pretendard.
- Code should use a monospace typeface.
- Primary code font: Fira Code.
- Provide robust fallbacks:
  - headings: MaruBuri, ui-serif, Georgia, Cambria, serif
  - body: Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
  - code: "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
- The body reading density should be medium: not too airy, not cramped.
- Optimize for long-form technical reading.
- Korean and English text must both render beautifully.
- Use appropriate line-height, paragraph spacing, heading rhythm, and max-width for readability.

Layout:
- Article-first information architecture.
- The homepage should prioritize recent writing, not visual hero sections.
- Avoid large marketing-style hero blocks.
- A small intro line is acceptable, but it should be quiet and literary rather than promotional.
- Suggested top-level navigation:
  - Home
  - Posts
  - Notes or Archive
  - Tags
  - About
  - Language switcher
  - Theme toggle
- The post list should show title, date, language, tags, and short description.
- If there are too many posts on the main page, use pagination.
- Support tag pages and archive pages.
- Avoid excessive metadata noise.

Article page:
- The article page is the most important page.
- Use a comfortable reading width.
- Include title, subtitle or description, date, updated date if available, tags, language/translation status, reading time, and citations if present.
- Include a table of contents.
- On desktop, the ToC should be subtly placed on the right side as a sticky sidebar.
- On mobile, the ToC should collapse into a compact expandable section near the top of the article.
- The ToC must not dominate the reading experience.
- Support footnotes and citations.
- Support mathematical notation.
- Mermaid diagrams are not required for now.
- Code playgrounds are not required.
- Code blocks should support syntax highlighting, filename labels if available, and copy buttons.
- Keep code block styling restrained and readable.

Multilingual support:
- Support English and Korean.
- The main language is English.
- If a Korean visitor enters the site, redirect or route them to the Korean version when appropriate.
- Use `/en` and `/ko` route prefixes or an equally clear language structure.
- Each post may exist in:
  1. English original only
  2. Korean original only
  3. Both English and Korean manually written versions
  4. One original version plus a machine-translated version
- The UI must clearly indicate whether the current article is original, manually translated, or machine-translated.
- If only one language exists, show the machine-translated version for the other language, but clearly label it.
- Do not hide the original language version.
- Provide language switching per article when available.
- Do not make the multilingual system complicated for the author to maintain.

Search:
- Add static search if possible.
- Prefer Pagefind or another lightweight static-search solution.
- Search should work without a server.
- Search UI should be simple: a search page or command-like overlay is acceptable, but avoid terminal aesthetics.
- Search results should show title, excerpt, tags, date, and language.

Content model:
- Use Markdown or MDX for posts.
- Frontmatter should support:
  - title
  - description
  - date
  - updated
  - tags
  - lang
  - originalLang
  - translationType: original | manual | machine
  - canonicalTranslationOf
  - draft
  - featured
  - series
  - citations
- The content model should be easy to maintain manually.
- Avoid over-engineering.

Accessibility:
- Fully keyboard navigable.
- Visible focus states.
- Good contrast in both themes.
- Respect prefers-reduced-motion.
- Semantic HTML.
- Proper heading hierarchy.
- Good screen reader labels for theme toggle, language switcher, search, and navigation.

Performance:
- Static-first.
- Fast initial load.
- Avoid large client-side JavaScript.
- Avoid unnecessary animation libraries.
- Optimize fonts and prevent layout shift.
- Use font-display strategy carefully.
- Avoid theme flicker.
- Keep CSS small and maintainable.

Design details:
- Use subtle borders rather than heavy shadows.
- Cards, if used, should be very quiet.
- Corners should be slightly rounded or almost square.
- Do not use large pill-shaped UI everywhere.
- Links should be recognizable but not loud.
- Blockquotes should feel editorial, not decorative.
- Citations should be clear and elegant.
- Tables should be readable on mobile.
- Inline code should be distinct but subtle.
- Avoid emoji-heavy UI.

Pages to implement:
1. Home page
   - Quiet introduction
   - Recent posts
   - Selected tags or topics
   - Pagination if needed
2. Posts page
   - Paginated list of all posts
   - Filter or tag navigation if simple
3. Article page
   - Long-form reading layout
   - ToC
   - Math support
   - Citations / footnotes
   - Code blocks
   - Translation status
4. Tags page
5. Search page
6. About page
7. 404 page

Avoid:
- Startup marketing design
- Large gradient hero sections
- Fake AI-generated copy
- Overly rounded SaaS UI
- Notion-like templates
- Terminal-themed gimmicks
- Heavy animation
- Glassmorphism
- Cyberpunk styling
- Generic blog template appearance
- Excessive icons
- Decorative clutter

Deliverables:
- Propose the project structure.
- Propose the design token system for colors, spacing, typography, borders, and motion.
- Implement the Astro components and layouts.
- Include theme initialization logic that prevents flicker.
- Include multilingual routing strategy.
- Include Markdown/MDX content schema.
- Include example posts in both English and Korean.
- Include static search integration plan.
- Include deployment notes for GitHub Pages.
- Explain any additional dependency before using it.
- Keep the code clean, small, and maintainable.

Before implementation, briefly state the design assumptions you made. Then proceed with the implementation.

Branding and identity:
- The blog title should be `sryu.dev`.
- Use the subtitle: `Notes on software engineering, compilers and cybersecurity.`
- The site should feel like a personal engineering journal and technical library.
- Avoid using a generic title such as `Sangwon's Blog` as the primary brand.
- `blog.sryu.dev` may be used as a deployment domain, but not as the visible site title unless necessary.

Post list design:
- Article lists do not need to be extremely compact.
- Each article list item should show:
  - title
  - year or full date
  - manually written one-line description
  - tags
  - optional series
  - language or translation status if relevant
- Do not auto-generate previews from article content.
- The one-line description should come from frontmatter.
- The list should feel calm and browsable, not dense or feed-like.
- If there are many posts, use pagination.

Series and tags:
- Support both series and tags.
- Tags are for topic-based discovery.
- Series are for intentional sequences of related posts.
- A post may belong to zero or one series.
- A post may have multiple tags.
- Series examples:
  - Runtime Notes
  - Security Notes
  - Compiler Notes
  - AI Systems Notes
  - Debugging Notes
- Tags should remain lightweight and flexible.
- Provide series pages only if the implementation stays simple.
- Tag pages are required.
- Series should not replace tags.

Machine translation notice:
- Machine-translated articles must show a subtle but visible notice near the top of the article.
- The notice should not look alarming, but it must be clear.
- English notice text:
  `This article was machine-translated from the original version. Technical terms or nuances may be inaccurate.`
- Korean notice text:
  `이 글은 원문을 기계 번역한 버전입니다. 기술 용어나 뉘앙스가 부정확할 수 있습니다.`
- Include a link to the original version when available.
- Style the notice using restrained borders and muted accent colors.
- Prefer `noindex, follow` for machine-translated pages until they are manually reviewed.

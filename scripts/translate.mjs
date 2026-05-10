#!/usr/bin/env node
/**
 * Machine-translate a blog post between Korean and English using Claude.
 *
 * Usage:
 *   pnpm translate <slug>                 # auto-detect source, translate to opposite locale
 *   pnpm translate <slug> --to=en         # explicit target locale
 *   pnpm translate <slug> --force         # overwrite existing target file
 *   pnpm translate <slug> --model=<id>    # override the model (default: claude-sonnet-4-6)
 *
 * Requires ANTHROPIC_API_KEY in the environment.
 *
 * Behaviour:
 *   - Reads src/content/posts/<source>/<slug>.md
 *   - Translates title, description, and body via Claude (one API call each)
 *   - Writes src/content/posts/<target>/<slug>.md with the translation and
 *     these frontmatter changes:
 *       lang                      → <target>
 *       originalLang              → <source>
 *       translationType           → 'machine'
 *       canonicalTranslationOf    → <slug>
 *       commentsIssue             → removed (translated post gets its own thread)
 *   - Other frontmatter fields (date, tags, series, draft, featured, citations)
 *     are carried over verbatim.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'src/content/posts');

const SUPPORTED = ['en', 'ko'];
const LANG_NAMES = { en: 'English', ko: 'Korean' };
const DEFAULT_MODEL = 'claude-sonnet-4-6';

const TRANSLATION_SYSTEM_PROMPT = `You are an expert technical translator working on a personal engineering blog.
Translate Markdown content between Korean and English while preserving:

- All Markdown structure (headings, lists, blockquotes, code blocks, tables, footnotes) exactly.
- Code blocks (between fences) MUST be preserved verbatim, including any comments inside code (do not translate code comments).
- Inline code (backticks) MUST be preserved verbatim.
- Image paths and link URLs MUST not be changed.
- HTML tags must be preserved.
- Technical terms commonly kept in English (function names, API names like \`LoadImageA\`, OS-level identifiers like \`HANDLE\`, register names, file paths, library names, etc.) should be left as-is.
- General prose should read naturally in the target language; do not over-literally translate.
- Maintain the author's voice: technical, calm, slightly informal but precise.

Return ONLY the translated Markdown body, with no explanations, no surrounding code fences, no preamble, no trailing remarks.`;

const FIELD_SYSTEM_PROMPT =
  'You translate short technical phrases between Korean and English. Return ONLY the translation, with no surrounding quotes, no explanation, no preamble.';

function parseArgs() {
  const argv = process.argv.slice(2);
  let slug = '';
  let force = false;
  let model = DEFAULT_MODEL;
  let target = null;
  for (const arg of argv) {
    if (arg === '--force') force = true;
    else if (arg.startsWith('--model=')) model = arg.slice('--model='.length);
    else if (arg.startsWith('--to=')) target = arg.slice('--to='.length);
    else if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      slug = arg;
    }
  }
  if (!slug) {
    printUsage();
    process.exit(1);
  }
  if (target && !SUPPORTED.includes(target)) {
    console.error(`--to must be one of: ${SUPPORTED.join(', ')}`);
    process.exit(1);
  }
  return { slug, force, model, target };
}

function printUsage() {
  console.error(
    [
      'Usage: pnpm translate <slug> [--to=en|ko] [--force] [--model=<id>]',
      '',
      'Translates the post at src/content/posts/<lang>/<slug>.md to the opposite',
      'language using Claude. The translated file is written to the other locale',
      'folder with translationType=machine.',
      '',
      'Requires ANTHROPIC_API_KEY in the environment.',
    ].join('\n'),
  );
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findSource(slug, explicitTarget) {
  for (const lang of SUPPORTED) {
    if (explicitTarget === lang) continue;
    const p = path.join(POSTS_DIR, lang, `${slug}.md`);
    if (await fileExists(p)) return { lang, path: p };
  }
  return null;
}

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('Source file has no frontmatter');
  return { fmText: m[1], body: m[2] };
}

function joinFrontmatter(fmObj, body) {
  const fmText = stringifyYaml(fmObj, {
    lineWidth: 0,
    defaultStringType: 'QUOTE_SINGLE',
    defaultKeyType: 'PLAIN',
  }).trimEnd();
  return `---\n${fmText}\n---\n\n${body.trimStart()}\n`;
}

function extractText(resp) {
  const block = resp.content.find((b) => b.type === 'text');
  if (!block) throw new Error('Model returned no text block');
  return block.text;
}

async function translateField(client, model, value, fromLang, toLang) {
  if (!value) return value;
  const resp = await client.messages.create({
    model,
    max_tokens: 1024,
    system: FIELD_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Translate from ${LANG_NAMES[fromLang]} to ${LANG_NAMES[toLang]}: ${value}`,
      },
    ],
  });
  return extractText(resp).trim().replace(/^["'`]|["'`]$/g, '');
}

async function translateBody(client, model, body, fromLang, toLang) {
  const resp = await client.messages.create({
    model,
    max_tokens: 16000,
    system: TRANSLATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Translate the following Markdown from ${LANG_NAMES[fromLang]} to ${LANG_NAMES[toLang]}.\n\n${body}`,
      },
    ],
  });
  return extractText(resp).trim();
}

async function main() {
  const args = parseArgs();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }

  const source = await findSource(args.slug, args.target);
  if (!source) {
    const dirs = SUPPORTED.map((l) => `  src/content/posts/${l}/${args.slug}.md`).join('\n');
    console.error(`No source post found for slug "${args.slug}". Looked at:\n${dirs}`);
    process.exit(1);
  }

  const target = args.target ?? (source.lang === 'ko' ? 'en' : 'ko');
  if (target === source.lang) {
    console.error(`Source and target locales cannot both be ${target}.`);
    process.exit(1);
  }

  const targetPath = path.join(POSTS_DIR, target, `${args.slug}.md`);
  if ((await fileExists(targetPath)) && !args.force) {
    console.error(`Target file already exists: ${path.relative(ROOT, targetPath)}`);
    console.error('Pass --force to overwrite.');
    process.exit(1);
  }

  console.log(
    `Translating ${path.relative(ROOT, source.path)} → ${path.relative(ROOT, targetPath)}`,
  );
  console.log(`Source: ${LANG_NAMES[source.lang]}  Target: ${LANG_NAMES[target]}  Model: ${args.model}`);

  const raw = await fs.readFile(source.path, 'utf8');
  const { fmText, body } = splitFrontmatter(raw);
  const fm = parseYaml(fmText) ?? {};

  const client = new Anthropic();

  console.log('  → translating title…');
  const newTitle = await translateField(client, args.model, fm.title, source.lang, target);

  console.log('  → translating description…');
  const newDescription = await translateField(client, args.model, fm.description, source.lang, target);

  console.log('  → translating body…');
  const newBody = await translateBody(client, args.model, body, source.lang, target);

  const newFm = { ...fm };
  newFm.title = newTitle;
  newFm.description = newDescription;
  newFm.lang = target;
  newFm.originalLang = source.lang;
  newFm.translationType = 'machine';
  newFm.canonicalTranslationOf = args.slug;
  delete newFm.commentsIssue;

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, joinFrontmatter(newFm, newBody), 'utf8');

  console.log(`✓ Wrote ${path.relative(ROOT, targetPath)}`);
  console.log('');
  console.log('Tip: review the output, then commit. Once you have manually reviewed it,');
  console.log("change `translationType: machine` → `manual` to drop the auto-translation notice.");
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});

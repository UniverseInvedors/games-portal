#!/usr/bin/env node
// Canonical-catalog consistency + trust checks for games.universeinvedors.tech.
// games_catalog.json is the single source of truth for the published game count.
// Run: node scripts/check-catalog.mjs   (exits 1 on any failure)
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const catalog = JSON.parse(readFileSync(join(root, 'games_catalog.json'), 'utf8'));
const slugs = catalog.map((g) => g.slug);
const N = slugs.length;
const errors = [];

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules' || name === 'games') continue;
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};
const pages = walk(root).filter((p) => /\.(html|txt|xml)$/.test(p));

// 1) Duplicate slugs
if (new Set(slugs).size !== N) errors.push('Duplicate slugs in games_catalog.json');

// 2) Every catalog game has a launchable entry file.
// Read the git index so the check also works in sparse checkouts that omit games/.
let tracked = new Set();
try {
  tracked = new Set(execSync('git ls-files games', { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean));
} catch { /* not a git checkout: fall back to disk */ }
for (const s of slugs) {
  const ok = ['index.html', 'dist/index.html'].some(
    (f) => tracked.has(`games/${s}/${f}`) || existsSync(join(root, 'games', s, f))
  );
  if (!ok) errors.push(`Game "${s}" has no games/${s}/index.html or dist/index.html`);
}

// 3) Sitemap parity with catalog
const sm = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const smSlugs = new Set([...sm.matchAll(/\/games\/([^/<]+)\//g)].map((m) => m[1]));
for (const s of slugs) if (!smSlugs.has(s)) errors.push(`Sitemap missing /games/${s}/`);
for (const s of smSlugs) if (!slugs.includes(s)) errors.push(`Sitemap lists unknown game /games/${s}/`);

// 4) No conflicting hard-coded game counts (e.g. "37 games" when catalog has 36)
const countRe = /\b(\d{2})\+?\s*(?:free\s+)?(?:iconic\s+|live\s+playable\s+|3d\s+|webgl\s+|browser\s+|unblocked\s+)*(?:games|worlds)\b/gi;
for (const p of pages) {
  const text = readFileSync(p, 'utf8');
  for (const m of text.matchAll(countRe)) {
    if (Number(m[1]) >= 20 && Number(m[1]) !== N) {
      errors.push(`${relative(root, p)}: "${m[0]}" conflicts with catalog count ${N}`);
    }
  }
}

// 5) Unapproved fixed-price portfolio offers must not appear
const banned = [/Buy All\s+\d*\s*Games/i, /Get All\s+\d*\s*Games/i, /All\s+\d+\s+Games\s+Source/i, /app_games_collection/i, /universe-xsolla-game-cta/i];
for (const p of pages) {
  const text = readFileSync(p, 'utf8');
  for (const re of banned) if (re.test(text)) errors.push(`${relative(root, p)}: banned promo pattern ${re}`);
}

if (errors.length) {
  console.error(`catalog check FAILED (${errors.length}):\n - ` + errors.join('\n - '));
  process.exit(1);
}
console.log(`catalog check OK: ${N} games, sitemap parity, no count conflicts, no banned promos`);

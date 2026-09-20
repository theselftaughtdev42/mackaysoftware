#!/usr/bin/env node
/* Builds index.html from content.json. No dependencies: `node build.mjs`.
   Edit content.json for copy, this file for structure, styles.css for looks. */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const SOURCE = 'content.json';
const OUTPUT = 'index.html';

/* ── helpers ────────────────────────────────────────────── */

const escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Indent every line of a block by n spaces, so the output stays readable. */
const ind = (block, n) =>
  block
    .split('\n')
    .map((line) => (line.trim() ? ' '.repeat(n) + line : line))
    .join('\n');

// Keeps '' as a deliberate blank line; drops the false/undefined of `a && b` guards.
const lines = (...parts) =>
  parts.filter((part) => part !== undefined && part !== null && part !== false).join('\n');

const fail = (message) => {
  console.error(`build: ${message}`);
  process.exit(1);
};

/* ── tokens ─────────────────────────────────────────────── */

const TOKEN = /\{\{([\w.]+)\}\}/g;

// Separate, un-global copy: `.test()` on a /g regex carries lastIndex between calls.
const HAS_TOKEN = /\{\{[\w.]+\}\}/;

/** Filled from content.json's `since` before anything renders. */
let TOKENS = {};

/** Swaps every {{token}} for its value. `wrap` marks the value so the runtime
    script below can refresh it in the browser; attributes can't hold markup,
    so they ask for the bare string and get refreshed a different way. */
const fill = (text, wrap) =>
  text.replace(TOKEN, (match, name) => {
    if (!(name in TOKENS)) fail(`unknown token ${match} in ${SOURCE}`);
    return wrap ? `<span data-live="${escape(match)}">${TOKENS[name]}</span>` : TOKENS[name];
  });

/** HTML text. Tokens become spans the runtime keeps current. */
const esc = (value) => fill(escape(value), true);

/** Attribute values and anywhere markup can't go. Tokens become plain text. */
const attr = (value) => fill(escape(value), false);

/** The hooks that let the runtime refresh this element, or nothing at all when
    the string holds no tokens. Omit `name` to refresh the element's text. */
const live = (template, name) =>
  HAS_TOKEN.test(template)
    ? ` data-live="${escape(template)}"${name ? ` data-live-attr="${name}"` : ''}`
    : '';

/** Alphabetical, case-insensitive, so the list never depends on entry order. */
const alphabetical = (items) => [...items].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

/** Anything that leaves the site. mailto: and #anchors stay in this tab. */
const external = (href) => /^https?:\/\//i.test(String(href));

/** target/rel for one link: a new tab for off-site links, `noopener` with it so
    the opened page can't reach back through window.opener, and whatever rel the
    link asked for kept alongside. */
const linkAttrs = (link) => {
  const away = external(link.href);
  const rel = [link.rel, away && 'noopener'].filter(Boolean).join(' ');
  return `${away ? ' target="_blank"' : ''}${rel ? ` rel="${attr(rel)}"` : ''}`;
};

const anchor = (link, className) =>
  `<a${className ? ` class="${className}"` : ''} href="${attr(link.href)}"${linkAttrs(link)}>${esc(link.label)}</a>`;

/* ── dates ──────────────────────────────────────────────── */

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** Spelled-out form for prose; digits for anything that outgrows the table. */
function words(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  return String(n);
}

/** Whole years elapsed since a "YYYY-MM" start, as of now. */
function yearsSince(stamp, now) {
  const [year, month] = String(stamp).split('-').map(Number);
  if (!year) fail(`"since" values must look like "YYYY-MM" — got "${stamp}"`);
  let elapsed = now.getFullYear() - year;
  if (now.getMonth() + 1 < (month || 1)) elapsed -= 1;
  return Math.max(elapsed, 0);
}

/** {{since.x}} / {{years.x}} / {{yearsWords.x}} — so no year is ever typed by hand. */
function tokensFor(since = {}, now = new Date()) {
  const tokens = {};
  for (const [key, stamp] of Object.entries(since)) {
    const elapsed = yearsSince(stamp, now);
    tokens[`since.${key}`] = String(stamp).split('-')[0];
    tokens[`years.${key}`] = String(elapsed);
    tokens[`yearsWords.${key}`] = words(elapsed);
  }
  return tokens;
}

/* ── runtime ────────────────────────────────────────────── */

/** The same three date functions, shipped to the page so it keeps itself current
    between builds — a birthday no longer needs a rebuild to show up. Serialising
    the build's own functions is what stops the two copies drifting apart.

    What the build renders is a correct fallback, not a placeholder, so the page
    reads properly with JavaScript off; it just stops ageing. */
function renderRuntime(since) {
  return lines(
    `<script>`,
    `(() => {`,
    `  const since = ${JSON.stringify(since)};`,
    `  const ONES = ${JSON.stringify(ONES)};`,
    `  const TENS = ${JSON.stringify(TENS)};`,
    `  const fail = (message) => { throw new Error(message); };`,
    ind(words.toString(), 2),
    ind(yearsSince.toString(), 2),
    ind(tokensFor.toString(), 2),
    `  const tokens = tokensFor(since);`,
    `  for (const el of document.querySelectorAll('[data-live]')) {`,
    `    const text = el.dataset.live.replace(/\\{\\{([\\w.]+)\\}\\}/g,`,
    `      (match, name) => (name in tokens ? tokens[name] : match));`,
    `    const name = el.dataset.liveAttr;`,
    `    if (name) el.setAttribute(name, text);`,
    `    else el.textContent = text;`,
    `  }`,
    `})();`,
    `</script>`
  );
}

/* ── parts ──────────────────────────────────────────────── */

/** A pinned theme ships one colour and tells the browser's own UI — scrollbars,
    form controls, the address bar — to match it. A site that follows the OS
    ships both and lets the media queries pick. */
const themeMeta = ({ theme, themeColor }) =>
  theme
    ? [
        `<meta name="color-scheme" content="${attr(theme)}">`,
        `<meta name="theme-color" content="${attr(themeColor[theme])}">`,
      ]
    : [
        `<meta name="theme-color" content="${attr(themeColor.light)}" media="(prefers-color-scheme: light)">`,
        `<meta name="theme-color" content="${attr(themeColor.dark)}" media="(prefers-color-scheme: dark)">`,
      ];

function renderHead({ site, brand }) {
  return lines(
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title${live(site.title)}>${attr(site.title)}</title>`,
    `<meta name="description" content="${attr(site.description)}"${live(site.description, 'content')}>`,
    `<link rel="icon" href="${attr(brand.mark)}" type="image/svg+xml">`,
    ...themeMeta(site),
    `<link rel="stylesheet" href="mackay-design-system/tokens.css">`,
    `<link rel="stylesheet" href="styles.css">`
  );
}

/** The lockup comes in a light and a dark cut. A pinned theme knows which one
    it needs; an OS-following page hands the browser both. */
function lockup({ site, brand }) {
  const img = (src) =>
    `<img src="${attr(src)}" alt="${attr(brand.name)}" width="${attr(brand.lockupWidth)}" height="${attr(brand.lockupHeight)}">`;

  if (site.theme) return img(site.theme === 'dark' ? brand.lockupDark : brand.lockup);

  return lines(
    `<picture>`,
    `  <source srcset="${attr(brand.lockupDark)}" media="(prefers-color-scheme: dark)">`,
    `  ${img(brand.lockup)}`,
    `</picture>`
  );
}

function renderHeader({ site, brand, sections }) {
  const nav = sections
    .filter((section) => section.id && section.label && section.nav !== false)
    .map((section) => `<a href="#${attr(section.id)}">${esc(section.label)}</a>`)
    .join('\n');

  return lines(
    `<header class="site-head">`,
    `  <div class="wrap head-wrap">`,
    `    <a class="lockup" href="${attr(brand.home)}" aria-label="${attr(brand.name)} — home">`,
    ind(lockup({ site, brand }), 6),
    `    </a>`,
    nav && `    <nav class="site-nav t-label" aria-label="Sections">\n${ind(nav, 6)}\n    </nav>`,
    `  </div>`,
    `</header>`
  );
}

function renderHero(hero) {
  const title = hero.title.map(esc).join('<br>');

  const actions = hero.actions
    .map((action) => anchor(action, 'action'))
    .join('\n<span class="sep" aria-hidden="true">·</span>\n');

  return lines(
    `<section class="hero">`,
    `  <div class="wrap">`,
    hero.badge &&
      `    <p class="badge t-label">${esc(hero.badge)}</p>`,
    `    <h1 class="hero-title">${title}</h1>`,
    `    <p class="hero-lede">${esc(hero.lede)}</p>`,
    hero.note && `    <p class="hero-note">${esc(hero.note)}</p>`,
    actions && lines(`    <p class="hero-actions">`, ind(actions, 6), `    </p>`),
    `  </div>`,
    `</section>`
  );
}

/** Every band shares the label column / body grid. */
function band(section, body) {
  return lines(
    `<section class="band${section.type === 'contact' ? ' contact' : ''}" id="${attr(section.id)}" aria-labelledby="${attr(section.id)}-h">`,
    `  <div class="wrap band-grid">`,
    `    <h2 class="band-label t-label" id="${attr(section.id)}-h">${esc(section.label)}</h2>`,
    `    <div class="band-body">`,
    ind(body, 6),
    `    </div>`,
    `  </div>`,
    `</section>`
  );
}

const bands = {
  services(section) {
    const items = section.items
      .map((item, i) =>
        lines(
          `<article class="service">`,
          `  <p class="t-label num">${String(i + 1).padStart(2, '0')}</p>`,
          `  <h3 class="service-h">${esc(item.heading)}</h3>`,
          `  <p class="service-p">${esc(item.body)}</p>`,
          `</article>`
        )
      )
      .join('\n');

    // data-count lets the grid fit three across instead of orphaning the third.
    return band(
      section,
      lines(`<div class="services" data-count="${section.items.length}">`, ind(items, 2), `</div>`)
    );
  },

  /** A sorted run of names — order in content.json carries no meaning. */
  tags(section) {
    const items = alphabetical(section.items)
      .map((item) => `<li>${esc(item)}</li>`)
      .join('\n');

    return band(
      section,
      lines(
        section.lede && `<p class="band-lede">${esc(section.lede)}</p>`,
        `<ul class="tags t-small">`,
        ind(items, 2),
        `</ul>`
      )
    );
  },

  facts(section) {
    const rows = section.items
      .map(
        (item) =>
          `<div class="fact"><dt class="t-label">${esc(item.term)}</dt><dd>${esc(item.value)}</dd></div>`
      )
      .join('\n');

    return band(
      section,
      lines(
        section.lede && `<p class="band-lede">${esc(section.lede)}</p>`,
        `<dl class="facts">`,
        ind(rows, 2),
        `</dl>`
      )
    );
  },

  contact(section) {
    const links = (section.links ?? []).map((link) => anchor(link)).join('\n');

    return band(
      section,
      lines(
        section.lede && `<p class="contact-lede">${esc(section.lede)}</p>`,
        `<p class="contact-mail"><a href="mailto:${attr(section.email)}">${esc(section.email)}</a></p>`,
        links && lines(`<p class="contact-links t-small">`, ind(links, 2), `</p>`),
        section.note && `<p class="contact-note t-small">${esc(section.note)}</p>`
      )
    );
  },

  /** Fallback: a label and one or more paragraphs. */
  prose(section) {
    return band(section, section.body.map((text) => `<p class="band-lede">${esc(text)}</p>`).join('\n'));
  },
};

function renderFooter(footer) {
  const registration = lines(
    footer.registration && esc(footer.registration),
    footer.companyNumber && `Company no. ${esc(footer.companyNumber)}`
  )
    .split('\n')
    .join(' | ');

  return lines(
    `<footer class="site-foot t-small">`,
    `  <div class="wrap foot-wrap">`,
    `    <p>${esc(footer.name)}</p>`,
    registration && `    <p>${registration}</p>`,
    `  </div>`,
    `</footer>`
  );
}

/* ── page ───────────────────────────────────────────────── */

function renderPage(content) {
  const { site, sections } = content;

  const body = sections.map((section) => {
    const render = bands[section.type];
    if (!render) fail(`unknown section type "${section.type}" (id: ${section.id ?? '—'})`);
    return render(section);
  });

  return lines(
    `<!doctype html>`,
    `<html lang="${attr(site.lang)}"${site.theme ? ` data-theme="${attr(site.theme)}"` : ''}>`,
    `<head>`,
    ind(renderHead(content), 0),
    `</head>`,
    `<body>`,
    ``,
    `<!-- Generated from ${SOURCE} by build.mjs — edit those, not this file. -->`,
    ``,
    `<a class="skip" href="#main">Skip to content</a>`,
    ``,
    renderHeader(content),
    ``,
    `<main id="main">`,
    ``,
    ind(renderHero(content.hero), 2),
    ...body.flatMap((section) => ['', ind(section, 2)]),
    ``,
    `</main>`,
    ``,
    renderFooter(content.footer),
    ``,
    renderRuntime(content.since ?? {}),
    ``,
    `</body>`,
    `</html>`,
    ``
  );
}

/* ── run ────────────────────────────────────────────────── */

const content = JSON.parse(await readFile(join(root, SOURCE), 'utf8'));

for (const key of ['site', 'brand', 'hero', 'sections', 'footer']) {
  if (!content[key]) fail(`${SOURCE} is missing "${key}"`);
}

if (content.site.theme && !['light', 'dark'].includes(content.site.theme)) {
  fail(`site.theme must be "light", "dark", or absent to follow the OS — got "${content.site.theme}"`);
}

TOKENS = tokensFor(content.since);

await writeFile(join(root, OUTPUT), renderPage(content), 'utf8');
console.log(`build: ${OUTPUT} written from ${SOURCE} (${content.sections.length} sections)`);

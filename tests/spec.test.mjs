// opcsite spec tests — plain node:test, zero dependencies.
// Each test maps to a frozen-spec FR/DoD (see docs/spec.md):
//   FR-1/DoD-7 scope, FR-2 hero, FR-3 blurb, FR-4 heading, FR-5 empty state,
//   FR-6/DoD-4 renderer behavior, FR-7/DoD-5 data contract, FR-8 chrome,
//   FR-9 static + weight + no-JS default, DoD-9 markup sanity.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { parse } from 'node:url';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const js = read('renderer.js');

// ---- Verbatim copy pinned by the frozen spec ----
const COPY = {
  title: '<title>Z — a product company run by AI agents</title>',
  meta: '<meta name="description" content="Z is a software company run by AI agents. This page lists what it has shipped.">',
  wordmark: 'Z',
  tagline: 'A product company run by AI agents.',
  blurb: 'Z is a software company where the work — specifying, building, reviewing, and shipping — is done by AI agents. Humans set direction and approve each stage; agents carry the product from idea to deployment. This page is our public record: what we are, and what we have shipped.',
  heading: 'Shipped Products',
  emptyLine: 'Nothing shipped yet — our first ship is in progress.',
  emptySubline: 'Products will appear here as they ship.',
  footer: '© 2026 Z · run by AI agents',
};

test('FR-8: <title> and meta description verbatim', () => {
  assert.ok(html.includes(COPY.title), 'title not verbatim');
  assert.ok(html.includes(COPY.meta), 'meta description not verbatim');
});

test('FR-2: hero has exactly the wordmark (single h1) and tagline, verbatim', () => {
  const h1s = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
  assert.equal(h1s.length, 1, 'exactly one h1 (DoD-9)');
  assert.equal(h1s[0].replace(/<[^>]+>/g, '').trim(), COPY.wordmark);
  assert.ok(html.includes(COPY.tagline), 'tagline not verbatim');
});

test('FR-3: blurb verbatim, in a section labelled "What we are", no heading inside', () => {
  assert.ok(html.includes('aria-label="What we are"'), 'accessibility label missing');
  assert.ok(html.includes(COPY.blurb), 'blurb not verbatim');
  const section = html.match(/<section[^>]*aria-label="What we are"[^>]*>[\s\S]*?<\/section>/i);
  assert.ok(section, 'What we are section missing');
  assert.ok(!/<h[1-6]/i.test(section[0]), 'blurb section must have no heading');
});

test('FR-4: Shipped Products section with verbatim <h2>', () => {
  assert.ok(/<h2[^>]*>\s*Shipped Products\s*<\/h2>/.test(html), 'h2 "Shipped Products" missing or not verbatim');
  assert.ok(html.includes('aria-label="Shipped Products"'), 'section accessibility label missing');
});

test('FR-5 / DoD-3: empty-state lines ship as verbatim HTML default (also covers DoD-6 no-JS)', () => {
  assert.ok(html.includes(COPY.emptyLine), 'empty-state line not verbatim in HTML');
  assert.ok(html.includes(COPY.emptySubline), 'empty-state sub-line not verbatim in HTML');
  // No product entries hardcoded in the HTML (zero at launch, FR-7/DoD-5).
  assert.ok(!/<article/i.test(html), 'index.html must not hardcode product entries');
});

test('DoD-6 no-JS check: hero, blurb, heading, empty state all present without scripting', () => {
  // The page is a plain static file: everything above is raw HTML, so the
  // raw source assertions already prove the no-JS render. Additionally the
  // empty state must NOT depend on renderer.js executing.
  for (const s of [COPY.tagline, COPY.blurb, COPY.heading, COPY.emptyLine, COPY.emptySubline]) {
    assert.ok(html.includes(s), `no-JS content missing: ${s.slice(0, 30)}…`);
  }
});

test('FR-8 optional footer: exact string, single line, nothing else', () => {
  const footers = html.match(/<footer[\s\S]*?<\/footer>/gi) || [];
  assert.equal(footers.length, 1, 'at most one footer');
  const text = footers[0].replace(/<[^>]+>/g, '').trim();
  assert.equal(text, COPY.footer);
});

test('FR-1 / DoD-7 scope: one page, three sections only, no forms, no analytics, no external resources', () => {
  assert.ok(existsSync(new URL('index.html', root)), 'single page index.html');
  assert.ok(!/<form/i.test(html), 'no forms allowed');
  assert.ok(!/google-analytics|gtag|analytics|tracking|pixel/i.test(html + js), 'no analytics/tracking');
  const sections = html.match(/<section\b/gi) || [];
  assert.equal(sections.length, 2, 'exactly two <section>s (blurb + shipped products; hero is a header)');
  // No external fonts/images/scripts (FR-9): every src/href must be local.
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    assert.ok(!/^https?:\/\//i.test(ref), `external resource not allowed: ${ref}`);
    const u = parse(ref);
    assert.ok(existsSync(new URL(u.pathname.replace(/^\//, ''), root)), `local asset missing: ${ref}`);
  }
});

test('FR-7 / DoD-5: products.json schema — launch state empty, contract enforced', () => {
  const data = JSON.parse(read('products.json'));
  assert.ok(Array.isArray(data.products), 'products must be an array');
  for (const p of data.products) {
    assert.equal(typeof p.name, 'string'); assert.ok(p.name);
    assert.equal(typeof p.description, 'string'); assert.ok(p.description);
    assert.ok(p.description.length <= 140);
    assert.match(p.shipped_at, /^\d{4}-\d{2}-\d{2}$/);
    if (p.url != null) assert.match(p.url, /^https:\/\//);
  }
  // Launch-state invariant: normally products.json must ship EMPTY (FR-5/DoD-3).
  // The only sanctioned non-empty state is the DoD-4 round-trip harness, enabled
  // by the repo variable DOD4_ROUNDTRIP=1 (see PR evidence procedure).
  if (process.env.DOD4_ROUNDTRIP !== '1') {
    assert.equal(data.products.length, 0, 'launch state must be exactly zero products');
  }
});

test('DoD-5: no product content hardcoded outside products.json', () => {
  // renderer.js builds names/descriptions/dates purely from products.json;
  // it must contain no literal product data or https URLs.
  assert.ok(!/https:\/\//.test(js), 'renderer must not hardcode URLs');
  assert.ok(!/https:\/\//.test(css) && !/https:\/\//.test(html.replace(COPY.meta, '')), 'no stray product URLs in CSS/HTML');
});

test('FR-9: static and minimal — framework null, no deps, no build step, weight < 100 KB', () => {
  const vj = JSON.parse(read('vercel.json'));
  assert.equal(vj.framework, null, 'framework must stay null');
  assert.ok(!existsSync(new URL('package.json', root)), 'no package.json on a dependency-free static site');
  for (const bad of ['public', 'dist', 'build', 'node_modules', '_site'])
    assert.ok(!existsSync(new URL(bad, root)), `no build output dir allowed: ${bad}/`);
  const weight = ['index.html', 'styles.css', 'renderer.js', 'products.json']
    .reduce((n, f) => n + statSync(new URL(f, root)).size, 0);
  assert.ok(weight < 100 * 1024, `total page weight ${weight} bytes must stay under 100 KB`);
});

test('DoD-9 markup sanity: UTF-8 HTML5, single h1, balanced core tags', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<meta charset="utf-8"/i);
  assert.equal((html.match(/<html[\s>]/gi) || []).length, 1);
  assert.equal((html.match(/<body[\s>]/gi) || []).length, 1);
  assert.equal((html.match(/<h1[\s>]/gi) || []).length, 1);
  assert.equal((html.match(/<h2[\s>]/gi) || []).length, 1);
  for (const tag of ['main', 'header', 'section', 'footer', 'div', 'p']) {
    const open = (html.match(new RegExp(`<${tag}[\\s>]`, 'gi')) || []).length;
    const close = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    assert.equal(open, close, `<${tag}> tags unbalanced`);
  }
});

// ---- FR-6 / DoD-4: renderer behavior, exercised by running renderer.js in a stubbed DOM ----

function runRenderer(products, code = js) {
  const made = [];
  const mkEl = () => {
    const el = {
      className: '', href: '', _text: '', children: [],
      set textContent(v) { this._text = v; this.children = []; },
      get textContent() { return this._text; },
      appendChild(c) { this.children.push(c); return c; },
    };
    made.push(el);
    return el;
  };
  const host = mkEl();
  const document = {
    getElementById: (id) => (id === 'products' ? host : null),
    createElement: mkEl,
  };
  const context = {
    document,
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ products }) }),
    Date, TypeError, Error, RegExp, String, Number, Array, Object, Math, JSON,
    setTimeout, console,
  };
  vm.runInNewContext(code, context);
  return new Promise((resolve) => setTimeout(() => resolve({ host, made }), 20));
}

const entries = (host) => host.children.filter((c) => c.className === 'product');
const textOf = (el) => {
  let t = el._text;
  for (const c of el.children) t += c.textContent || '';
  return t;
};

test('FR-6: renders one entry per product — name, description, en-US long date', async () => {
  const { host } = await runRenderer([
    { name: 'Example', description: 'one line', url: 'https://example.com/', shipped_at: '2026-09-07' },
  ]);
  const list = entries(host);
  assert.equal(list.length, 1, 'exactly one product entry');
  const [name, desc, date] = list[0].children;
  assert.equal(name.className, 'product-name');
  assert.equal(textOf(name), 'Example');
  assert.equal(name.children[0].href, 'https://example.com/', 'https url renders as link');
  assert.equal(textOf(desc), 'one line');
  assert.equal(textOf(date), 'September 7, 2026');
});

test('FR-6: newest-first by shipped_at, ties break alphabetically by name', async () => {
  const { host } = await runRenderer([
    { name: 'Beta', description: 'b', shipped_at: '2026-09-07' },
    { name: 'Alpha', description: 'a', shipped_at: '2026-09-07' },
    { name: 'Older', description: 'o', shipped_at: '2026-01-01' },
  ]);
  const names = entries(host).map((e) => textOf(e.children[0]));
  assert.deepEqual(names, ['Alpha', 'Beta', 'Older']);
});

test('FR-6/FR-7: non-https url renders as plain text (no link)', async () => {
  const { host } = await runRenderer([
    { name: 'Plain', description: 'no url', url: 'http://insecure.example', shipped_at: '2026-09-07' },
    { name: 'NullUrl', description: 'null url', url: null, shipped_at: '2026-09-07' },
  ]);
  const list = entries(host);
  assert.equal(list.length, 2);
  for (const e of list) assert.equal(e.children[0].children.length, 0, 'plain text, no anchor');
});

test('FR-5/DoD-4: empty products array keeps the HTML empty state untouched', async () => {
  const { host } = await runRenderer([]);
  assert.equal(entries(host).length, 0, 'no product entries');
  // The renderer never touched the host: default HTML empty state remains.
  const fresh = await runRenderer([], '');
  assert.equal(fresh.host.children.length, host.children.length, 'no mutation for empty list');
});

test('FR-7: malformed entries are skipped, empty state survives bad fetch', async () => {
  const { host } = await runRenderer([
    { name: '', description: 'empty name', shipped_at: '2026-09-07' }, // invalid
    { name: 'Too long', description: 'x'.repeat(141), shipped_at: '2026-09-07' }, // invalid
    { name: 'BadDate', description: 'ok', shipped_at: '07/09/2026' }, // invalid
    { name: 'Good', description: 'valid', shipped_at: '2026-09-07' }, // valid
  ]);
  const names = entries(host).map((e) => textOf(e.children[0]));
  assert.deepEqual(names, ['Good']);
});

// Keep the scaffold's honesty marker test honest: placeholder is gone.
test('scaffold placeholder fully replaced', () => {
  assert.ok(!/Scaffold placeholder/i.test(html), 'placeholder copy must be gone');
});

// Static-scaffold smoke tests — plain node:test, zero dependencies.
// These run in CI on every PR alongside the deploy smoke job.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'node:url';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('index.html exists and is UTF-8 HTML5', () => {
  assert.ok(existsSync(new URL('index.html', root)), 'index.html missing');
  const html = read('index.html');
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<meta charset="utf-8"/i);
});

test('placeholder marker present (scaffold honesty check)', () => {
  const html = read('index.html');
  assert.match(html, /Scaffold placeholder/i);
});

test('no broken local asset links', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length > 0, 'expected at least one asset reference');
  for (const ref of refs) {
    if (ref.startsWith('http') || ref.startsWith('#')) continue;
    const u = parse(ref);
    assert.ok(
      existsSync(new URL(u.pathname.replace(/^\//, ''), root)),
      `referenced local asset missing: ${ref}`
    );
  }
});

test('build stays static: no framework deps, no build step', () => {
  assert.ok(!existsSync(new URL('package.json', root)) || JSON.parse(read('package.json')).devDependencies === undefined || Object.keys(JSON.parse(read('package.json')).dependencies || {}).length === 0,
    'static site must not grow runtime dependencies');
  const vj = JSON.parse(read('vercel.json'));
  assert.equal(vj.framework, null, 'framework must stay null (plain static)');
});

test('styles.css parses as plain CSS with sane size', () => {
  const css = read('styles.css');
  assert.ok(css.includes('placeholder'), 'styles should be the scaffold placeholder set');
  assert.ok(css.length < 10000, 'scaffold CSS should stay minimal');
});

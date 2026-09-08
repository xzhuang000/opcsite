# opcsite

Public one-page site for Z (B6 dry-run). Built to the frozen spec
(`docs/spec.md`, spec-opcsite-v1-FROZEN-G1 + CEO AMENDMENT 2026-09-08, SHA-256
`cd7368e464b6ea1615ee87eecae29e490c45917f5f43d43f8222daae20a5cb0e`).

## Stack

Plain static HTML/CSS + one small vanilla-JS renderer. No framework, no
build step, no runtime dependencies, no external resources. `vercel.json`
pins `framework: null` so Vercel serves the files as-is.

## Layout

- `index.html` — the page: hero, "What we are" blurb, Shipped Products
  (empty state is the shipped HTML default), footer line
- `styles.css` — minimal styling per spec §4
- `products.json` — the ONLY place ships are added (see below)
- `renderer.js` — fetches `products.json`, renders entries newest-first
- `tests/spec.test.mjs` — zero-dependency `node:test` suite mapped to the
  spec's FRs/DoDs
- `.github/workflows/ci.yml` — static tests + preview deploy smoke
- `docs/` — frozen spec (verbatim) and the G0 idea record

## Adding a ship (the only edit ever needed)

Append one entry to `products.json`:

```json
{
  "name": "Example",
  "description": "one line",
  "url": "https://example.com/",
  "shipped_at": "2026-09-07"
}
```

`name` (non-empty), `description` (≤140 chars), and `shipped_at`
(YYYY-MM-DD) are required; `url` is optional (absolute https URL, else the
name renders as plain text). No other file changes.

## Deploy pipeline (Vercel Hobby, free)

1. Every PR and main push runs CI (`.github/workflows/ci.yml`):
   - `test` job: `node --test tests/`
   - `preview-smoke` job: deploys a **preview** (never production) with
     `vercel deploy --yes` and curls it until it returns 200 with the
     "Shipped Products" content; fails the PR otherwise. The preview URL
     is posted as a PR comment.
2. Production deploys are done by the Lead per deployment.md — CI never
     touches production.

### Required repo secrets (one-time setup)

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Vercel deploy token (Hobby account) |
| `VERCEL_ORG_ID` | optional — auto-discovered if unset |
| `VERCEL_PROJECT_ID` | optional — auto-discovered if unset |

The `preview-smoke` job fails closed if `VERCEL_TOKEN` is missing.

## Local checks

```sh
node --test tests/
```

# opcsite

Public one-page site for OPC (B6 dry-run). Currently a **scaffold placeholder**
— real content lands post-G1 in the build task (kanban card t_2e939b6a).

## Stack

Plain static HTML/CSS. No framework, no build step, no runtime dependencies.
`vercel.json` pins `framework: null` so Vercel serves the files as-is.

## Layout

- `index.html` — placeholder page
- `styles.css` — minimal placeholder styling
- `tests/scaffold.test.mjs` — zero-dependency `node:test` suite
- `.github/workflows/ci.yml` — static tests + preview deploy smoke

## Deploy pipeline (Vercel Hobby, free)

1. Every PR and main push runs CI (`.github/workflows/ci.yml`):
   - `test` job: `node --test tests/`
   - `preview-smoke` job: deploys a **preview** (never production) with
     `vercel deploy --yes` and curls it until it returns 200 with the
     placeholder marker; fails the PR otherwise. The preview URL is posted
     as a PR comment.
2. Production deploys are done by the Lead per deployment.md — CI never
   touches production.

### Required repo secrets (one-time setup)

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Vercel deploy token (Hobby account) |
| `VERCEL_ORG_ID` | optional — auto-discovered if unset |
| `VERCEL_PROJECT_ID` | optional — auto-discovered if unset |

The `preview-smoke` job fails closed if `VERCEL_TOKEN` is missing: an
unprovable deploy is treated as a broken pipeline.

## Plugging content in (for the build task)

Replace `index.html` / `styles.css` and extend `tests/` — the deploy
pipeline needs no changes. Do **not** add a framework; the spec freeze
says minimal static. The Shipped Products section must be data-file
driven (see spec) and render an honest empty state.

## Local checks

```sh
node --test tests/
```

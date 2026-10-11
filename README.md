# opcsite

Public site for Z: **The Autonomous Outpost** — a playable landing page. The
interface is a live Phaser world: walk around a floating studio, talk to the
crew, make product decisions, solve a small circuit puzzle, and launch a
working focus timer. It replaces the original one-pager (frozen spec in
`docs/spec.md`, kept as a historical record; see `docs/decision-log.md`).

## Stack

Semantic HTML/CSS shell + vanilla-JS app, with the world rendered by
[Phaser 4](https://docs.phaser.io/) (pinned in the lockfile, vendored at
build time — no runtime CDN dependency). All fonts and art are self-hosted;
static terrain and sprites are painted in code (`src/pixel-art.js`).

## Layout

- `index.html`, `styles.css` — responsive game shell, mission journal,
  semantic navigation, native dialogs
- `app.js` — company content, quest interactions, sound, saved progress,
  and the working timer
- `src/world.js` — Phaser scene, character animation, camera, interaction,
  collectibles, launch sequence
- `src/pixel-art.js` — code-native pixel terrain, buildings, trees,
  characters, props (no background illustration)
- `src/navigation.js` — island boundaries, collision, grid pathfinding
- `src/state.js` — validated saves and ordered mission transitions
- `assets/` — self-hosted fonts (licenses included) and favicon
- `scripts/` — `serve.mjs` (dev server), `vendor.mjs` (copies pinned Phaser
  into `vendor/`), `build.mjs` (emits `dist/`)
- `tests/state.test.js` — zero-dependency `node:test` suite: progression,
  circuit gating, corrupt-save recovery, obstacle-aware paths

## Local development

Requires Node.js 18+.

```sh
npm ci
npm run dev          # http://localhost:3000 (npm run dev -- --port 4000)
```

## Checks and build

```sh
npm run check        # node --check on app.js + src/
npm test             # node --test tests/
npm run build        # prebuild vendors Phaser, then emits dist/
```

`predev`, `prestart`, and `prebuild` copy the pinned Phaser distribution and
license from `node_modules` into `vendor/`. `dist/` is the deployable output.

## Deploy pipeline (Vercel Hobby, free)

`vercel.json` pins `framework: null` with `buildCommand: npm run build` and
`outputDirectory: dist` — Vercel installs from the lockfile, builds, and
serves `dist/` as static files.

1. Every PR and main push runs CI (`.github/workflows/ci.yml`):
   - `test` job: `npm ci && npm run check && npm test`
   - `preview-smoke` job: deploys a **preview** (never production) with
     `vercel deploy --yes` and curls it until it returns 200 with the
     outpost content; fails the PR otherwise. The preview URL is posted as
     a PR comment.
2. Production deploys are done by the Lead per deployment.md — CI never
     touches production.

### Required repo secrets (one-time setup)

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Vercel deploy token (Hobby account) |
| `VERCEL_ORG_ID` | optional — auto-discovered if unset |
| `VERCEL_PROJECT_ID` | optional — auto-discovered if unset |

The `preview-smoke` job fails closed if `VERCEL_TOKEN` is missing.

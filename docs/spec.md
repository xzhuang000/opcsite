# OPC Site (opcsite) — Product Spec

Product: opcsite ("OPC public site") — B6 dry-run. Size class: tiny. Lane: Full
(new Product with public behavior), scope kept proportionate. Spec author: PM
(z-current), 2026-09-07. Status: DRAFT for pre-G1 grilling.

## 1. Overview

A single static web page, deployed on a Vercel Hobby free subdomain, that tells
a stranger what OPC is — a product company run by AI agents — and lists what it
has shipped. The page launches with zero shipped products and must say so
honestly; it stays accurate as ships accumulate by editing exactly one data
file. No build framework, no backend, no spend.

## 2. Intent fit (G0)

CEO intent (G0 Go, 2026-09-07): "A public one-page website that explains what
this company is — an agent-run product company — and lists what it has shipped,
so anyone curious can see it exists."

Mapping:
- "public one-page website" → FR-1, FR-9, FR-10 (single static page, public URL)
- "explains what this company is — an agent-run product company" → FR-2, FR-3
- "lists what it has shipped" → FR-4, FR-5, FR-6, FR-7
- "so anyone curious can see it exists" → FR-8, FR-10 (findable title/meta, live URL)

## 3. Behavior (FR-n)

### Section 1 — Hero (top of page)

FR-1. The site is exactly one page: a single static `index.html` served at the
site root; no other routes exist.

FR-2. The hero, at the top of the page, contains exactly two text elements,
verbatim:
  - Wordmark (the page's single `<h1>`): `OPC`
  - Tagline: `A product company run by AI agents.`

### Section 2 — What we are

FR-3. Directly below the hero, a short blurb paragraph renders verbatim:

  `OPC is a software company where the work — specifying, building, reviewing,
  and shipping — is done by AI agents. Humans set direction and approve each
  stage; agents carry the product from idea to deployment. This page is our
  public record: what we are, and what we have shipped.`

  The blurb has no heading; it is marked up as a section with an accessibility
  label ("What we are"). No additional sentences.

### Section 3 — Shipped Products

FR-4. Below the blurb, a section with heading (`<h2>`, verbatim):
  `Shipped Products`

FR-5. Empty state. When `products.json` contains `"products": []`, the section
renders verbatim:
  - `Nothing shipped yet — our first ship is in progress.`
  - Sub-line, smaller/muted: `Products will appear here as they ship.`
  and renders zero product entries. This is the launch state.

FR-6. Non-empty state. For every entry in `products.products`, the section
renders one entry showing: the product `name` (as a link when `url` is a
non-empty https URL, plain text otherwise), its `description`, and its
`shipped_at` date in human-readable form: en-US long date (e.g.
  September 7, 2026). Entries are ordered newest-first by `shipped_at`; ties
  break alphabetically by `name`. When at least one entry renders, the
FR-5 empty-state lines do not appear.

FR-7. Data contract — the single source of truth for ships. A file
`products.json` at the site root is the only place products are added:

  {
    "products": [
      {
        "name": "Example",              // required, non-empty string
        "description": "one line",      // required, non-empty string, <= 140 chars
        "url": "https://example.com/",  // optional; absolute https URL, or null/omitted
        "shipped_at": "2026-09-07"      // required, ISO 8601 date (YYYY-MM-DD)
      }
    ]
  }

  No product name/description/url/date may be hardcoded in `index.html`,
  styles, or scripts. Adding a ship = adding one entry to this file. The
  renderer is a small vanilla-JS file (~20 lines) that fetches
  `products.json` and renders entries; the empty state (FR-5) is the default
  content shipped in the HTML, replaced only when ≥1 product exists.

### Page chrome

FR-8. `<title>` and meta description, verbatim:
  - `<title>OPC — a product company run by AI agents</title>`
  - `<meta name="description" content="OPC is a software company run by AI agents. This page lists what it has shipped.">`
  Optional chrome: a single-line footer with exactly `© 2026 OPC · run by AI
  agents` and nothing else. No other sections, headers, or navigation.

FR-9. Static, minimal, resilient. Plain HTML + one CSS file + the FR-7 script;
no framework, no build step, no external fonts/images/scripts. With JavaScript
disabled, the page still renders hero, blurb, the FR-4 heading, and the FR-5
empty state (honest default while the list is empty). Total page weight
(HTML+CSS+JS+JSON) under 100 KB.

FR-10. Deployment. Production is a Vercel Hobby (free) project serving the
default `*.vercel.app` subdomain. No custom domain, no paid features, no
exception lane; spend $0. Exact subdomain chosen at G2 per deployment.md
(suggested project name: `opcsite`).

## 4. Layout (minimal clean, binding enough to avoid Dev questions)

- One centered column, max-width 40rem, left-aligned text; generous vertical
  rhythm (≥ 3rem spacing between the three sections).
- System font stack throughout; dark text on a light background (e.g. #1a1a1a
  on #fafafa); at most one muted accent color (optional).
- Type scale (approximate): wordmark ~3rem bold; tagline ~1.25rem; blurb
  ~1.05rem / 1.6 line-height; section heading ~1.5rem; product name ~1.1rem
  medium; description regular; date small and muted.
- Naturally responsive (single column); no images or icon assets.

## 5. Scope

Exactly: one page, the three sections specified in FR-2–FR-6, the chrome in
FR-8, the data file in FR-7, the layout in section 4, deployment per FR-10.

## 6. Out of scope (rejected: size-class tiny)

Analytics or any tracking; blog; contact form; i18n/multi-language; custom
domain; CMS or admin UI; any backend or API beyond serving static files; SEO
beyond FR-8 meta; dark-mode toggle; social/OG image assets; JS frameworks or
build tooling.

## 7. Definition of done (DoD-n; evidence-verifiable at G3)

DoD-1. Production URL (a `*.vercel.app` host) returns HTTP 200 and the
FR-8 `<title>`.
DoD-2. Verbatim copy check on the live page: FR-2 wordmark+tagline, FR-3
blurb, FR-4 heading, FR-5 empty-state lines all present, character-for-character.
DoD-3. Empty-state check: with the launch `products.json`
(`"products": []`), zero product entries render and the FR-5 lines appear.
DoD-4. Data-contract round-trip on a preview deploy: adding one valid test
entry to `products.json` renders that entry (name, description, human-readable
date, working link); reverting the file restores the FR-5 state.
DoD-5. Schema check: every entry in `products.json` has `name`,
`description` (≤140 chars), `shipped_at` (YYYY-MM-DD); `url`, when present,
is an absolute https URL; no product content exists outside `products.json`
(grep of HTML/CSS/JS finds none).
DoD-6. No-JS check: with JavaScript disabled, hero, blurb, FR-4 heading, and
FR-5 empty state still render.
DoD-7. Scope check: page source contains no analytics/tracking scripts, no
forms, and no content sections beyond hero / blurb / Shipped Products (plus
the optional FR-8 footer line verbatim).
DoD-8. Deployment check: Vercel Hobby plan, default free subdomain only,
$0 spend; deploy ref (git SHA + deployment URL) recorded on the Ship card per
deployment.md.
DoD-9. Markup sanity: exactly one `<h1>`; W3C validator reports no errors.

## 8. Open questions — resolved

- Empty list at launch → FR-5 "first ship in progress" state (CEO informed at
  G0; PM decision recorded here).
- How ships accumulate → FR-7 single `products.json`; renderer handles growth,
  page never needs content edits outside that file.
- Footer → optional one-line chrome, exact string pinned in FR-8.
- Exact subdomain → Dev names it at G2 (deployment.md default); suggestion
  `opcsite.vercel.app`.
- JS dependency → empty state is the HTML default (FR-9), so the page is
  never blank or dishonest without JS.

## PM self-grill (pre-G1)

Each FR has an observable (verbatim string, DOM state, HTTP status, file
content); FR-6/FR-7 share the data contract deliberately — FR-6 is render
behavior, FR-7 is the source-of-truth rule, independently checkable via
DoD-4/DoD-5. Intent drift: none — three sections, agent-run statement, shipped
list, public URL. Scope vs size class: 10 FRs / 9 DoDs, all mechanical; the
only judgment content (copy) is pinned verbatim so Dev has zero content
questions.

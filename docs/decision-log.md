# opcsite — Decision log

Curated spine per OPC `spec/board.md` (card-as-index law, #26): one line
per durable event, newest last. Payloads live in linked PRs/issues and the
kanban board (`opcsite`, card `t_09bf0bb1`); nothing is duplicated here.

| Date (CST) | Event | Payload |
|---|---|---|
| 2026-09-07 09:39 | **G0 GO** — CEO approves B6 intake (public one-pager) | OPC Dry Run thread; board `opcsite` t_09bf0bb1 |
| 2026-09-07 10:00 | **G1 GO** — spec frozen, SHA `5db48801…` | docs/spec.md; Spec card t_159b12ae |
| 2026-09-07 ~11:00 | **G2 GO** — plan approved; Vercel Hobby free subdomain, $0 | Plan card t_fab2bdf8 |
| 2026-09-07 11:37 | PR #3 merged — build per frozen spec, reviewed SHA `c39eae9` | PR #3 (commit 7147d03) |
| 2026-09-07 12:3x | **G3 review PASS** (z-lens, 2 rounds, 18/18 tests) — ship conditions set | review card t_b3574036 |
| 2026-09-08 AM | **Amendment**: CEO rename OPC→Z; spec re-frozen `cd7368e4…` | card t_d032692a; PR #4 |
| 2026-09-08 11:49 | **G3 GO** — CEO approves ship incl. rename | OPC Dry Run thread |
| 2026-09-08 13:07 | **SHIPPED** — https://opcsite-z-opc.vercel.app · dpl_278CFeWV · git 756a8a8 · $0 | Ship card t_b2f1ad7a; smoke cron 09:05 daily (d61e9584ab17) |
| 2026-09-08 12:2x | Incident: living-record card crash-looped workers (runs 21–22) on stale body; unlinked stage-card parent edges; parked Lead-owned | t_09bf0bb1 comment 09-08 12:21 |
| 2026-09-08 | Incident: quota janitor over-held ship card ~4.6h (reset-time parsing); fixed in OPC repo 71c8792 | OPC repo commit 71c8792 |
| 2026-09-10 21:05 | Product card closed to `done` (terminal): record continues here + board history; Operate triage via new cards | t_09bf0bb1 comment 09-10 21:05 |
| 2026-09-10 | **Charter change**: living records are indices (#26, PR #27); this file created as backfill | OPC #26 / #27 |

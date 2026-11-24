# Working with Claude: Task Sizing and Prompts

> How to implement [architecture-plan.md](./architecture-plan.md) in small, reviewable tasks. Rules for Claude live in [`CLAUDE.md`](../CLAUDE.md).

Every task adds **at most 300 lines of source code**. That's small enough to review properly in 15 minutes, to test in one sitting, and to throw away cheaply if it goes wrong. The budget is enforced at four points: when the task is planned, when Claude starts, while it works, and before the branch merges.

## The rule

| Counts toward 300 | Doesn't count |
|---|---|
| Added lines in source files (`.ts`, `.tsx`, `.py`, `.css`, config, scripts) | Tests (`__tests__/`, `e2e/`, `*.test.*`, `test_*.py`) |
| New source files, even before `git add` | Docs (`*.md`) |
| | Data (`scripts/data/`, `scripts/eval/*.json`), migrations, lockfiles |
| | Deleted lines (removing code is easy to review) |

**Mechanical changes** (renames, moving files, codemods, generated migrations, switching test frameworks) go on a `mech/*` branch. They may be any size but must not change behavior, and you review them by spot-checking.

Measure it any time with:

```
npm run diff:size          # compares against main; exits 1 when over budget
DIFF_LIMIT=200 npm run diff:size
```

## Four checkpoints

| When | Check | Who |
|---|---|---|
| Monday planning | Every task brief carries an estimate under 250 lines; anything bigger is split before it's scheduled | You + Claude (planning prompt) |
| Session start | Claude lists files and an estimate before writing code; over 250 means stop and split | Claude (session prompt) |
| During the session | `npm run diff:size` after each file; at 300 Claude stops and proposes a split | Claude (`CLAUDE.md` rule) |
| Before merge | `diff-size` runs in CI on every pull request and fails over budget | GitHub Actions |

## How to split work that's too big

Use these patterns, in this order of preference:

1. **Vertical slice.** One endpoint or one screen end to end, not one layer across everything. Example: contracts for search first, then clusters, then analyze.
2. **Prepare, then change.** A mechanical `mech/` task moves or renames code with no behavior change; the next task makes the real change in a now-small diff.
3. **Add beside, then switch, then delete.** Build the new path next to the old one (task 1), move callers to it (task 2), delete the old path (task 3, mostly deletions, which don't count).
4. **Behind a flag.** Ship half a feature switched off, finish it in the next task.
5. **Tests carry the weight.** Large test files are free; keep the source change minimal and let tests describe the behavior.

## Phase 0 and Phase 1: status

Estimates and actuals are added source lines (tests not counted). Status as of Nov 22.

**Phase 0 — correctness: done**

| ID | Task | Status |
|---|---|---|
| P0-1 | Clustering reads document text (`text` → `content`) | Done |
| P0-2 | Search shows the route's `error` message | Done in the store; the message is still not shown on screen (see Search) |
| P0-3 | Pinecone reranking (topK 40 → topN 10) | Done |
| P0-4 | Single filtering path | Changed: filters narrow the loaded page only and never re-search; search-scope filters come later (Search) |
| P0-5 | `AbortController` at the fetch sites | Done; later replaced by TanStack Query cancelling (P1-3, P1-4) |
| P0-6 | Cluster assignments as an immutable map | Done |
| P0-7 | OpenAI timeout and retries; safe JSON parse | Done |
| P0-8 | Redirect `/` to `/graph`; `app/graph/error.tsx` | Done |
| P0-9 | Error tracking | Changed: PostHog (errors, logs, OpenTelemetry) instead of Sentry |
| P0-10 | Document types | Changed: `publisher` (who) and `documentType` (Law, Guidance, Interpretation) from `lib/config/document-taxonomy.json`; data re-uploaded |

**UX fixes (between phases): done**

| ID | Task | Status |
|---|---|---|
| T1 | Search panel spacing | Done |
| T2 | Reagraph's real types; straight edges | Done |
| T3 | Honest AI context meter (nodes and tokens vs. real limits) | Done |
| T4 | Hover a document anywhere to highlight it, without moving the graph | Done |
| T5 | Click a node to toggle context; purple cluster rings and fading names; grey/black node rings; darker hover labels; lasso highlight | Done |
| T6–T7 | Timeline | Parked |

**Phase 1 — foundations: 13 of 17 done** (the rest paused for the search track)

| ID | Task | Branch | Est. | Actual | Status |
|---|---|---|---|---|---|
| P1-1 | zod contract for search + route validation | `p1/search-contract` | 150 | 121 | Done |
| P1-2 | `toApiNode()`; delete normalizer and route node mapping | `p1/to-api-node` | 120 | 101 | Done (also keeps full document text) |
| P1-3 | Search client + `useSearch` (TanStack Query) | `p1/use-search` | 200 | 132 | Done |
| P1-4 | Query hooks for clusters, analysis and tags | `p1/query-hooks` | 240 | 180 | Done (fixed cluster tags not showing; documents-list hook skipped, unused) |
| P1-5 | nuqs; query and topK in the URL | `p1/url-query` | 130 | 93 | Done |
| P1-6 | Filters and view modes in the URL | `p1/url-filters` | 180 | 136 | Done |
| P1-7 | View-mode registry (`lib/config/view-modes.ts`) | `p1/view-registry` | 200 | 164 | Done |
| P1-8 | Filter registry (`lib/config/filters.ts`) | `p1/filter-registry` | 230 | 165 | Done |
| P1-9 | Store slices; fold in ui-store and network-store | `p1/store-slices` | 220 | 133 | Done |
| P1-10a | Move graph-context consumers to the store (first half) | `p1/context-out-1` | 200 | 93 | Done |
| P1-10b | Move the rest; context keeps only the graph ref | `p1/context-out-2` | 200 | 82 | Done |
| P1-11 | `persist` for preferences; remove array-safety and error-tracker | `p1/persist` | 90 | 42 | Done |
| P1-12 | Jest → Vitest | `mech/vitest` | mech. | mech. | Done (Vitest 5; Node 24 for PC, Docker and CI) |
| P1-13 | Playwright: 3 flows (search, filter, lasso → context), `data-node-count` hook | `p1/playwright` | 80 (+tests) | 61 | Done (`npm run e2e` builds the app and serves it on 3100) |
| P1-14 | Golden-set eval (recall@5/10, MRR) as a LangSmith dataset | `p1/eval` | 180 | | Paused for the search track |
| P1-15 | LangSmith tracing (`wrapOpenAI`, `traceable`) + JSON request logs | `p1/tracing` | 140 | | To do |
| P1-16 | CI jobs: type check, unit, Playwright, eval | `p1/ci` | 70 | | To do (CI already runs unit tests on Node 24) |

**Search track**

Builds toward workstreams; see [vision-architecture.md](./vision-architecture.md). Each task stays under 300 source lines.

| ID | Task | Branch | Status |
|---|---|---|---|
| S1 | Search errors on screen, with "Try again"; the ✕ clears only the text | `search/errors` | Done |
| S2 | Expandable search panel; filters beside the results when wide; tidy-up; results as a table (default) or cards | `search/panel-expand` | Done |
| S3a/b | Refine: re-rank the documents on screen with a second question; rank change (#7 → #2 ▲5) | `search/refine-*` | Later (works inside a workspace) |
| S7 | Save a search: becomes "save the workspace" (C4, then workstreams) | | Folded into C4 |

**Analysis panel track**

| ID | Task | Status |
|---|---|---|
| A1 | Side panels close to a thin rail; lined-up headers | Done |
| A2 | Context \| Chat \| Clusters tabs in the header; token line in Chat; matching widen buttons | Done |
| A3 | Chat best practices: follow-up memory (last 6), box at the bottom, Enter sends, real Stop, Claude-style box, bubbles | Done |
| A4 | Answers open as documents: copy, download, expand; [citations] linked to the graph; Sources | Done |
| A5 | Saved prompts: + window (use, edit, duplicate, delete, save a chat question), "/" menu, recent-first chips | Done |
| — | Clusters tab summary (count, AI overview, one line per cluster); chat takes up to 200 documents | Done |
| A6 | Chat actions: answers suggest up to 3 buttons (filter, colour, cluster, add to context), checked by the server; nothing changes until clicked; Undo | **In review** |

**Collect track (now): several searches in one workspace**

Search in rounds, collect the results in one graph, then ask big questions across all of them. The *workspace* is everything the searches found; the *context* is what you send to the AI. Scores from different searches don't compare, so each round keeps its own and a document's size and colour use its best.

| ID | Task | Branch | Est. | Status |
|---|---|---|---|---|
| C1 | Collect: "+" / Shift+Enter adds a search to the workspace (Search still replaces); one graph, no duplicates; "Found by #1 #2 ★" | `workspace/collect` | 220 | Done |
| C2 | "Searches" filter (tick a search, ★ found by 2+, ✕ remove a search) + colour and cluster by search | `workspace/searches-filter` | 150 | Done |
| F1 | Filters react to each other: each section counts what the other sections leave; empty options fade | `filters/facets` | 120 | Done |
| C3 | Context grouped by search (+ Top 10 / + All / Remove per search) or by AI cluster (Ask about this / Remove); overlap icon | `workspace/context-by-search` | 200 | Done |
| C4 | Workspace goal sent with every chat question; workspace kept in the browser (survives a refresh), AI clusters included; "New workspace" | `workspace/keep`, `workspace/keep-clusters` | 250 | Done |

**After the collect track**

| Area | Task | Notes |
|---|---|---|
| Phase 1 (rest) | P1-14 eval, P1-15 tracing, P1-16 CI | Eval is most useful once Refine/Collect change rankings |
| Housekeeping | Docker on Windows: file-watching by polling | Stops stale styles after changes |
| Workstreams | Database, workstreams, saved searches and sessions inside them | See vision-architecture.md, step 2 |
| Capture | URL → screenshot + Markdown + hashes → searchable | Step 3 |
| Monitoring | Scheduled re-runs and re-captures; changes and alerts | Step 4 |
| Housekeeping | PostHog through a reverse proxy | Before the demo, so ad blockers don't drop events |
| Housekeeping | Vercel preview links | Test pull requests from a phone |
| Housekeeping | React 19 + Next 16 | Clears the 4 remaining audit items and the `react@^19` warnings; Node 24 already meets Next 16 |
| Housekeeping | Small clean-ups | aria-labels on icon buttons; unused `SEARCH_DEBOUNCE_MS`; hard-coded `DOCUMENT_COUNT`; an `act()` warning in a slice test |
| On hold | Interpretations data (`data/interpretations`) | Tag-preserving loader |
| On hold | Hover label that stays highlighted after a quick click | Reagraph drag behaviour |

## Prompts

Copy these as they are, filling in the angle brackets.

### 1. Monday: plan the week

```
Read CLAUDE.md, docs/architecture-plan.md and docs/claude-workflow.md.

We're in Phase <N>. These items are not done yet: <paste the unchecked items, or "see the plan">.
I have <3> build sessions this week.

Break the work into tasks that each add at most 250 lines of source code
(tests, docs, data and deletions don't count). For each task give:
- ID, one-line goal, branch name (p<N>/<name>, or mech/<name> for mechanical work)
- files to change
- the test to write first
- done-when (checkable)
- estimated added source lines, with a one-line reason

Use vertical slices, "prepare then change", or "add beside, switch, delete" to split anything bigger.
Order tasks by dependency and fill <3> sessions. Don't write any code.
```

### 2. Turn one task into an issue

```
Write task <ID> as a GitHub issue body with these sections:
Goal, Files, Test first, Done when, Estimate (lines), Out of scope.
Keep it under 20 lines.
```

### 3. Start a build session

```
Read CLAUDE.md and docs/architecture-plan.md.

Task <ID>: <goal>
Branch: <branch> (create it from main)
Files: <files from the brief>
Done when: <done-when from the brief>
Out of scope: everything else.

Before writing code, tell me the files you'll change and your estimate of added
source lines. If it's over 250, stop and propose a split instead.

Then:
1. Write the failing test.
2. Implement until it passes.
3. Run `npm run diff:size` after each file. If you pass 300, stop and propose a split.
4. Run `npx tsc --noEmit`, `npm test` and `npm run diff:size`.
5. Commit on the branch with a message in the CLAUDE.md format.

End with: what changed, the diff-size output, and any follow-ups you noticed but didn't fix.
```

### 4. The task went over budget

```
Stop adding code. Summarize what's done and what's left.
Propose how to split the remaining work into tasks under 250 lines each,
using vertical slices or "add beside, switch, delete".
Then cut this branch back to the smallest piece that is complete,
tested and under 300 lines, and commit only that.
```

### 5. Mechanical change

```
Task <ID> is mechanical. Branch: mech/<name>.
Change: <rename / move / codemod / framework migration>.
Rules: no behavior changes, no new logic, no fixes along the way.
Prove it: the same tests pass before and after, and `npx tsc --noEmit` is clean.
List any spot where a purely mechanical change wasn't possible, and stop there
instead of improvising.
```

### 6. Review before merging

```
Review the branch <branch> against main as a strict senior reviewer.
Check: it does only task <ID>; the test would fail without the change;
no console.log, no unrelated edits, no `any` added; it follows the architecture
rules in CLAUDE.md; error paths are handled.
Report problems as a numbered list with file and line. Don't fix anything yet.
```

### 7. Fix a bug

```
Bug: <what happens>, expected <what should happen>, steps: <steps>.
Branch: p<N>/fix-<name>.
First write a test that reproduces it and fails. Then make the smallest fix.
Budget: 100 added source lines. If the fix needs more, explain why and stop.
```

### 8. Friday: check the gate

```
Read the Phase <N> success criteria in docs/architecture-plan.md.
For each criterion, check it (run the command or test that proves it) and
report pass, fail, or can't verify, with the evidence.
List branches ready to merge into main and anything that blocks the gate.
Append a dated entry to docs/progress.md: tasks merged, criteria passed,
what's next. Don't merge anything yourself.
```

### 9. Re-plan when a week slips

```
These tasks didn't finish this week: <IDs>. Reason: <reason>.
Re-plan the remaining Phase <N> tasks into next week's <3> sessions,
keeping every task under 250 lines. Say which success criteria are now at risk
and whether the phase gate date in docs/architecture-plan.md should move.
```

## Your part each week

- **Review every diff.** About 15 minutes per task at this size.
- **Click through the app** after each merge: search, filter, cluster, chat.
- **Own the judgment calls:** what goes in the golden set, whether an impact score is right, what customers say.
- **Merge on Friday** after the gate prompt, then delete merged branches.

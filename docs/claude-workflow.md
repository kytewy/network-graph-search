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

## Phase 0 and Phase 1, already split

Estimates are added source lines. Two or three small tasks fit in one session.

**Phase 0 — correctness (Nov 23–29)**

| ID | Task | Branch | Est. |
|---|---|---|---|
| P0-1 | Clustering reads document text (`text` → `content`), with a test | `p0/cluster-text-field` | 30 |
| P0-2 | Search shows the route's `error` message, with a test | `p0/search-error-message` | 15 |
| P0-3 | Pinecone reranking (topK 40 → topN 10), behind the existing flag | `p0/rerank` | 50 |
| P0-4 | Filters change membership only via Pinecone; browser filters display only | `p0/single-filtering` | 120 |
| P0-5 | `AbortController` at the 7 fetch sites | `p0/abort-signals` | 90 |
| P0-6 | Cluster assignments as an immutable map; no in-place mutation | `p0/cluster-map` | 110 |
| P0-7 | OpenAI client timeout and retries; safe JSON parse | `p0/openai-timeouts` | 35 |
| P0-8 | Redirect `/` to `/graph`; `app/graph/error.tsx` | `p0/routing-errors` | 60 |
| P0-9 | Sentry; remove Vercel Analytics; delete empty hook file | `p0/sentry` | 80 |
| P0-10 | `interpretation` document type: color, legend, filter (data excluded) | `p0/interpretation-type` | 150 |

**Phase 1 — foundations (Dec 7–20)**

| ID | Task | Branch | Est. |
|---|---|---|---|
| P1-1 | zod contract for search + route validation | `p1/search-contract` | 150 |
| P1-2 | `toApiNode()`; store uses it; delete normalizer and route node mapping | `p1/to-api-node` | 120 |
| P1-3 | Typed API client + `useSearch` (TanStack Query) wired to the search box | `p1/use-search` | 200 |
| P1-4 | Query hooks for clusters, analyze and documents | `p1/query-hooks` | 240 |
| P1-5 | nuqs adapter; query and topK in the URL | `p1/url-query` | 130 |
| P1-6 | Filters and view modes in the URL | `p1/url-filters` | 180 |
| P1-7 | View-mode registry; controls, colors and legend read from it | `p1/view-registry` | 200 |
| P1-8 | Filter registry; panel and Pinecone filter builder read from it | `p1/filter-registry` | 230 |
| P1-9 | Zustand `view` and `selection` slices with `useShallow` | `p1/store-slices` | 220 |
| P1-10a | Move graph-context consumers to hooks (first half) | `p1/context-out-1` | 200 |
| P1-10b | Move the rest; context keeps only the graph ref | `p1/context-out-2` | 200 |
| P1-11 | `persist` for preferences; remove array-safety and error-tracker | `p1/persist` | 90 |
| P1-12 | Jest → Vitest | `mech/vitest` | mech. |
| P1-13 | Playwright: 3 flows, `data-node-count` hook | `p1/playwright` | 80 (+tests) |
| P1-14 | Golden-set eval script (recall@5/10, MRR) as a LangSmith dataset | `p1/eval` | 180 |
| P1-15 | LangSmith tracing (`wrapOpenAI`, `traceable`) + JSON request logs | `p1/tracing` | 140 |
| P1-16 | CI jobs: type check, unit, Playwright, eval | `p1/ci` | 70 |

Phase 1 is 17 tasks for about 6 sessions, so it runs slightly over; the holiday buffer absorbs it. Plan Phases 2–4 the same way each Monday with the planning prompt.

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

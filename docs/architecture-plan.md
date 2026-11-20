# Architecture Improvement Plan

> Written 20 November 2026, against `main` at `0c5d02c`. Companion to [codebase-assessment.md](./codebase-assessment.md).

Evolve the app in place, in five phases over about 14 weeks part-time, ending in a pilot-ready regulatory radar by late February 2027. No rewrite, no separate API service and no vector-database migration are needed. The order is set by dependencies:

1. **Fix correctness first.**
2. **Separate the three kinds of state.** Server data, URL state and UI state each get one home.
3. **Add Postgres.** It becomes the system of record.
4. **Improve retrieval against a measured baseline.**
5. **Build the radar features on top.**

## Where we are

| Area | Today | Problem |
|---|---|---|
| Server data | Fetched in components (7 call sites) and copied into a 561-line Zustand store | Stale data, no cancellation, a newer search can be overwritten by an older response |
| Shared state | One React context with ~35 values | Every change re-renders every consumer, including the graph |
| Node shape | Built in 3 places: search route, `processApiResponse`, `SearchDataNormalizer` | A new document field touches 6–7 files |
| Modes and filters | String unions copied into 4+ files; similarity ranges hardcoded in `applyFilters` and in `SEARCH_CONFIG` | Adding a mode touches 6 files; two sources of truth |
| Filtering | Sent to Pinecone at search time *and* re-applied in the browser | Removing a filter doesn't bring back documents until the next search |
| Persistence | None; tags live in Pinecone metadata | Workspace, clusters and chats are lost on refresh |
| Retrieval | Whole articles as single records; `useReranking` never applied | Long articles are cut off at 2,048 tokens when embedded; no reranking |
| Clustering | New Python process per request, TF-IDF on 100 features | **Runs on titles only** (see Phase 0); about 1 s of start-up per request |
| Hosting | Render free plan, in-memory rate limiter | Sleeps after 15 minutes idle; limits reset on every wake |
| Observability | `console.error`; Vercel Analytics on Render (does nothing) | Errors and LLM spend are invisible |

## Target architecture

```
Browser (client-only graph page)
├── URL state (nuqs)          query, filters, topK, view modes — shareable, refresh-safe
├── Server state (TanStack Query)   search, clustering, analysis, workspaces — cached, cancellable
├── UI state (Zustand slices) panel layout, selection, drafts — small, persisted where useful
└── GraphView                 Reagraph behind one interface, so the renderer can be swapped

Next.js route handlers  (one HTTP surface; zod-validated contracts in lib/contracts)
├── /api/search               Pinecone searchRecords + rerank → toApiNode()
├── /api/clusters             k-means on stored embeddings (TypeScript, no Python)
├── /api/analyze/*            LLM calls with timeouts, spend cap, LangSmith tracing
├── /api/workspaces, /chats   Postgres via Drizzle
└── /api/radar/run            daily cron trigger → LangGraph.js workflows (Phase 4)

Data
├── Postgres (Neon or Supabase) system of record: documents, versions, chunks, tags,
│                               workspaces, chats, llm_calls, use cases, impact cells
├── Pinecone                    vectors + filterable metadata only (IDs, type, country, version)
├── Upstash Redis               rate limits and daily spend counter
├── LangGraph checkpoints       radar workflow state in Postgres, so runs resume after a crash
└── Exa Monitors                discovery of new interpretations (Phase 4)
```

**Principles**

- **One home per piece of state.** Never copy server data into Zustand.
- **One contract per endpoint.** A zod schema is shared by the route and the client, uses camelCase on the wire, and is converted once at the boundary.
- **One registry per concept.** Each set of view modes and filters is an `as const` array that drives types, controls, legend and URL parsing.
- **Measure before changing retrieval.** No chunking or reranking change ships without a recall@10 comparison.
- **Postgres is the source of truth.** Pinecone is an index that can be rebuilt from it.

## Phase 0 — Correctness and safety (Nov 23–29)

| Change | Files |
|---|---|
| **Clustering reads the right field.** The UI sends `text`; the route and `analyzer.py` read `content`, so clustering uses titles. Accept `text` in the route (map to `content`) | `app/api/cluster-analysis/route.ts`, `components/analysis/ClusteringInterface.tsx` |
| **Show real search errors.** The route now returns `{ error }` but the store reads `data.message` | `lib/stores/app-state.ts` (`performSearch`) |
| Apply reranking: over-fetch topK 30–50, rerank with `bge-reranker-v2-m3` to topN 10 | `lib/services/vector_search.ts` |
| Filter in one place: Pinecone filters change result membership; the browser filters only display toggles | `lib/stores/app-state.ts` (`applyFilters`), `lib/utils/pinecone-filters.ts` |
| Pass an `AbortSignal` to every fetch (interim, until Phase 1) | the 7 fetch sites in `components/` and `lib/stores/` |
| Stop mutating store objects: keep cluster assignments as a `Record<nodeId, clusterId>` | `lib/contexts/network-graph-context.tsx`, `lib/stores/context-store.ts` |
| OpenAI client: `timeout: 20_000`, `maxRetries: 2`; guard `JSON.parse` | `lib/utils/openai-client.ts` |
| Redirect `/` to `/graph`; add `app/graph/error.tsx` | `app/page.tsx`, `app/graph/error.tsx` |
| Remove `@vercel/analytics`; add Sentry | `app/layout.tsx`, `package.json`, `sentry.*.config.ts` |
| Delete the empty `hooks/use-graph-selection-impl.ts` | — |
| Move the Render service to Starter (always on) | `render.yaml` |
| Hand-curate 10–20 Article 50 interpretations as an `interpretation` document type for the demo | `scripts/data/`, `scripts/upload_all_data.py` |

**Success criteria**

- [ ] Clustering of 6 known documents groups them by text, not title (test with fixed input).
- [ ] A failing search shows the route's error message.
- [ ] Search results change when reranking is toggled; topN is 10.
- [ ] Removing a filter restores the documents it hid without a manual re-search.
- [ ] A slow OpenAI call fails within 20 s instead of hanging.
- [ ] `/` opens the graph; a thrown render error shows the error page.
- [ ] Sentry receives a test error from production.
- [ ] First request after an idle hour responds in under 3 s.

## Phase 1 — Foundations (Dec 7–20)

**1. Contracts and one node builder**
- `lib/contracts/search.ts`, `clusters.ts`, `analyze.ts`, `documents.ts`: zod request and response schemas.
- `lib/contracts/node.ts`: `toApiNode()`, the only place Pinecone fields become a `Node`.
- Route handlers call `Schema.safeParse()` and return 400 with flattened errors.
- Delete the search route's unused `nodes`/`edges` mapping and the `rawResponse` passthrough; delete `processApiResponse` and `SearchDataNormalizer`.

**2. Server state with TanStack Query v5**
- `lib/api/client.ts`: a typed fetch wrapper that forwards `signal`.
- `hooks/queries/use-search.ts`, `use-clusters.ts`, `use-analyze.ts`, `use-documents.ts`.
- Search key `['search', query, filters, topK]` with `placeholderData: keepPreviousData`.

**3. URL state with nuqs**
- `NuqsAdapter` in `app/layout.tsx`; `lib/url-state.ts` with typed parsers for query, filters, topK and view modes; `throttleMs: 400` on the search box.

**4. Smaller client state**
- Split `app-state.ts` into slices: `view` (layout, labels), `selection`, `workspace` (until Phase 2). Use `useShallow` for multi-value selectors.
- Fold `ui-store` and `network-store` into those slices.
- Replace `NetworkGraphContext` with direct hooks; keep a tiny context only for the graph ref.
- `persist` (Zustand ≥ 5.0.10) with `partialize` for view preferences and drafts only.
- Remove `lib/utils/array-safety.ts` and `error-tracker.ts` once types guarantee arrays.

**5. Registries**
- `lib/config/view-modes.ts`: `COLOR_MODES`, `SIZE_MODES`, `CLUSTER_MODES` as `as const` arrays with label, color function and legend entry.
- `lib/config/filters.ts`: each filter declared once (field, kind, options) and read by the panel, the URL parser and the Pinecone filter builder. Similarity ranges come only from here.

**6. Tests and visibility**
- Migrate Jest to Vitest; MSW for Pinecone and OpenAI.
- Playwright: search → results and node count; filter → URL updates; select → cluster.
- Expose `data-node-count` on the graph container for tests.
- `scripts/eval/golden.json` (50+ queries → expected article IDs) and `scripts/eval/run.ts` (recall@5, recall@10, MRR). Record the baseline.
- LangSmith tracing: wrap the OpenAI client with `wrapOpenAI` and the search, cluster and analyze functions with `traceable` from the `langsmith` package (no LangChain needed); set `LANGSMITH_TRACING`, `LANGSMITH_API_KEY` and `LANGSMITH_PROJECT`. One JSON log line per request with route, status, latency, Pinecone read units and tokens.
- Run the golden set as a LangSmith dataset and experiment, so each retrieval change is compared side by side.
- CI: separate `tsc --noEmit`, ESLint, Vitest, Playwright and eval jobs.

**Success criteria**

- [ ] Adding a document field touches at most 2 files (contract and mapper), shown by doing it once.
- [ ] Adding a color mode touches 1 file (the registry).
- [ ] Pasting a search URL into a new tab reproduces the same results and view.
- [ ] Typing quickly in search never shows an older query's results.
- [ ] `app-state.ts` is gone; no store file exceeds 200 lines; the context holds at most 3 values.
- [ ] Baseline recall@10 is recorded in `docs/eval-results.md`.
- [ ] 3 Playwright tests and the eval run pass in CI.
- [ ] Every LLM call appears in LangSmith with tokens, latency and cost, grouped under its request.

## Holiday buffer (Dec 21–Jan 3)

Light work only: label the golden set and 30 impact cells with a lawyer or compliance contact; hold customer interviews.

**Success criteria**

- [ ] 50+ labelled search queries in `scripts/eval/golden.json`.
- [ ] 30 lawyer-labelled use case × obligation cells in `scripts/eval/impact-golden.json`.

## Phase 2 — Persistence (Jan 4–17)

| Change | Files |
|---|---|
| Neon or Supabase Postgres with Drizzle; SQL migrations committed and run in CI/deploy | `db/schema.ts`, `db/migrations/`, `drizzle.config.ts` |
| Tables: `documents`, `document_versions`, `articles`, `chunks`, `tags`, `workspaces`, `chats`, `messages`, `llm_calls` | `db/schema.ts` |
| Tags move from Pinecone metadata to Postgres (per workspace) | `app/api/documents/tags/route.ts` |
| Workspaces and chats saved and reloaded | `app/api/workspaces/`, `app/api/chats/`, query hooks |
| Upstash rate limiting replaces the in-memory limiter; daily spend counter refuses LLM routes at the cap | `lib/utils/api-guard.ts` |
| Login for private workspaces (Supabase Auth if on Supabase, otherwise Auth.js) | `app/(auth)/`, middleware |
| Ingestion rewritten as an idempotent script: source files → Postgres → Pinecone, keyed by `content_hash`; data moved out of `data_canada.py` and the upload script into `scripts/data/` | `scripts/ingest.ts` (or `.py`) |

**Success criteria**

- [ ] A workspace with 20 nodes, 3 clusters and a chat survives refresh, logout/login and a redeploy.
- [ ] Re-running ingestion twice writes no duplicate rows or vectors.
- [ ] Pinecone metadata holds only IDs and filter fields; full text comes from Postgres.
- [ ] Every LLM call has a row in `llm_calls` with tokens and cost.
- [ ] Hitting the daily spend cap returns 429 on LLM routes while search keeps working.
- [ ] A second user cannot see the first user's private workspace.

## Phase 3 — Retrieval quality and scale (Jan 18–31)

| Change | Files |
|---|---|
| Re-ingest as paragraph-aware chunks (≤ 512 tokens, points (a)–(h) kept together) with `article_id`, `paragraph_ref`, `doc_version`, `chunk_index` | `scripts/ingest.ts`, `lib/ingest/chunker.ts` |
| Parent-document retrieval: search chunks, show and send whole articles from Postgres | `app/api/search/route.ts` |
| Compare `bge-reranker-v2-m3`, `pinecone-rerank-v0` and no reranking on the golden set; try hybrid search in a new index | `scripts/eval/` |
| Clustering in TypeScript on stored embeddings (fetch vectors by ID), k chosen by silhouette over 2–8 | `lib/clustering/kmeans.ts`, `app/api/clusters/route.ts` |
| Remove Python from the Docker image; multi-stage build with `output: 'standalone'` and a non-root user | `Dockerfile`, `next.config.mjs` |
| Graph cap of 300 nodes with an "aggregate by article" mode; Reagraph behind a `GraphView` interface | `components/network/` |

**Success criteria**

- [ ] No chunk exceeds 512 tokens; no article is truncated at embedding.
- [ ] recall@10 is at least 10 points above the Phase 1 baseline, and no golden query gets worse by more than 2 ranks.
- [ ] The chosen reranker setting is recorded with its numbers in `docs/eval-results.md`.
- [ ] Clustering 300 documents takes under 1 s; the image has no Python and runs as a non-root user.
- [ ] The graph stays above 30 FPS at 300 nodes on a mid-range laptop.

## Phase 4 — Regulatory radar (Feb 1–21)

| Change | Files |
|---|---|
| Tables: `regulators`, `obligations`, `use_cases`, `impact_cells` (risk, reason, clause, model, prompt version, review status), `interpretations` (source, tier, stance, claims, citations), `snapshots`, `changes` | `db/schema.ts` |
| Obligation extraction as a LangGraph graph: the LLM drafts obligations per article, then an `interrupt` pauses for a person to approve or edit before saving | `lib/radar/graphs/obligations.ts`, review UI |
| Impact scoring: Haiku per cell, citing a clause; results stored with review status | `lib/radar/score-impact.ts` |
| LangGraph.js ingestion graph: fetch official sources (EUR-Lex, AI Office) with conditional GETs → hash each paragraph → write `changes` → re-embed and re-score only what changed. A Postgres checkpointer (`@langchain/langgraph-checkpoint-postgres`) lets a failed run resume; a daily cron job (Render Cron Job) calls `/api/radar/run` | `lib/radar/graphs/ingest.ts`, `app/api/radar/run/route.ts` |
| Exa Monitors v2 webhook: each new item starts a LangGraph run that extracts source, stance and citations into `interpretations`, logged to `llm_calls` | `app/api/webhooks/exa/route.ts` |
| Summary tree as a LangGraph graph: small model at leaves, larger model at the top, recomputed only along changed branches | `lib/radar/graphs/summary-tree.ts` |
| Views: impact table, interpretation map with divergence, timeline slider over `changes`, ingredient label | `components/radar/` |

**Success criteria**

- [ ] One design partner's 10+ use cases are scored against Article 50 and one other regulation, each cell citing a clause.
- [ ] At least 80% agreement with the 30 lawyer-labelled cells; disagreements are listed for review.
- [ ] A changed source paragraph re-scores only the affected cells within 24 hours, with no full rebuild.
- [ ] The timeline replays at least two dated changes for one regulation.
- [ ] Each answer's ingredient label shows source mix, freshness and gaps.
- [ ] Monthly cost per design partner is visible from `llm_calls` and under a set budget.

## Pilots and YC (Feb 22–28)

**Success criteria**

- [ ] 3–5 design partners onboarded; at least 3 active weekly.
- [ ] At least 1 paying customer or signed letter of intent.
- [ ] YC Spring 2027 application submitted with these usage numbers (confirm the deadline on YC's site).

## Working week with Claude

The plan assumes about 15–20 hours a week. Claude writes and tests the code; you decide what gets built, review every change and do the work only you can do (customer calls, labelling, judging impact scores).

**Weekly rhythm**

| When | Time | What |
|---|---|---|
| Monday | 1 hour | Pick the next unchecked items in the current phase. Ask Claude (in plan mode) to turn each into a task brief: goal, files, test to write, done-when. Save them as GitHub issues |
| Tuesday–Thursday | 3 sessions of 3–4 hours | One task per Claude session, one branch per task (e.g. `p1/search-contract`). Claude writes the test first, implements, runs the checks and commits on the branch. You review the diff and click through the app for 5 minutes |
| Friday | 1–2 hours | Run the phase's success criteria, tick what passed, merge finished branches into `main`, note progress in `docs/progress.md`, record a short demo clip |
| Weekend | Optional | Customer conversations, labelling the golden set, writing |

**Rules that keep sessions productive**

- **Small tasks.** Aim for under about 300 changed lines per session; split anything bigger.
- **Same opening prompt.** "Read `CLAUDE.md` and `docs/architecture-plan.md`. Do Phase N, item X only. Write the test first. Run the type check, tests and eval. Don't change files outside the list."
- **Always verify.** No merge until `tsc --noEmit`, the unit tests, Playwright and (from Phase 1) the eval script pass.
- **One branch per task, merge on Friday.** `main` always runs.
- **Keep a `CLAUDE.md`** at the repo root with the commands, the architecture rules (contracts in `lib/contracts`, no server data in Zustand, one registry per concept), branch naming and "never edit `.env`".

**First three weeks as Claude tasks**

| Week | Claude sessions | Your work |
|---|---|---|
| Nov 23–29 (Phase 0) | 1: clustering text field + search error message, with tests. 2: reranking + single-place filtering + abort signals. 3: OpenAI timeouts, error pages, `/` redirect, Sentry, remove Vercel Analytics | Curate 10–20 Article 50 interpretations; move Render to Starter |
| Nov 30–Dec 6 (demo) | 1: add the `interpretation` document type and colors. 2: demo polish and a fixed demo URL. 3: buffer for fixes | Record the 60-second video, publish by Dec 2, book conversations |
| Dec 7–13 (Phase 1) | 1: zod contracts + `toApiNode()` for search. 2: TanStack Query hooks + typed client. 3: nuqs URL state | Start labelling golden queries |

## Decisions and alternatives

| Decision | Chosen | Alternative, and when to switch |
|---|---|---|
| API style | Route handlers + zod contracts | tRPC/oRPC past ~15 endpoints or a second client |
| Server state | TanStack Query v5 | SWR if mutations stay trivial |
| URL state | nuqs | Hand-rolled `useSearchParams` for 1–2 params only |
| Database | Postgres (Neon or Supabase) + Drizzle | Prisma 7 if you prefer nested writes and Studio |
| Vectors | Keep Pinecone (integrated embedding + rerank) | pgvector once SQL joins in filters matter; corpus is small enough |
| Clustering | TypeScript k-means on embeddings | FastAPI or Modal with BERTopic for corpus-wide topics |
| Workflows | LangGraph.js 1.x with a Postgres checkpointer, started by a daily cron call | Inngest or Trigger.dev if you need many scheduled, non-LLM jobs with fan-out and retries |
| Observability | Sentry + LangSmith + JSON logs | Langfuse if you want open-source self-hosting or more free seats |
| Graph | Reagraph 4.32.0 (latest, June 2026) behind `GraphView` | Sigma.js + Graphology above 1–2k interactive nodes |
| Framework | Stay on Next.js 15.5 | Next.js 16 after Phase 4, when the refactor is stable |

## Risks

- **Reranking may not help on legal text.** A legal benchmark (LegalBench-RAG) found a reranker underperformed no reranker on contracts. Keep reranking only if the golden set says so.
- **Pinecone may not return vectors from `searchRecords`.** Clustering on embeddings may need a separate `fetch` by ID; confirm early in Phase 3.
- **Reagraph performance figures are dated** (a 2023 report of 12–28 FPS at 400+ nodes). Measure with real data before switching renderers.
- **LangSmith's free plan is small.** The Developer plan has 1 seat and 5,000 base traces a month with 14-day retention; extra traces cost $2.50 per 1,000, and Plus is $39 per seat a month. A LangGraph run can produce several traces, so watch usage once Phase 4 workflows run daily.
- **Prices change.** Exa Monitors dropped to $2 per 1,000 runs in October 2026; Render Starter is $7/month; check both before relying on them.
- **Part-time capacity.** The plan assumes about 15–20 hours a week and takes about 7–8 weeks full-time. The holiday buffer absorbs one slipped week; a second slip moves pilots into March.

## Sources

- Pinecone: [integrated embedding](https://docs.pinecone.io/guides/search/integrated-embedding), [index configuration](https://docs.pinecone.io/guides/indexes/index-configuration), [TypeScript integrated inference guide](https://github.com/pinecone-io/pinecone-ts-client/blob/HEAD/guides/inference/integrated-inference.md)
- Chunking: [Chroma chunking evaluation](https://research.trychroma.com/evaluating-chunking), [StrucChunk preprint](https://arxiv.org/abs/2610.26313), [LegalBench-RAG](https://arxiv.org/pdf/2408.10343v1)
- Clustering: [BERTopic clustering guide](https://maartengr.github.io/BERTopic/getting_started/clustering/clustering.html), [scikit-learn HDBSCAN](https://scikit-learn.org/1.3/modules/generated/sklearn.cluster.HDBSCAN.html)
- Graph performance: [Reagraph issue #113](https://github.com/reaviz/reagraph/issues/113)
- Next.js testing: [Vitest setup](https://nextjs.org/docs/14/app/building-your-application/testing/vitest)
- Hosting: [Render free tier](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026)
- LangSmith: [tracing OpenAI calls](https://docs.langchain.com/langsmith/trace-openai), [pricing guide](https://inference.net/content/langsmith-pricing/)
- LangGraph: [v1 release notes](https://docs.langchain.com/oss/javascript/releases/langgraph-v1), [checkpointers](https://docs.langchain.com/oss/javascript/langgraph/checkpointers)

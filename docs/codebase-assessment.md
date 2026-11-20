# Codebase Assessment

> Assessed 19 November 2026 at commit `0c5d02c` (main), after the type-safety, API-hardening and cleanup changes.

The app is a polished, working demo with a clear product story, and the foundations are now sound: it type-checks, builds on Next.js 15.5, and its public routes are rate limited and size capped. The weak spots are structural rather than cosmetic: **nothing is saved between sessions**, **adding a document field or view touches six or more files**, **there is no observability**, and a few behaviors don't match what the code or docs claim (reranking, embedding model). These are the same gaps the regulatory radar spec needs closed, so fixing them doubles as preparation for it.

## Scorecard

Scores are 1 (weak) to 5 (strong).

| # | Dimension | Score | Summary |
|---|---|---|---|
| 1 | Features | 4 | Search, graph, clustering, chat, filters, tags, lasso all work end to end |
| 2 | Ease of adding features | 2 | Logic for one concept is spread across 5–7 files; node data is shaped in 3 places |
| 3 | Architecture and modularity | 3 | Sensible layers, but one 560-line store is the hub for 21 files |
| 4 | State and saving | 1 | Everything except tags is lost on refresh; no URL state, no database |
| 5 | Data model and pipeline | 2 | One-shot scripts, no versioning, docs disagree with the index setup |
| 6 | Scale and performance | 3 | Fine at demo scale; per-request Python process and in-memory limits cap growth |
| 7 | Reliability and error handling | 2 | Errors logged, but no error pages, retries or timeouts on external calls |
| 8 | Security and cost | 3 | Rate limits, caps and read-only tags now in place; no auth or spend limits |
| 9 | Testing and CI | 2 | 20 tests covering one store and the API guards; no UI, search-route or Python tests |
| 10 | Developer experience | 4 | Docker hot reload, clear README and docs; ESLint not configured |
| 11 | Observability | 1 | `console.error` only; analytics package does nothing on Render |
| 12 | AI and ML quality | 2 | Reranking not applied, clustering ignores existing embeddings, no evals |
| 13 | Readiness for the radar spec | 2 | Graph and UI reusable; persistence, versions and use cases all missing |

## 1. Features — 4/5

**What works end to end**

- Semantic search over Pinecone with topK from 5 to 100 and metadata filters (continent, country, source type, tags, similarity range).
- Reagraph graph with force-directed, concentric and radial layouts, four color modes, node sizing, labels, lasso selection and a node context menu.
- Context workspace: add nodes, run TF-IDF + KMeans clustering, name clusters with GPT-4o-mini, send a cluster to chat.
- Chat over selected documents with citations, edit and re-run.
- Document reading overlay and tagging (tag writes are now off in production unless `ALLOW_TAG_WRITES=true`).

**Gaps and rough edges**

- **The home page is a 404.** There is no `app/page.tsx`; only `/graph` exists. Add a redirect from `/` to `/graph`.
- **"Reranked" search is not reranked.** `searchPinecone()` in `lib/services/vector_search.ts` accepts `useReranking` but never uses it; the query has no `rerank` block.
- **Nothing persists** (see section 4), so the workspace, clusters and chats vanish on refresh.

## 2. Ease of adding features — 2/5

Four realistic changes, traced through the code:

| Change | Files touched | Where |
|---|---|---|
| New document field (e.g. `effectiveDate`) | 6–7 | `vector_search.ts` field list, the search route's node map, `app-state.ts` `processApiResponse`, `lib/config/types.ts`, `search-data-normalizer.ts`, `use-graph-data.ts`, `DocumentOverlay.tsx` |
| New color mode | 6 | the mode union (written twice in `app-state.ts`), `VisualizationControls.tsx`, `node-colors.ts`, `ColorLegend.tsx`, `use-graph-visualization-settings.ts`, `lib/theme/colors.ts` |
| New filter (e.g. by date) | 4–5 | `app-state.ts` state, toggle and `applyFilters`, `pinecone-filters.ts`, `FilterPanel.tsx` plus a new filter component |
| New API route | 1–2 | a `route.ts` plus `lib/utils/api-guard.ts` — the easiest change |

**Why it's costly**

- **Node data is shaped in three places:** the search route builds `nodes` and `edges`, `app-state.processApiResponse()` rebuilds them from `rawResponse`, and `SearchDataNormalizer` normalizes again. The browser uses only the second, so the route's work is dead code that still has to be kept in sync.
- **Enumerations are repeated by hand.** Color modes, cluster modes and size modes are string unions copied into several files instead of one config object that drives the controls, colors and legend.

**Recommendations**

1. Build nodes in one place (a shared `toNode()` used by the store), and delete the route's unused node and edge mapping.
2. Define each visualization mode once in `lib/config` (id, label, color function, legend) and generate the controls from it.
3. Describe filters declaratively (field, kind, options) so the panel, store and Pinecone filter builder all read from one list.

## 3. Architecture and modularity — 3/5

- **Good:** feature folders (`search`, `filters`, `network`, `analysis`), a shared `lib/` layer, prompts centralized in `analysis-prompts.ts`, and a Python process boundary with JSON on stdin and no shell.
- **`app-state.ts` is a hub.** At 561 lines it holds search, results, filters, visualization settings and the API call, and 21 files import it. Meanwhile `ui-store` is used by 1 file and `network-store` by 2, so the four-store split is uneven rather than domain-driven.
- **Three type definitions became one** in this round (`lib/config/types.ts`), which removed the largest source of type errors.

**Recommendations:** split `app-state.ts` into `search` (query, results, API) and `view` (filters, colors, layout) slices; fold `ui-store` and `network-store` into those slices; keep `context-store` for the workspace.

## 4. State and saving — 1/5

| State | Where it lives | Survives refresh? | Shareable? |
|---|---|---|---|
| Query, results, filters, view settings | Zustand, in memory | No | No — nothing in the URL |
| Context nodes, clusters, cluster names | Zustand, in memory | No | No |
| Chat conversations | Zustand, in memory | No | No |
| Tags | Pinecone metadata | Yes | Yes, but writes are global (every visitor sees every tag) |

There is no `persist` middleware, no `localStorage`, no URL search params and no database.

**Recommendations, in order**

1. **URL state** for query, topK and filters (a few hours): makes searches shareable and refresh-safe.
2. **`zustand/persist` to `localStorage`** for the workspace and chats (a few hours): survives refresh on one browser.
3. **Postgres** (Neon or Supabase) for saved workspaces, chats and per-user tags (a few days). This is also the database the radar spec needs for versions, use cases and impact cells.

## 5. Data model and pipeline — 2/5

- **Ingestion is a one-shot script** (`scripts/upload_all_data.py`) over two JSON files, scraped once in September 2025. Uploads are idempotent by ID, but there is no schedule, no change detection and no version history.
- **The docs disagree with the index.** The README and architecture doc say OpenAI `text-embedding-ada-002` with 1536 dimensions, but the upload script creates a Pinecone integrated index with **`llama-text-embed-v2`**. `/api/documents/list` queries with a 1536-dimension zero vector; if the index uses that model's default dimension this call will fail. **Verify against the live index.**
- **Cross-references** are stored as `connected_to` ID lists in metadata, and edges are only drawn between documents in the same result set.
- **Fixed in this round:** EU AI Act articles and recitals were labelled `NGO`; they are now `Government`, and 87 articles had leftover HTML stripped. **Re-run the upload** to apply this to Pinecone.

**Recommendations:** keep raw snapshots with fetch dates; add a `version` and `fetched_at` to each record; move metadata and relationships to Postgres and keep Pinecone for vectors only.

## 6. Scale and performance — 3/5

**Measured**

| Check | Result |
|---|---|
| Clustering, 50 documents | 2.3 s, including about 1 s of Python start-up and scikit-learn import |
| Clustering, 300 documents | 1.3 s |
| Clustering, 1,200 documents | 1.4 s |
| Client JavaScript (all chunks, uncompressed) | 2.7 MB, with the graph loaded lazily |

**Limits that matter**

- **A new Python process per clustering request.** Start-up cost dominates at small sizes, and concurrent requests each start their own interpreter. A long-running worker (FastAPI, or Modal) removes this.
- **Graph size is capped by search:** topK is at most 100, so the graph never shows more than 100 nodes; clustering accepts up to 500.
- **Search responses carry the data twice:** the route returns its own `nodes` and `edges` plus the full `rawResponse`, and it requests an `embedding` field from Pinecone. Dropping the unused copy roughly halves the payload.
- **Single instance assumptions:** the rate limiter is in memory, and Render's free plan sleeps when idle, so the first request after a quiet period is slow.

## 7. Reliability and error handling — 2/5

- **Good:** API routes catch errors, log them server-side and now return generic messages; the Python process is killed after 30 s; the store test covers search failure.
- **Missing:**
  - No `app/error.tsx` or `app/graph/error.tsx`, so a rendering error shows Next.js's default error screen.
  - No timeout or retry on OpenAI and Pinecone calls; a slow provider holds the request open.
  - `getJSONCompletion()` calls `JSON.parse` on model output without a fallback.
  - The UI has no offline or "service unavailable" state when Pinecone isn't configured.

**Recommendations:** add route-level error pages; set `timeout` and `maxRetries` on the OpenAI client; wrap the JSON parse; show a friendly empty state when the backend reports it isn't configured.

## 8. Security and cost — 3/5

**In place now:** per-IP rate limits (20/min for LLM routes, 10 for clustering, 60 for search, 30 for tags), input caps, a 30 s Python timeout, generic errors, read-only tags in production, API keys server-side only, `.env` gitignored, and Next.js 15.5.29 with the critical advisories fixed.

**Still open**

- **No authentication**; anyone can use the LLM features within the rate limits.
- **No spend ceiling.** Rate limits slow a single visitor but don't cap total OpenAI cost. Set a monthly budget in the OpenAI dashboard.
- **Two remaining audit findings** come from the PostCSS copy bundled inside Next.js (one high, one moderate). Both are fixed only in Next.js 16.
- **The Docker image runs as root** and ships compilers (`make`, `g++`). A multi-stage build with a non-root user is smaller and safer.

## 9. Testing and CI — 2/5

| Area | Tests |
|---|---|
| `app-state` store: search, topK, continent filters | 10 |
| API guard: rate limits, truncation, tag-write switch | 6 |
| `/api/analyze-nodes`: validation, success, hidden errors | 4 |
| Components, hooks, search route, tags route, clustering route | 0 |
| Python `analyzer.py` | 0 |

**CI** (`.github/workflows/ci.yml`) runs `npm test`, then a Docker build that runs `next build`, which now fails on type errors. It does not run a separate type check or lint step.

**Recommendations:** add `tsc --noEmit` as its own CI step for faster feedback; add `pytest` cases for `analyzer.py` with fixed inputs; add route tests for search and tags; add one Playwright smoke test (search, then the graph renders).

## 10. Developer experience — 4/5

- **Good:** `docker compose up` with hot reload, a clear README with troubleshooting, decision records in `docs/`, a Windows-aware Python path lookup, and documented `.env` settings (`ALLOW_TAG_WRITES`, `NEXT_PUBLIC_DEBUG`).
- **To improve:** ESLint isn't configured (`next lint` prompts for setup), and builds skip linting; there's no `npm run typecheck` script; `.github/workflows/ci.yml`, `docker-compose.yml` and two other files have mixed line endings on Windows. Add a `.gitattributes` with `* text=auto eol=lf`.

## 11. Observability — 1/5

- Server errors go to `console.error` only; there's no error tracking, request logging or metrics.
- **`@vercel/analytics` does nothing on Render** — it only works on Vercel. Remove it or swap in an analytics tool that works anywhere.
- There's no record of LLM tokens or cost per request, which matters for the README's cost claims and for the radar's economics.

**Recommendations:** add Sentry (or similar) for errors; log one line per API request with route, status and duration; record model, tokens and estimated cost per LLM call, or route calls through Langfuse.

## 12. AI and ML quality — 2/5

- **Reranking isn't applied** despite the route's name (section 1).
- **Clustering ignores the embeddings you already have.** `analyzer.py` uses TF-IDF with only 100 features and picks `k = min(5, max(2, n // 4))` without checking quality. Reusing the Pinecone embeddings with HDBSCAN, or choosing k by silhouette score, would give more meaningful clusters.
- **Unsupported metrics.** The README's silhouette score (~0.68), "4 hours to 2 minutes" and "$270/month saved" have no script or notebook behind them. Add one or label them as illustrative.
- **No evaluation set.** There's no fixed list of queries with expected documents, so changes to search or prompts can't be measured.
- **Prompts are well organized** in one file with explicit character and token limits, and GPT-4o-mini is a sensible cost choice.

**Recommendations:** turn on Pinecone reranking (or remove the flag and rename the route); build a 20-query evaluation set for the EU AI Act corpus and track recall@10; cluster on embeddings.

## 13. Readiness for the regulatory radar spec — 2/5

| Spec need | Status |
|---|---|
| Graph view of regulations | Ready (Reagraph, layouts, colors) |
| Corpus of AI-governance documents | Ready (299 documents, cross-references) |
| Color by source type | Partly ready (field exists; labels fixed this round) |
| Saved state, users, workspaces | Missing (section 4) |
| Versions, snapshots, diffs, timeline | Missing (section 5) |
| Use cases and impact cells | Missing |
| Interpretations with stance and citations | Missing (source type is per document, not per reading) |
| Scheduled ingestion (Exa monitors) | Missing |
| Cost tracking for the summary tree | Missing (section 11) |

## Recommended next steps

Ordered by value for effort. Effort assumes one developer.

| # | Step | Effort | Unblocks |
|---|---|---|---|
| 1 | Redirect `/` to `/graph`; add error pages | 1 hour | First impression, reliability |
| 2 | Apply Pinecone reranking or rename the route; verify the embedding model and fix `/api/documents/list` | Half a day | Search quality, correct docs |
| 3 | Build nodes in one place; drop the duplicate payload | Half a day | Extensibility, payload size |
| 4 | URL state and `zustand/persist` | 1 day | Refresh-safe, shareable sessions |
| 5 | OpenAI timeouts and retries; request and cost logging; remove Vercel Analytics | 1 day | Reliability, observability |
| 6 | CI type-check step, ESLint, `.gitattributes`, Python tests | 1 day | Faster, safer changes |
| 7 | Config-driven view modes and filters | 2 days | Adding features in 1–2 files |
| 8 | Postgres for workspaces, versions, use cases and impact cells | 3–5 days | The radar spec |
| 9 | Long-running clustering worker on embeddings | 2–3 days | Scale, cluster quality |

## How this was assessed

- Clean clone of `main`, `npm ci`, `tsc --noEmit` (0 errors), `jest` (20 passed), `next build` (Next.js 15.5.29, succeeded) and `npm audit --omit=dev` (2 findings, both inside Next.js's bundled PostCSS).
- Production server smoke test: `/graph` returns 200; oversized LLM, search and tag requests are rejected; clustering returns results end to end.
- Clustering timed by running `backend/clustering/cli.py` directly on 50, 300 and 1,200 documents built from the EU AI Act data.
- Feature-change costs counted by tracing each concept through the source with `grep`.
- Not tested: the live Pinecone index, the browser UI, and behavior on Render.

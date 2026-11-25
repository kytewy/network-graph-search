# CLAUDE.md

Guidance for Claude when working in this repository. Read this and `docs/architecture-plan.md` at the start of every session.

## Project

RAG Quality Debugger: semantic search over AI-governance documents (EU AI Act and others) with a Reagraph network graph, clustering, and LLM analysis. It is evolving into a regulatory change radar; see `docs/architecture-plan.md` for the phases and `docs/codebase-assessment.md` for the current state.

Stack: Next.js 15.5 (App Router, client-only graph page), React 18, TypeScript, Tailwind + shadcn/ui, Reagraph 4.32, Zustand 5, Pinecone (integrated embeddings, `llama-text-embed-v2`), OpenAI, Python clustering (until Phase 3).

## Commands

| Task | Command |
|---|---|
| Run the app (Docker, hot reload) | `docker compose up --build -V` then open `localhost:3000/graph` |
| Unit tests | `npm test` |
| Type check | `npx tsc --noEmit` |
| Production build | `npm run build` |
| Task size | `npm run diff:size` |
| Upload data to Pinecone | `docker compose exec app python3 scripts/upload_all_data.py` |
| Database (Postgres) | Starts with `docker compose up`; tables are set up by the `migrate` service from `db/migrations/` |
| Check the database | open `localhost:3000/api/db-health` |

Use `-V` after any dependency change; Docker otherwise keeps old `node_modules`.

## Task rules

1. **One task per session.** Do only the task named in the prompt. Note anything else you find under "Follow-ups" in your summary; don't fix it.
2. **Line budget: at most 300 added lines of source code per task.** Tests, docs, data files, lockfiles and deleted lines don't count. Check with `npm run diff:size`.
3. **Estimate before coding.** List the files you'll change and an estimated line count. If the estimate is over 250, stop and propose a split instead.
4. **Check while working.** Run `npm run diff:size` after each file. If you pass 300, stop, commit nothing, and propose how to split the remaining work.
5. **Test first.** Write or update a failing test, then make it pass.
6. **Done means checked.** Before committing: `npx tsc --noEmit`, `npm test`, `npm run diff:size` all pass. Add Playwright and the eval script once they exist.
7. **Mechanical changes** (renames, moving files, codemods, generated migrations, test-framework migration) go on a `mech/` branch, change no behavior, and may exceed the budget.

## Branches and commits

- One branch per task: `p<phase>/<short-name>`, e.g. `p0/cluster-text-field`, `p1/search-contract`. Mechanical: `mech/<short-name>`.
- Never commit to `main`. The developer merges on Fridays.
- Commit message: `<type>: <what changed>` (`fix`, `feat`, `refactor`, `test`, `docs`, `chore`), then a short body explaining why.

## Architecture rules

These describe where the code is going. Follow them in new code; don't rewrite old code outside your task.

- **Server data** lives in TanStack Query hooks (`hooks/queries/`), never copied into Zustand. (From Phase 1.)
- **Shareable state** (query, filters, topK, view modes) lives in the URL via nuqs. (From Phase 1.)
- **Zustand** holds UI-only state, in small slices, selected with `useShallow`. Never mutate store objects in place.
- **API contracts** are zod schemas in `lib/contracts/`, shared by route handlers and the client. Route handlers validate with `safeParse` and return 400 on failure.
- **One place per concept**: nodes are built only by `toApiNode()`; view modes and filters are declared once in `lib/config/`.
- **Public routes** use `lib/utils/api-guard.ts` (rate limits, input caps, generic errors).
- **LLM calls** go through the shared OpenAI client with a timeout, and are traced in LangSmith.
- **Postgres** (from Phase 2) is the system of record; Pinecone holds vectors and filter fields only.

## Don't

- Edit `.env` or commit secrets.
- Edit `package-lock.json` by hand; change dependencies with `npm install`.
- Add a dependency without saying why in the summary.
- Leave `console.log`; use `debugLog` from `lib/utils/debug.ts`.
- Mix refactoring with behavior changes in one task.

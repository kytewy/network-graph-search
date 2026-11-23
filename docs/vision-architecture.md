# Vision and architecture: ecosystem monitoring

> Where the app is heading, and how today's search work leads there. Status and task sizing live in [claude-workflow.md](./claude-workflow.md).

## The idea

Today the app searches a fixed set of regulation documents, draws them as a graph and lets you collect documents for AI analysis. The goal is an **ecosystem monitor**: long-running topics (for example "Competitors" or "AI rules in Canada") where you capture web pages, tag them, search them alongside documents, analyse them, and notice when they change.

## The objects

| Object | What it is | Examples |
|---|---|---|
| **Workstream** | A long-running topic you monitor. Owns its sources, saved searches, tags, sessions and analyses. Searches inside it only look at its sources. | "Competitors", "AI rules in Canada" |
| **Source** | Anything searchable. Today: regulation documents. Later: captured web pages too. | OSFI E-23; a competitor's pricing page |
| **Capture** | One snapshot of a web page at a moment in time: Markdown, screenshot, raw HTML, hashes. Re-capturing the same URL makes a new version. | acme.com/pricing on Nov 22 |
| **Saved search** | A named search: query, result count, filters, refinements. Re-run any time; later on a schedule. | "Biometric surveillance in the EU" |
| **Session** | One working sitting: a search and its refinements, the documents collected into context, and the chats about them. Can be saved into a workstream. | Today's "workplace monitoring" investigation |

```
Workstream "Competitors"
├── Sources (documents + captured pages, each with tags and dates)
│   └── Captures (versions of a page over time)
├── Saved searches (re-run any time, later on a schedule)
└── Sessions (one search + refinements + collected documents + chats)
```

## Architecture

| Layer | Today | Target |
|---|---|---|
| Search index | Pinecone, integrated embeddings, `bge-reranker-v2-m3` | Same; every record also carries `workstreamId`, `sourceType` (`document` / `webpage`), `capturedAt`, `url` |
| App data | Browser only (store, address, saved preferences) | A database (Postgres, e.g. via Supabase) for workstreams, sources, captures, saved searches, sessions and tags |
| Files | None | File storage (e.g. Supabase Storage or S3) for raw HTML, Markdown and screenshots |
| Capture worker | None | Playwright (already used for browser tests) opens the page, screenshots it, grabs the HTML; converted to Markdown, hashed, chunked and indexed |
| Scheduler | None | Re-runs saved searches and re-captures pages; flags what's new or changed |
| AI | OpenAI `gpt-4o-mini` for analysis and cluster names | Same, plus change summaries ("what changed on this page"), with LangSmith tracing (P1-15) |

## Capturing web pages

For each capture, keep three files and two kinds of fingerprint:

1. **Raw HTML**: exactly what the server sent, for the record.
2. **Markdown**: the main content only (article text, headings, tables), without navigation, cookie banners, ads, scripts or tracking. This is what gets searched and sent to the AI. (A "readability" step picks the main content; a converter such as Turndown turns it into Markdown.)
3. **Screenshot**: full-page PNG, so you can see what the page looked like.

**Fingerprints (hashes)**

- **Content hash**: SHA-256 of the cleaned, normalised Markdown (whitespace collapsed, dates and other per-visit noise removed). Same hash as last time means nothing meaningful changed, so skip it. A different hash means a new version to diff and flag. Hashing the raw HTML instead would report "changed" on every visit, because timestamps, ads and tracking parameters change each time.
- **Section hashes**: one per heading-delimited section, so a change can be reported as "the Pricing section changed" rather than "the page changed".
- **Files stored by hash**: each file is saved under its own hash as its name (content-addressed), so identical captures are stored once.

**Pipeline**

```
URL → Playwright (screenshot + HTML) → main content → Markdown → normalise → hashes
    → unchanged? stop
    → changed:  store files, save the capture, chunk, embed into Pinecone,
                diff against the last version, flag the change (and summarise it with AI)
```

**Things to respect**: robots.txt and the sites' terms, a polite rate, and a clear user agent. Capture pages you're entitled to read.

## How this shapes the search work now

The search track (see [claude-workflow.md](./claude-workflow.md)) is built so it carries straight into workstreams:

- **A search has an identity.** The web address already describes a search exactly (`?q=…&k=…&continent=…`). A saved search is that address with a name, so it moves into the database later without changing its shape.
- **"Found by" on every result.** When several searches feed one graph (Expand), each document remembers which searches found it. That's the same link a session or a workstream will keep.
- **Refine is re-scoring, not re-fetching.** "Search within results" sends the documents on screen and a second question to the re-ranker for fresh scores. Monitoring will reuse it to rank what changed.
- **Workstream scope is a filter.** It becomes one more entry in the filter list (`lib/config/filters.ts`), sent with the search, so searches stay inside a workstream.
- **Results aren't only regulations.** Result cards and the reading view should work for any source: a document today, a captured page with a thumbnail, URL and capture date later.

## Roadmap

| Step | What | Needs |
|---|---|---|
| 1. Search track (now) | Errors on screen, expandable panel, Refine, Expand with "found by", colour by search, session trail, save search (browser) | Nothing new |
| 2. Workstreams v1 | Database; workstreams; saved searches and sessions inside them; workstream filter | Postgres (e.g. Supabase), sign-in |
| 3. Capture | Paste a URL → screenshot, Markdown, hashes, tags → searchable in a workstream | File storage, Playwright worker |
| 4. Monitoring | Re-run saved searches and re-capture pages on a schedule; highlight new and changed; alerts and AI change summaries | Scheduler (e.g. a cron job or queue) |
| Later | Browser extension to capture while you browse; crawling a whole site; sharing workstreams | |

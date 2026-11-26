import Link from 'next/link';
import type { Metadata } from 'next';
import { AddLinkButton } from '@/components/sources/AddLinkButton';
import { PAGE_SIZE, SOURCES, SOURCE_LABELS, formatAdded, listSources, parseFilters, sourceCounts, type Source, type SourceFilters } from '@/lib/sources/list';

export const metadata: Metadata = { title: 'Sources · Lantern' };
export const dynamic = 'force-dynamic';

const COLUMNS = ['Document', 'Source', 'Publisher', 'Country', 'Characters', 'Added'];
const COUNT_LABELS: Record<Source, string> = { index: 'From the index', link: 'Added by link', upload: 'Uploaded', web: 'From the web' };

const BADGE: Record<Source, string> = {
	index: 'bg-muted text-muted-foreground',
	link: 'bg-primary-soft text-secondary-foreground',
	upload: 'bg-ok/10 text-ok',
	web: 'bg-lit-soft text-lit-foreground',
};

/** Counts and rows, or null when the database can't be reached. */
async function load(filters: SourceFilters) {
	try {
		const [counts, rows] = await Promise.all([sourceCounts(), listSources(filters)]);
		return { counts, rows };
	} catch {
		return null;
	}
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Every document Lantern can search, and how each one got here. */
export default async function SourcesPage({ searchParams }: Props) {
	const filters = parseFilters(await searchParams);
	const data = await load(filters);
	const total = data ? SOURCES.reduce((n, s) => n + data.counts[s], 0) : 0;
	const href = (source: Source | null) => {
		const p = new URLSearchParams();
		if (filters.q) p.set('q', filters.q);
		if (source) p.set('source', source);
		const s = p.toString();
		return s ? `/sources?${s}` : '/sources';
	};

	return (
		<main className="h-screen overflow-y-auto bg-background">
			<div className="mx-auto max-w-6xl px-8 py-7 flex flex-col gap-5">
				<header className="flex flex-wrap items-center gap-3">
					<div className="flex-1">
						<h1 className="text-2xl font-semibold">Sources</h1>
						<p className="text-[13px] text-muted-foreground mt-0.5">Every document Lantern can search, and how it got here</p>
					</div>
					<AddLinkButton />
				</header>

				{!data ? (
					<div role="alert" className="rounded-xl border border-border bg-card p-5 text-sm">
						<p className="font-medium">Can't reach the database</p>
						<p className="text-muted-foreground mt-1">Start it with <code>docker compose up db</code>, then refresh.</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
							{SOURCES.map((s) => (
								<Link key={s} href={href(filters.source === s ? null : s)} aria-pressed={filters.source === s}
									className={`rounded-xl border bg-card p-3.5 hover:border-primary/40 ${filters.source === s ? 'border-primary' : 'border-border'}`}>
									<div className="text-2xl font-semibold tabular-nums">{data.counts[s]}</div>
									<div className="text-[13px] text-muted-foreground">{COUNT_LABELS[s]}</div>
								</Link>
							))}
						</div>

						<form action="/sources" className="flex flex-wrap items-center gap-2">
							{filters.source && <input type="hidden" name="source" value={filters.source} />}
							<label htmlFor="sources-q" className="sr-only">Search sources</label>
							<input id="sources-q" name="q" defaultValue={filters.q} placeholder="Search by title or publisher"
								className="w-full max-w-sm rounded-lg border border-primary/30 bg-card px-3 py-2 text-[13px] outline-none focus:border-primary" />
							{(filters.q || filters.source) && <Link href="/sources" className="text-[13px] text-primary">Clear</Link>}
						</form>

						{total === 0 ? (
							<div className="rounded-xl border border-dashed border-border p-8 text-center text-sm">
								<p className="font-medium">No documents in the database yet</p>
								<p className="text-muted-foreground mt-1">The scraped index is still only in Pinecone. Importing it comes next; meanwhile, add a page with Add a link.</p>
							</div>
						) : (
							<div className="rounded-xl border border-border bg-card overflow-x-auto">
								<table className="w-full border-collapse text-[13px]">
									<thead>
										<tr className="border-b border-border text-left text-xs text-muted-foreground">
											{COLUMNS.map((c) => <th key={c} className={`px-3 py-2.5 font-medium ${c === 'Characters' ? 'text-right' : ''}`}>{c}</th>)}
										</tr>
									</thead>
									<tbody>
										{data.rows.map((r) => (
											<tr key={r.id} className="border-b border-border/60 last:border-0">
												<td className="px-3 py-2.5 max-w-md">
													{r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="hover:text-primary">{r.title}</a> : r.title}
												</td>
												<td className="px-3 py-2.5"><span className={`rounded-md px-1.5 py-0.5 text-[11px] ${BADGE[r.source]}`}>{SOURCE_LABELS[r.source]}</span></td>
												<td className="px-3 py-2.5 text-muted-foreground">{r.publisher ?? '—'}</td>
												<td className="px-3 py-2.5 text-muted-foreground">{r.country ?? '—'}</td>
												<td className="px-3 py-2.5 text-muted-foreground text-right tabular-nums">{r.bodyLength.toLocaleString('en-US')}</td>
												<td className="px-3 py-2.5 text-muted-foreground">{formatAdded(new Date(r.addedAt))}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
						{total > 0 && <p className="text-xs text-muted-foreground tabular-nums">Showing {data.rows.length} of {total}{data.rows.length === PAGE_SIZE ? ', newest first' : ''}</p>}
					</>
				)}
			</div>
		</main>
	);
}

import Link from 'next/link';
import type { Metadata } from 'next';
import { NewWorkstreamDialog } from '@/components/workstreams/NewWorkstreamDialog';
import { dueLine, stepLine } from '@/lib/workstreams/steps';
import { listWorkstreams } from '@/lib/workstreams/store';
import { formatAdded } from '@/lib/sources/list';

export const metadata: Metadata = { title: 'Workstreams · Lantern' };
export const dynamic = 'force-dynamic';

/** Every piece of research in one place: what it's for, where it is, what's in it */
export default async function WorkstreamsPage() {
	const list = await listWorkstreams().catch(() => null);
	return (
		<main className="h-screen overflow-y-auto bg-background">
			<div className="mx-auto max-w-5xl px-8 py-7 flex flex-col gap-5">
				<header className="flex flex-wrap items-center gap-3">
					<div className="flex-1">
						<h1 className="text-2xl font-semibold">Workstreams</h1>
						<p className="text-[13px] text-muted-foreground mt-0.5">Each one has a goal, the documents behind it, and the report it ends in</p>
					</div>
					<NewWorkstreamDialog />
				</header>
				{list === null ? (
					<div role="alert" className="rounded-xl border border-border bg-card p-5 text-sm">
						<p className="font-medium">Can't reach the database</p>
						<p className="text-muted-foreground mt-1">Start it with <code>docker compose up db</code>, then refresh.</p>
					</div>
				) : list.length === 0 ? (
					<div className="rounded-xl border border-dashed border-border p-10 text-center text-sm">
						<p className="font-medium">No workstreams yet</p>
						<p className="text-muted-foreground mt-1">Start one for each question you're researching, like "Which AI rules bind our bank, and when?"</p>
					</div>
				) : (
					<ul className="grid gap-3 md:grid-cols-2">
						{list.map((w) => (
							<li key={w.id}>
								<Link href={`/workstreams/${w.id}`} className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/40">
									<div className="flex items-start gap-2">
										<span className="flex-1 font-medium">{w.name}</span>
										{w.dueOn && <span className="text-xs text-muted-foreground whitespace-nowrap">{dueLine(new Date(w.dueOn))}</span>}
									</div>
									{w.goal && <p className="text-[13px] text-muted-foreground line-clamp-2">{w.goal}</p>}
									<p className="mt-auto text-xs text-muted-foreground tabular-nums">
										{stepLine(w.step)} · {w.documents} docs · {w.chats} chats · Updated {formatAdded(new Date(w.updatedAt)).toLowerCase()}
									</p>
								</Link>
							</li>
						))}
					</ul>
				)}
			</div>
		</main>
	);
}

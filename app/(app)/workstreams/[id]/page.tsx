import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StepBar } from '@/components/workstreams/StepBar';
import { dueLine } from '@/lib/workstreams/steps';
import { getWorkstream } from '@/lib/workstreams/store';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const w = await getWorkstream((await params).id).catch(() => null);
	return { title: `${w?.name ?? 'Workstream'} · Lantern` };
}

/** One workstream: its name, goal and due date, and the six steps it moves through */
export default async function WorkstreamPage({ params }: Props) {
	const w = await getWorkstream((await params).id);
	if (!w) notFound();
	const due = dueLine(w.dueOn && new Date(w.dueOn));
	return (
		<main className="h-screen overflow-y-auto bg-background">
			<div className="mx-auto max-w-5xl px-8 py-7 flex flex-col gap-5">
				<Link href="/workstreams" className="text-[13px] text-muted-foreground hover:text-foreground">← Workstreams</Link>
				<header>
					<h1 className="text-2xl font-semibold">{w.name}</h1>
					<p className="text-[13px] text-muted-foreground mt-1">
						{w.goal ? `Goal: ${w.goal}` : 'No goal yet'}
						{due && ` · ${due}`}
					</p>
				</header>
				<StepBar step={w.step} />
				<section className="rounded-xl border border-border bg-card p-5 text-sm">
					<p className="font-medium">{w.documents} documents · {w.searches} searches · {w.chats} chats</p>
					<p className="text-muted-foreground mt-1">Collecting documents into a workstream, and its chats and report, come next.</p>
				</section>
			</div>
		</main>
	);
}

'use client';

import type { ChatConversation } from '@/lib/stores/context-store';

/** While the AI thinks: "Reading OSFI Guideline E-23…", with the round once it goes back for more */
export function ReadingNow({ reading }: { reading: NonNullable<ChatConversation['reading']> }) {
	const last = reading.at(-1)!;
	// Checking the answer's citations against the full text
	if (last.check)
		return (
			<span className="flex min-w-0 flex-col" data-testid="reading-now">
				<span className="truncate">
					Checking {last.check.total} citation{last.check.total === 1 ? '' : 's'} against the full text…
				</span>
				<span className="truncate text-xs text-muted-foreground/80">
					Reading {last.title} · {last.check.index} of {last.check.total}
				</span>
			</span>
		);
	return (
		<span className="truncate" data-testid="reading-now">
			{last.round > 1 && `Round ${last.round} · `}Reading {last.title}…
		</span>
	);
}

/** After the answer: "Read 3 documents in full ▸", opening the list in the order they were read */
export function ReadFolded({ turn }: { turn: ChatConversation }) {
	const fromReceipt = turn.receipt?.documents.filter((d) => d.readOnRequest).map((d) => d.title) ?? [];
	// The live order when we saw it happen; the receipt's otherwise (older answers)
	const titles = turn.reading?.length ? turn.reading.map((r) => r.title) : fromReceipt;
	if (titles.length === 0) return null;
	const rounds = turn.receipt?.readRounds ?? 1;
	return (
		<details className="mb-1 text-xs text-muted-foreground" data-testid="read-folded">
			<summary className="cursor-pointer select-none hover:text-foreground">
				Read {titles.length} document{titles.length === 1 ? '' : 's'} in full{rounds > 1 ? ` · ${rounds} rounds` : ''}
			</summary>
			<ol className="mt-1 ml-4 list-decimal space-y-0.5">
				{titles.map((title) => (
					<li key={title}>{title}</li>
				))}
			</ol>
		</details>
	);
}

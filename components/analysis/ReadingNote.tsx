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

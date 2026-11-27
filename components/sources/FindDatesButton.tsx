'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarSearch, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Has the AI read undated documents and fill in when they were published; marked "AI" in the table so you can check */
export function FindDatesButton({ unchecked }: { unchecked: number }) {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [note, setNote] = useState('');
	if (unchecked === 0 && !note) return null;

	const run = async () => {
		setBusy(true);
		setNote('');
		try {
			const response = await fetch('/api/sources/dates', { method: 'POST' });
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || 'Could not look for dates');
			setNote(`Found ${data.found.length} of ${data.checked}. Check the ones marked AI.`);
			router.refresh();
		} catch (error) {
			setNote(error instanceof Error ? error.message : 'Could not look for dates');
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="flex items-center gap-2">
			{note && <span className="text-xs text-muted-foreground" role="status">{note}</span>}
			{unchecked > 0 && (
				<Button variant="outline" onClick={run} disabled={busy}>
					{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CalendarSearch className="size-4" aria-hidden="true" />}
					Find missing dates ({unchecked})
				</Button>
			)}
		</div>
	);
}

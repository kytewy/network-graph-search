'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONTROL } from '@/components/ui/control';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { requestJson } from '@/lib/api/http';

/** "+ New workstream": a name, what it's for, and when it's due; then straight into it */
export function NewWorkstreamDialog() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');

	async function submit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const form = new FormData(e.currentTarget);
		const text = (k: string) => String(form.get(k) ?? '').trim() || undefined;
		setBusy(true);
		setError('');
		try {
			const { id } = await requestJson<{ id: string }>('/api/workstreams', {
				method: 'POST',
				body: JSON.stringify({ name: text('name'), goal: text('goal'), dueOn: text('dueOn') }),
			}, 'Couldn’t create the workstream');
			router.push(`/workstreams/${id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong');
			setBusy(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button><Plus className="size-4" aria-hidden="true" />New workstream</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>New workstream</DialogTitle>
					<DialogDescription>One piece of research: what it's for, the documents behind it, and the report it ends in.</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="space-y-3 text-sm">
					<label className="block space-y-1">
						<span className="text-xs text-muted-foreground">Name</span>
						<input name="name" required autoFocus maxLength={120} placeholder="EU vs Canada: AI rules in banking" className={`${CONTROL} w-full px-3`} />
					</label>
					<label className="block space-y-1">
						<span className="text-xs text-muted-foreground">Goal (optional)</span>
						<textarea name="goal" maxLength={500} rows={2} placeholder="Brief the risk committee on which rules are binding, and by when"
							className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[13px] outline-none focus:border-primary" />
					</label>
					<label className="block space-y-1">
						<span className="text-xs text-muted-foreground">Due (optional)</span>
						<input name="dueOn" type="date" className={`${CONTROL} w-full px-3`} />
					</label>
					{error && <p role="alert" className="text-xs text-destructive">{error}</p>}
					<div className="flex justify-end"><Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create'}</Button></div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

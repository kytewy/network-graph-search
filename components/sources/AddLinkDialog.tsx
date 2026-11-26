'use client';

import Link from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CONTROL } from '@/components/ui/control';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { addLink, previewLink, type AddedLink, type LinkPreview } from '@/lib/api/sources-client';
import { DOCUMENT_TYPES, PUBLISHERS } from '@/lib/config/document-taxonomy';
import { COUNTRY_CONTINENT_MAP } from '@/lib/stores/country_map';

const COUNTRIES = Object.keys(COUNTRY_CONTINENT_MAP).sort();
const FIELD = `${CONTROL} w-full px-3`;

/** Paste a link, check what Lantern found, label it, add it. Two steps in one window. */
export function AddLinkDialog({ trigger, onAdded }: { trigger: ReactNode; onAdded?: (added: AddedLink) => void }) {
	const [open, setOpen] = useState(false);
	const [url, setUrl] = useState('');
	const [preview, setPreview] = useState<LinkPreview | null>(null);
	const [title, setTitle] = useState('');
	const [publisher, setPublisher] = useState('');
	const [documentType, setDocumentType] = useState('');
	const [country, setCountry] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [added, setAdded] = useState<AddedLink | null>(null);

	function reset(next: boolean) {
		setOpen(next);
		if (next) return;
		setUrl(''); setPreview(null); setTitle(''); setPublisher(''); setDocumentType(''); setCountry(''); setError(''); setAdded(null);
	}

	async function run<T>(work: () => Promise<T>, then: (value: T) => void) {
		setBusy(true);
		setError('');
		try {
			then(await work());
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Something went wrong');
		} finally {
			setBusy(false);
		}
	}

	function onPreview(e: FormEvent) {
		e.preventDefault();
		run(() => previewLink(url), (p) => { setPreview(p); setTitle(p.title); });
	}

	function onAdd(e: FormEvent) {
		e.preventDefault();
		if (!preview) return;
		const continent = (COUNTRY_CONTINENT_MAP as Record<string, string>)[country];
		run(
			() => addLink({ url: preview.url, title: title.trim() || undefined, publisher, documentType, ...(country && { country, continent }) }),
			(a) => { setAdded(a); onAdded?.(a); },
		);
	}

	return (
		<Dialog open={open} onOpenChange={reset}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add a link</DialogTitle>
					<DialogDescription>Lantern keeps the article text, labels it, and makes it searchable.</DialogDescription>
				</DialogHeader>

				{added ? (
					<div role="status" className="space-y-3 text-sm">
						<p><span className="font-medium">{added.created ? 'Added' : 'Already in Sources'}</span> · {added.title}</p>
						<div className="flex gap-2">
							<Button asChild variant="outline" size="sm"><Link href="/sources?source=link" onClick={() => reset(false)}>Open in Sources</Link></Button>
							<Button size="sm" onClick={() => { reset(false); setOpen(true); }}>Add another</Button>
						</div>
					</div>
				) : (
					<form onSubmit={preview ? onAdd : onPreview} className="space-y-3 text-sm">
						<label className="block space-y-1">
							<span className="text-xs text-muted-foreground">Link</span>
							<div className="flex gap-2">
								<input type="url" required autoFocus value={url} placeholder="https://…" className={FIELD}
									onChange={(e) => { setUrl(e.target.value); setPreview(null); }} />
								{!preview && <Button type="submit" disabled={busy || !url}>{busy ? 'Loading…' : 'Preview'}</Button>}
							</div>
						</label>

						{preview && (
							<>
								<div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1.5" data-testid="link-preview">
									<input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={`${FIELD} font-medium`} />
									<p className="text-xs text-muted-foreground">{preview.siteName ?? new URL(preview.url).hostname} · {preview.length.toLocaleString('en-US')} characters</p>
									<p className="text-xs text-muted-foreground line-clamp-3">{preview.excerpt}</p>
								</div>
								<div className="grid grid-cols-3 gap-2">
									<Choice label="Publisher" value={publisher} onChange={setPublisher} options={PUBLISHERS.map((p) => p.value)} required />
									<Choice label="Type" value={documentType} onChange={setDocumentType} options={DOCUMENT_TYPES.map((d) => d.value)} required />
									<Choice label="Country" value={country} onChange={setCountry} options={COUNTRIES} />
								</div>
								<div className="flex justify-end gap-2">
									<Button type="button" variant="ghost" onClick={() => setPreview(null)}>Back</Button>
									<Button type="submit" disabled={busy || !publisher || !documentType}>{busy ? 'Adding…' : 'Add'}</Button>
								</div>
							</>
						)}
						{error && <p role="alert" className="text-xs text-destructive">{error}</p>}
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

function Choice(props: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
	return (
		<label className="block space-y-1">
			<span className="text-xs text-muted-foreground">{props.label}</span>
			<select required={props.required} value={props.value} onChange={(e) => props.onChange(e.target.value)} className={FIELD}>
				<option value="">{props.required ? 'Choose…' : 'None'}</option>
				{props.options.map((o) => <option key={o} value={o}>{o}</option>)}
			</select>
		</label>
	);
}

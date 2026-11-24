'use client';

import { useState } from 'react';
import { AppWindow } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { coverage, WEAK_SHARE } from '@/lib/chat/coverage';
import { sentShare, type Receipt, type SentDocument } from '@/lib/chat/receipt';

interface CoverageLinkProps {
	answer: string;
	receipt: Receipt;
	/** Opens the full receipt ("What was sent") */
	onOpenReceipt: () => void;
}

const SHOWN = 8;
const n = (x: number) => x.toLocaleString('en-US');
const pct = (d: SentDocument) => {
	const share = sentShare(d);
	return share === null ? 'Summary' : `${Math.round(share * 100)}%`;
};

/** A short list of documents with how much of each was sent, and "and N more" */
function DocList({ label, docs }: { label: string; docs: SentDocument[] }) {
	return (
		<div>
			<h3 className="mb-1 text-xs font-medium">
				{label} ({docs.length})
			</h3>
			{docs.length > 0 && (
				<ul className="space-y-0.5 text-xs" aria-label={label}>
					{docs.slice(0, SHOWN).map((d) => (
						<li key={d.id} className="flex justify-between gap-3">
							<span className="truncate" title={d.title}>{d.title}</span>
							<span className={`shrink-0 tabular-nums ${(sentShare(d) ?? 0) < WEAK_SHARE ? 'text-amber-700' : 'text-muted-foreground'}`}>{pct(d)}</span>
						</li>
					))}
					{docs.length > SHOWN && <li className="text-muted-foreground">and {docs.length - SHOWN} more</li>}
				</ul>
			)}
		</div>
	);
}

/** The answer's context at a glance: "45 sent · 7 cited", opening what went in and what the answer used */
export function CoverageLink({ answer, receipt, onOpenReceipt }: CoverageLinkProps) {
	const [open, setOpen] = useState(false);
	const { cited, notCited, weak, unmatched } = coverage(answer, receipt);
	const docs = receipt.documents;
	const onRequest = docs.filter((d) => d.readOnRequest).length;
	const shares = docs.filter((d) => !d.readOnRequest).map(sentShare);
	const whole = shares.filter((s) => s === 1).length;
	const summaries = shares.filter((s) => s === null).length;
	const part = shares.length - whole - summaries;
	const used = Math.min(100, Math.round((receipt.tokens / receipt.contextWindow) * 100));
	const warnings = [
		unmatched.length > 0 &&
			`${unmatched.length} citation${unmatched.length === 1 ? '' : 's'} match${unmatched.length === 1 ? 'es' : ''} no document sent: ${unmatched.join('; ')}`,
		weak.length > 0 && `${weak.length} cited but mostly unsent: ${weak.map((d) => d.title).join('; ')}`,
	].filter(Boolean) as string[];
	// Red outranks amber: a citation that matches nothing is the bigger worry
	const dot = unmatched.length > 0 ? 'bg-red-500' : 'bg-amber-500';
	return (
		<span className="ml-auto flex items-center gap-1.5 pl-2" data-testid="coverage">
			{warnings.length > 0 && (
				<span role="img" aria-label={warnings.join('. ')} title={warnings.join('\n')} className={`h-2 w-2 rounded-full ${dot}`} />
			)}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						title="Context for this answer"
						className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground">
						<AppWindow aria-hidden className="h-3.5 w-3.5" />
						{docs.length} sent · {cited.length} cited
					</button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-80 space-y-3 p-3" aria-label="Context for this answer">
					<div>
						<div className="flex justify-between text-xs">
							<span className="font-medium">Context window</span>
							<span className="text-muted-foreground">
								about {n(receipt.tokens)} of {n(receipt.contextWindow)} tokens ({used}%)
							</span>
						</div>
						<div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
							<div className="h-full bg-primary" style={{ width: `${Math.max(used, 1)}%` }} />
						</div>
						<p className="mt-1 text-xs text-muted-foreground" data-testid="context-mix">
							{docs.length} documents: {whole} whole · {part} in part · {summaries} as summary
							{onRequest > 0 && ` · ${onRequest} read in full on request`}
							{(receipt.readRounds ?? 0) > 1 && ` (${receipt.readRounds} rounds)`}
							{receipt.memoryTurns > 0 && ` · ${receipt.memoryTurns} earlier turns`}
						</p>
					</div>
					<DocList label="Cited" docs={cited} />
					<DocList label="Sent, not cited" docs={notCited} />
					<button
						type="button"
						onClick={() => {
							setOpen(false);
							onOpenReceipt();
						}}
						className="w-full rounded-md border px-3 py-1.5 text-xs hover:bg-accent/50">
						Full receipt
					</button>
				</PopoverContent>
			</Popover>
		</span>
	);
}

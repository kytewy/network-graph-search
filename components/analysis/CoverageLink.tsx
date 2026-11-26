'use client';

import { useState } from 'react';
import { AppWindow } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { coverage } from '@/lib/chat/coverage';
import { readMix, type Receipt } from '@/lib/chat/receipt';

interface CoverageLinkProps {
	answer: string;
	receipt: Receipt;
	/** Opens the full receipt ("What was sent") */
	onOpenReceipt: () => void;
}

const n = (x: number) => x.toLocaleString('en-US');

/** The answer's context at a glance: "45 sent · 7 cited", opening what went in and what the answer used */
export function CoverageLink({ answer, receipt, onOpenReceipt }: CoverageLinkProps) {
	const [open, setOpen] = useState(false);
	const { cited, weak, unmatched } = coverage(answer, receipt);
	const docs = receipt.documents;
	// One scale for what the AI saw, however it got there (sent whole or read on request)
	const mix = readMix(docs);
	const pct = (k: number) => `${(k / Math.max(docs.length, 1)) * 100}%`;
	const used = Math.min(100, Math.round((receipt.tokens / receipt.contextWindow) * 100));
	const warnings = [
		unmatched.length > 0 &&
			`${unmatched.length} citation${unmatched.length === 1 ? '' : 's'} match${unmatched.length === 1 ? 'es' : ''} no document sent: ${unmatched.join('; ')}`,
		weak.length > 0 && `${weak.length} cited from excerpts only (the AI got less than half): ${weak.map((d) => d.title).join('; ')}`,
	].filter(Boolean) as string[];
	// Red outranks coral: a citation that matches nothing is the bigger worry. Amber stays for "lit"
	const dot = unmatched.length > 0 ? 'bg-destructive' : 'bg-warn';
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
						{docs.length} sent · <span className={cited.length > 0 ? 'text-lit-foreground' : ''}>{cited.length} cited</span>
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
						<div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
							<div className="h-full bg-lit" style={{ width: `${Math.max(used, 1)}%` }} />
						</div>
					</div>
					<div data-testid="context-mix">
						<div className="text-xs font-medium">What the AI read · {docs.length} documents</div>
						<div aria-hidden className="mt-1 flex h-2 overflow-hidden rounded-full bg-muted">
							<span className="bg-lit" style={{ width: pct(mix.full) }} />
							<span className="bg-lit/50" style={{ width: pct(mix.partly) }} />
						</div>
						<p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
							<span>In full {mix.full}</span>
							<span>Partly {mix.partly}</span>
							<span>Summary only {mix.summary}</span>
							{receipt.memoryTurns > 0 && <span>{receipt.memoryTurns} earlier turns</span>}
						</p>
					</div>
					<p className="text-xs" data-testid="context-cited">
						<span className="rounded-md bg-lit-soft px-1.5 py-0.5 text-lit-foreground">Cited {cited.length} of {docs.length}</span>
						{weak.length > 0 && <span className="text-warn"> · {weak.length} cited from excerpts only</span>}
						{unmatched.length > 0 && <span className="text-destructive"> · {unmatched.length} match no document sent</span>}
					</p>
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

'use client';

import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { askAboutPrompt, coverage } from '@/lib/chat/coverage';
import type { Receipt } from '@/lib/chat/receipt';

interface CoverageLineProps {
	answer: string;
	receipt: Receipt;
	/** Opens the receipt ("What was sent") */
	onOpenReceipt: () => void;
	/** Puts a follow-up question in the chat box */
	onAsk: (text: string) => void;
}

const chip = 'rounded-md px-2 py-0.5 text-xs';

/** "Cited 7 of 24 · 17 not cited ▾", plus warnings for weak or unmatched citations */
export function CoverageLine({ answer, receipt, onOpenReceipt, onAsk }: CoverageLineProps) {
	const { cited, notCited, weak, unmatched } = coverage(answer, receipt);
	const total = receipt.documents.length;
	return (
		<div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Coverage" data-testid="coverage-line">
			<button type="button" onClick={onOpenReceipt} className={`${chip} bg-teal-50 font-medium text-teal-900 hover:bg-teal-100`}>
				Cited {cited.length} of {total}
			</button>
			{notCited.length > 0 && (
				<Popover>
					<PopoverTrigger asChild>
						<button type="button" className={`${chip} flex items-center gap-0.5 border border-gray-200 bg-white hover:bg-gray-50`}>
							{notCited.length} not cited <ChevronDown aria-hidden className="h-3 w-3" />
						</button>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-80 p-3">
						<p className="mb-2 text-xs text-muted-foreground">Sent with the question, but not cited in the answer</p>
						<ul className="max-h-56 space-y-1 overflow-y-auto text-sm" aria-label="Not cited">
							{notCited.map((d) => (
								<li key={d.id} className="truncate" title={d.title}>
									{d.title}
								</li>
							))}
						</ul>
						<button
							type="button"
							onClick={() => onAsk(askAboutPrompt(notCited))}
							className="mt-3 w-full rounded-md border border-primary/40 px-3 py-1.5 text-sm text-primary hover:bg-primary/5">
							Ask about these
						</button>
					</PopoverContent>
				</Popover>
			)}
			{weak.length > 0 && (
				<span
					className={`${chip} bg-amber-50 text-amber-900`}
					title={`The AI saw less than half of these, or only a summary: ${weak.map((d) => d.title).join('; ')}`}>
					{weak.length} cited but mostly unsent
				</span>
			)}
			{unmatched.length > 0 && (
				<span className={`${chip} bg-red-50 text-red-800`} title={`No document sent matches: ${unmatched.join('; ')}`}>
					{unmatched.length} citation{unmatched.length === 1 ? '' : 's'} match{unmatched.length === 1 ? 'es' : ''} no document sent
				</span>
			)}
		</div>
	);
}

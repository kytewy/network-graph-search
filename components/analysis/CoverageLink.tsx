'use client';

import { coverage } from '@/lib/chat/coverage';
import type { Receipt } from '@/lib/chat/receipt';

interface CoverageLinkProps {
	answer: string;
	receipt: Receipt;
	/** Opens the receipt ("What was sent"), which lists cited and not cited */
	onOpenReceipt: () => void;
}

/** "Cited 7 of 24" at the end of an answer's tools, with a dot only when a citation needs a look */
export function CoverageLink({ answer, receipt, onOpenReceipt }: CoverageLinkProps) {
	const { cited, weak, unmatched } = coverage(answer, receipt);
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
			<button
				type="button"
				onClick={onOpenReceipt}
				title="What was sent"
				className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
				Cited {cited.length} of {receipt.documents.length}
			</button>
		</span>
	);
}

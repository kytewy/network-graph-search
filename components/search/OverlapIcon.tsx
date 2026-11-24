import { Blend } from 'lucide-react';

/**
 * Two overlapping circles: "more than one search found this document".
 * Amber, like the overlap colour on the graph. The label says which searches.
 */
export function OverlapIcon({ label = 'Found by more than one search' }: { label?: string }) {
	return (
		<span role="img" aria-label={label} title={label} className="inline-flex shrink-0 align-middle text-amber-600">
			<Blend className="h-3.5 w-3.5" aria-hidden />
		</span>
	);
}

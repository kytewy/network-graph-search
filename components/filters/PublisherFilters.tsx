'use client';

import { Badge } from '@/components/ui/badge';
import { publisherColor } from '@/lib/config/document-taxonomy';

interface PublisherFiltersProps {
	availablePublishers: string[];
	selectedPublishers: string[];
	togglePublisher: (publisher: string) => void;
	getNodeCountByPublisher: (publisher: string) => number;
}

/** One chip per publisher in the results, coloured like the graph's Publisher mode. */
export function PublisherFilters({
	availablePublishers,
	selectedPublishers,
	togglePublisher,
	getNodeCountByPublisher,
}: PublisherFiltersProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{availablePublishers.map((publisher) => {
				const selected = selectedPublishers.includes(publisher);
				return (
					<Badge
						key={publisher}
						role="checkbox"
						aria-checked={selected}
						tabIndex={0}
						variant={selected ? 'default' : 'outline'}
						className={`cursor-pointer gap-1.5 transition-colors ${
							selected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent/50'
						}`}
						onClick={() => togglePublisher(publisher)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								togglePublisher(publisher);
							}
						}}>
						<span
							aria-hidden="true"
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: publisherColor(publisher) }}
						/>
						{publisher}
						<span className="opacity-70">({getNodeCountByPublisher(publisher)})</span>
					</Badge>
				);
			})}
		</div>
	);
}

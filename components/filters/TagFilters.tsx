'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { safeIncludes } from '@/lib/utils/array-safety';

interface TagFiltersProps {
	availableTags: string[];
	selectedTags: string[];
	toggleTag: (tag: string) => void;
	getNodeCountByTag: (tag: string) => number;
}

export function TagFilters({
	availableTags,
	selectedTags,
	toggleTag,
	getNodeCountByTag,
}: TagFiltersProps) {
	if (availableTags.length === 0) {
		return null; // Hide if no tags exist
	}

	return (
		<div className="space-y-1 max-h-64 overflow-y-auto">
				{availableTags.map((tag) => {
					const count = getNodeCountByTag(tag);
					const isSelected = safeIncludes(selectedTags, tag);

					return (
						<div
							key={tag}
							className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer group"
							onClick={() => toggleTag(tag)}>
							<div className="flex items-center space-x-2">
								<Checkbox
									id={`tag-${tag}`}
									checked={isSelected}
									onCheckedChange={() => toggleTag(tag)}
									className="transition-transform group-hover:scale-110"
								/>
								<Label
									htmlFor={`tag-${tag}`}
									className="text-sm cursor-pointer select-none flex items-center gap-2">
									{tag}
								</Label>
							</div>
							<span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
								{count}
							</span>
						</div>
					);
				})}
		</div>
	);
}

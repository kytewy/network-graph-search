'use client';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tag } from 'lucide-react';
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
		<div className="space-y-2">
			<Label className="flex items-center gap-2 text-sidebar-foreground">
				<Tag className="h-4 w-4" />
				Tags
			</Label>
			<div className="space-y-2 max-h-64 overflow-y-auto">
				{availableTags.map((tag) => {
					const count = getNodeCountByTag(tag);
					const isSelected = safeIncludes(selectedTags, tag);

					return (
						<div
							key={tag}
							className="flex items-center justify-between hover:bg-sidebar-accent/50 p-1.5 rounded cursor-pointer transition-colors"
							onClick={() => toggleTag(tag)}>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id={`tag-${tag}`}
									checked={isSelected}
									onChange={() => toggleTag(tag)}
									onClick={(e) => e.stopPropagation()}
									className="w-4 h-4 rounded border-sidebar-border bg-sidebar text-primary cursor-pointer"
								/>
								<label
									htmlFor={`tag-${tag}`}
									className="text-sm cursor-pointer text-sidebar-foreground flex items-center gap-2">
									{tag}
								</label>
							</div>
							<span className="text-xs text-muted-foreground bg-sidebar-accent px-2 py-0.5 rounded-full">
								{count}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

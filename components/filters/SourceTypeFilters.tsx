'use client';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { safeIncludes } from '@/lib/utils/array-safety';

interface SourceTypeFiltersProps {
	sourceTypes: string[];
	selectedSourceTypes: string[];
	toggleSourceType: (sourceType: string) => void;
}

export function SourceTypeFilters({
	sourceTypes,
	selectedSourceTypes,
	toggleSourceType,
}: SourceTypeFiltersProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<FileText className="h-4 w-4 text-sidebar-foreground" />
				<Label className="text-sidebar-foreground font-medium text-sm">
					Source Type Filters
				</Label>
			</div>
			<div className="flex flex-wrap gap-2">
				{sourceTypes.map((sourceType) => (
					<Badge
						key={sourceType}
						variant={
							safeIncludes(selectedSourceTypes, sourceType) ? 'default' : 'outline'
						}
						className={`cursor-pointer transition-colors ${
							safeIncludes(selectedSourceTypes, sourceType)
								? 'bg-primary text-primary-foreground hover:bg-primary/90'
								: 'hover:bg-accent/50'
						}`}
						onClick={() => toggleSourceType(sourceType)}>
						{sourceType}
					</Badge>
				))}
			</div>
		</div>
	);
}

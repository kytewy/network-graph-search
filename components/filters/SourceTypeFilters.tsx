'use client';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

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
							selectedSourceTypes.includes(sourceType) ? 'default' : 'outline'
						}
						className={`cursor-pointer transition-colors ${
							selectedSourceTypes.includes(sourceType)
								? 'bg-primary text-primary-foreground hover:bg-primary/90'
								: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
						}`}
						onClick={() => toggleSourceType(sourceType)}>
						{sourceType}
					</Badge>
				))}
			</div>
		</div>
	);
}

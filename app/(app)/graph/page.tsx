'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import the entire GraphPageClient to avoid SSR issues
const GraphPageClient = dynamic(
	() => import('@/components/graph/GraphPageClient').then((m) => ({ default: m.GraphPageClient })),
	{ 
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center h-screen bg-background">
				<div className="text-center">
					<div className="text-lg font-semibold text-foreground mb-2">
						Loading Graph Explorer...
					</div>
					<div className="text-sm text-muted-foreground">
						Initializing network visualization
					</div>
				</div>
			</div>
		)
	}
);

export default function GraphPage() {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return (
			<div className="flex items-center justify-center h-screen bg-background">
				<div className="text-center">
					<div className="text-lg font-semibold text-foreground mb-2">
						Loading Graph Explorer...
					</div>
					<div className="text-sm text-muted-foreground">
						Initializing network visualization
					</div>
				</div>
			</div>
		);
	}

	return <GraphPageClient />;
}

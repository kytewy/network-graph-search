'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface GraphErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * Shown when the graph page crashes, instead of a blank screen.
 * A ChunkLoadError means part of the app failed to download (often after
 * a restart or deploy), so reloading the page is the fix rather than a retry.
 */
export default function GraphError({ error, reset }: GraphErrorProps) {
	useEffect(() => {
		console.error('[graph] Page crashed:', error);
	}, [error]);

	const needsReload = error?.name === 'ChunkLoadError';

	return (
		<div className="flex items-center justify-center h-screen bg-background p-6">
			<div role="alert" className="max-w-md text-center space-y-4">
				<h2 className="text-lg font-semibold text-foreground">
					Something went wrong loading the graph
				</h2>
				<p className="text-sm text-muted-foreground">
					{needsReload
						? 'Part of the app failed to load, usually because it was restarted or updated. Reload the page to get the latest version.'
						: 'Try again. If it keeps happening, reload the page.'}
				</p>
				<Button onClick={() => (needsReload ? window.location.reload() : reset())}>
					{needsReload ? 'Reload page' : 'Try again'}
				</Button>
			</div>
		</div>
	);
}

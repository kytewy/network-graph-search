'use client';

import { useEffect } from 'react';
import { captureClientError } from '@/lib/observability/capture-client';

/**
 * Last-resort error page for crashes in the root layout itself. It
 * replaces the whole page, so it renders its own <html> and <body>.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
	useEffect(() => {
		captureClientError(error, { boundary: 'global' });
	}, [error]);

	return (
		<html lang="en">
			<body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
				<div role="alert" style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
					<h2 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h2>
					<p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
						The app hit an unexpected error. Reloading usually fixes it.
					</p>
					<button type="button" onClick={() => window.location.reload()} style={{ padding: '8px 16px', cursor: 'pointer' }}>
						Reload page
					</button>
				</div>
			</body>
		</html>
	);
}

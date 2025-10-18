'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import the entire NetworkGraphCanvas component to avoid SSR issues
const NetworkGraphCanvasClient = dynamic(
	() => import('./NetworkGraphCanvasClient').then((m) => ({ default: m.NetworkGraphCanvasClient })),
	{ 
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center h-full text-gray-500">
				Loading network graph...
			</div>
		)
	}
);

/**
 * NetworkGraphCanvas component wrapper
 * Ensures the graph is only rendered on the client side to avoid SSR issues with Reagraph
 */
export function NetworkGraphCanvas() {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return (
			<div className="flex items-center justify-center h-full text-gray-500">
				Loading network graph...
			</div>
		);
	}

	return <NetworkGraphCanvasClient />;
}

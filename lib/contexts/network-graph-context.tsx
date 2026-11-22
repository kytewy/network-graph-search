'use client';

import React, { createContext, useContext, useMemo, useRef } from 'react';
import type { GraphCanvasRef } from 'reagraph';
import { reportError } from '@/lib/observability/capture-client';

/**
 * The graph context now holds only the graph's ref: the handle for
 * controlling the graph itself (camera, fit to view). Everything else
 * (data, settings, lasso, AI clusters) lives in the store.
 */
interface NetworkGraphContextType {
	graphRef: React.RefObject<GraphCanvasRef>;
}

const NetworkGraphContext = createContext<NetworkGraphContextType | undefined>(undefined);

export function NetworkGraphProvider({ children }: { children: React.ReactNode }) {
	const graphRef = useRef<GraphCanvasRef>(null);
	const value = useMemo(() => ({ graphRef }), []);
	return <NetworkGraphContext.Provider value={value}>{children}</NetworkGraphContext.Provider>;
}

// Custom hook to use the context
export function useNetworkGraph() {
	const context = useContext(NetworkGraphContext);
	if (context === undefined) {
		throw new Error(
			'useNetworkGraph must be used within a NetworkGraphProvider'
		);
	}
	return context;
}

// Error boundary component
export class NetworkGraphErrorBoundary extends React.Component<
	{ children: React.ReactNode; fallback?: React.ReactNode },
	{ hasError: boolean }
> {
	constructor(props: {
		children: React.ReactNode;
		fallback?: React.ReactNode;
	}) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(_: Error) {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		reportError('graph-boundary', error, { componentStack: errorInfo.componentStack });
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="flex items-center justify-center h-full bg-gray-50 border rounded p-4">
						<div className="text-center">
							<h3 className="text-lg font-semibold text-red-600 mb-2">
								Network Graph Error
							</h3>
							<p className="text-gray-600">
								There was an error rendering the network graph.
							</p>
							<button
								className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
								onClick={() => this.setState({ hasError: false })}>
								Try Again
							</button>
						</div>
					</div>
				)
			);
		}

		return this.props.children;
	}
}

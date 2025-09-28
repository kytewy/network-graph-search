'use client';

import { NetworkGraphProvider } from '@/lib/contexts/network-graph-context';
import { NetworkGraphWithContext } from './NetworkGraphWithContext';

/**
 * NetworkGraph component
 * Wrapper component that provides the NetworkGraphProvider context to NetworkGraphWithContext
 */
export function NetworkGraph() {
	return (
		<NetworkGraphProvider>
			<NetworkGraphWithContext />
		</NetworkGraphProvider>
	);
}

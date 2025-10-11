import dynamic from 'next/dynamic';

// NO 'use client' here - this stays as a server component that loads a client component
const GraphPageClient = dynamic(
	() => import('@/components/network/graph-page-client'),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center h-screen">
				Loading...
			</div>
		),
	}
);

export default function Page() {
	return <GraphPageClient />;
}

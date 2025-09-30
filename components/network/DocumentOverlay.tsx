'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { X } from 'lucide-react';

interface ReadingItem {
	id: string;
	title: string;
	author?: string;
	description: string;
	content: string;
	category?: string;
	readTime?: string;
	status: 'read' | 'unread' | 'reading';
}

interface DocumentOverlayProps {
	document: ReadingItem;
	onClose: () => void;
	isInContext: boolean;
	onToggleContext: () => void;
}

// Memoized component to prevent re-splitting content on every render
const ContentParagraphs = React.memo(({ content }: { content: string }) => {
	const paragraphs = useMemo(() => content.split('\n'), [content]);
	
	return (
		<div className="prose prose-sm max-w-none dark:prose-invert">
			{paragraphs.map((paragraph, index) => (
				<p key={index}>{paragraph}</p>
			))}
		</div>
	);
});

export default function DocumentOverlay({
	document: documentItem,
	onClose,
	isInContext,
	onToggleContext,
}: DocumentOverlayProps) {
	// State to track if we're in the browser environment
	const [mounted, setMounted] = useState(false);

	// Set up and clean up when component mounts/unmounts
	useEffect(() => {
		setMounted(true);

		// Prevent body scrolling when overlay is open
		if (typeof window !== 'undefined') {
			window.document.body.style.overflow = 'hidden';
		}

		return () => {
			setMounted(false);

			// Restore body scrolling when overlay is closed
			if (typeof window !== 'undefined') {
				window.document.body.style.overflow = '';
			}
		};
	}, []);

	// If not mounted yet, don't render anything
	if (!mounted) return null;

	// Use createPortal to render at the document body level
	return createPortal(
		<div
			className="fixed inset-0 bg-black/50 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: '100vw',
				height: '100vh',
				pointerEvents: 'auto',
			}}>
			<Card
				className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
				style={{ position: 'relative', zIndex: 10001 }}>
				<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={onClose}
								className="h-8 w-8 p-0">
								<X className="h-4 w-4" />
							</Button>
							<h1 className="text-xl font-bold text-balance">
								{documentItem.title}
							</h1>
						</div>
					</div>
					<div>
						<Button
							variant={isInContext ? 'destructive' : 'secondary'}
							size="sm"
							className="h-8 text-xs"
							onClick={onToggleContext}>
							{isInContext ? 'Remove from Context' : 'Add to Context'}
						</Button>
					</div>
				</CardHeader>

				<CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
					{documentItem.description && (
						<div className="mb-6 p-4 bg-muted/50 rounded-md">
							<p className="italic text-muted-foreground">
								{documentItem.description}
							</p>
						</div>
					)}

					<ContentParagraphs content={documentItem.content} />
				</CardContent>
			</Card>
		</div>,
		typeof window !== 'undefined' ? window.document.body : null
	);
}

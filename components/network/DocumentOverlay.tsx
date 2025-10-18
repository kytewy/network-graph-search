'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { X, Tag, Plus, Check } from 'lucide-react';
import { Z_INDEX } from '@/lib/constants/graph-config';
import type { Node } from '@/lib/types/node';
import { useAppStore } from '@/lib/stores/app-state';

/**
 * Document display interface for reading mode
 * Maps from our Node interface for consistency
 */
interface ReadingItem {
	id: string;
	title: string;        // Maps to Node.label
	author?: string;
	description: string;  // Maps to Node.summary
	content: string;      // Maps to Node.content
	category?: string;    // Maps to Node.sourceType
	readTime?: string;
	status: 'read' | 'unread' | 'reading';
	url?: string;         // Maps to Node.url
}

interface DocumentOverlayProps {
	document: ReadingItem;
	onClose: () => void;
	isInContext: boolean;
	onToggleContext: () => void;
}

/**
 * Helper function to convert Node to ReadingItem format
 * This is the single source of truth for the transformation
 */
export function nodeToReadingItem(node: Node): ReadingItem {
	return {
		id: node.id,
		title: node.label,
		description: node.summary || '',
		content: node.content || '',
		category: node.sourceType,
		url: node.url,
		status: 'unread' as const,
	};
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
	
	// Get store methods to update search results
	const searchResults = useAppStore((state) => state.searchResults);
	const setSearchResults = useAppStore((state) => state.setSearchResults);
	
	// Tag management state
	const [tags, setTags] = useState<string[]>([]);
	const [showTagInput, setShowTagInput] = useState(false);
	const [tagInput, setTagInput] = useState('');
	const [isTagging, setIsTagging] = useState(false);
	const [tagSuccess, setTagSuccess] = useState(false);
	const [tagError, setTagError] = useState<string | null>(null);

	// Fetch existing tags when document opens
	useEffect(() => {
		const fetchTags = async () => {
			try {
				const response = await fetch(`/api/documents/tags?documentId=${documentItem.id}`);
				if (response.ok) {
					const data = await response.json();
					setTags(data.tags || []);
				}
			} catch (err) {
				console.error('[Fetch Tags] Error:', err);
			}
		};

		fetchTags();
	}, [documentItem.id]);

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

	// Handle adding a tag
	const handleAddTag = async () => {
		if (!tagInput.trim()) {
			setTagError('Tag name cannot be empty');
			return;
		}

		// Check for duplicates
		if (Array.isArray(tags) && tags.includes(tagInput.trim())) {
			setTagError('This tag already exists');
			return;
		}

		setIsTagging(true);
		setTagError(null);

		try {
			const response = await fetch('/api/documents/tags', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					documentIds: [documentItem.id],
					tag: tagInput.trim(),
					action: 'add',
				}),
			});

			if (!response.ok) {
				throw new Error(`Failed to add tag: ${response.status}`);
			}

			// Add tag to local state
			const newTag = tagInput.trim();
			setTags(prev => [...prev, newTag]);
			
			// Update search results to reflect the new tag
			const updatedResults = searchResults.map(node =>
				node.id === documentItem.id
					? { ...node, tags: [...(node.tags || []), newTag] }
					: node
			);
			setSearchResults(updatedResults);
			
			// Show success and reset
			setTagSuccess(true);
			setTimeout(() => setTagSuccess(false), 2000);
			setTagInput('');
			setShowTagInput(false);
		} catch (err) {
			console.error('[Tagging] Error:', err);
			setTagError(err instanceof Error ? err.message : 'Failed to add tag');
		} finally {
			setIsTagging(false);
		}
	};

	const handleRemoveTag = async (tagToRemove: string) => {
		setIsTagging(true);
		setTagError(null);

		try {
			const response = await fetch('/api/documents/tags', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					documentIds: [documentItem.id],
					tag: tagToRemove,
					action: 'remove',
				}),
			});

			if (!response.ok) {
				throw new Error(`Failed to remove tag: ${response.status}`);
			}

			// Remove tag from local state
			setTags(prev => prev.filter(t => t !== tagToRemove));
			
			// Update search results to reflect the removed tag
			const updatedResults = searchResults.map(node =>
				node.id === documentItem.id
					? { ...node, tags: (node.tags || []).filter(t => t !== tagToRemove) }
					: node
			);
			setSearchResults(updatedResults);
		} catch (err) {
			console.error('[Tag Removal] Error:', err);
			setTagError(err instanceof Error ? err.message : 'Failed to remove tag');
		} finally {
			setIsTagging(false);
		}
	};

	// If not mounted yet, don't render anything
	if (!mounted) return null;

	// Use createPortal to render at the document body level
	return createPortal(
		<div
			className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: '100vw',
				height: '100vh',
				pointerEvents: 'auto',
				zIndex: Z_INDEX.overlay,
			}}>
			<Card
				className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
				style={{ position: 'relative', zIndex: Z_INDEX.modal }}>
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
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={() => setShowTagInput(!showTagInput)}>
							<Tag className="h-3 w-3 mr-1" />
							Add Tag
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs"
							onClick={() => documentItem.url ? window.open(documentItem.url, "_blank") : null}
							disabled={!documentItem.url}
							title={!documentItem.url ? "No link provided" : "Open link in new tab"}>
							Open Link
						</Button>
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
					{/* Summary */}
					{documentItem.description && (
						<div className="mb-4 p-4 bg-muted/50 rounded-md">
							<p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
							<p className="italic text-muted-foreground">
								{documentItem.description}
							</p>
						</div>
					)}

					{/* Tag Input */}
					{showTagInput && (
						<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
							<div className="flex gap-2 mb-2">
								<Input
									type="text"
									placeholder="Enter tag name..."
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleAddTag();
										if (e.key === 'Escape') {
											setShowTagInput(false);
											setTagInput('');
											setTagError(null);
										}
									}}
									disabled={isTagging}
									className="flex-1"
									autoFocus
								/>
								<Button
									size="sm"
									onClick={handleAddTag}
									disabled={isTagging || !tagInput.trim()}>
									{isTagging ? 'Adding...' : 'Add'}
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setShowTagInput(false);
										setTagInput('');
										setTagError(null);
									}}>
									Cancel
								</Button>
							</div>
							{tagError && (
								<p className="text-xs text-red-600">{tagError}</p>
							)}
						</div>
					)}

					{/* Tags Display */}
					{tags.length > 0 && (
						<div className="mb-4 p-4 bg-muted/30 rounded-md">
							<p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
							<div className="flex flex-wrap gap-2">
								{tags.map((tag, idx) => (
									<span
										key={idx}
										className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded group">
										<Tag className="h-3 w-3" />
										{tag}
										<button
											onClick={() => handleRemoveTag(tag)}
											disabled={isTagging}
											className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
											title="Remove tag">
											<X className="h-2.5 w-2.5" />
										</button>
									</span>
								))}
							</div>
						</div>
					)}

					{/* Success Message */}
					{tagSuccess && (
						<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
							<Check className="h-4 w-4" />
							<span className="text-sm">Tag added successfully!</span>
						</div>
					)}

					{/* Content */}
					<div className="mb-2">
						<p className="text-sm font-medium text-muted-foreground mb-2">Content</p>
						<ContentParagraphs content={documentItem.content} />
					</div>
				</CardContent>
			</Card>
		</div>,
		typeof window !== 'undefined' ? window.document.body : document.createElement('div')
	);
}

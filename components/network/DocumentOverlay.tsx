'use client';

import { useDocumentTags } from '@/hooks/use-document-tags';
import { changeTag } from '@/lib/api/tags-client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { PassageMatch } from '@/lib/contracts/search';
import { inPassage, matchLabel, paragraphsOf } from '@/lib/reading/paragraphs';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader } from '@/components/ui/card';
import { X, Tag, Plus, Check } from 'lucide-react';
import { Z_INDEX } from '@/lib/config/graph-config';
import { Node } from '@/lib/config/types';
import { reportError } from '@/lib/observability/capture-client';

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
	category?: string;    // Maps to Node.publisher
	readTime?: string;
	status: 'read' | 'unread' | 'reading';
	url?: string;         // Maps to Node.url
	/** The search's best matching passages, shown on the right; clicking one scrolls the article there */
	passages?: PassageMatch[];
	matches?: number;
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
		category: node.publisher,
		url: node.url,
		passages: node.passages,
		matches: node.matches,
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

/** The article with its matching passages lit: the one picked strongly, the others faintly */
function PassageText({ text, passages, active }: { text: string; passages: PassageMatch[]; active: number }) {
	const paragraphs = useMemo(() => paragraphsOf(text), [text]);
	return (
		<div className="max-w-none space-y-3 text-sm leading-relaxed">
			{paragraphs.map((p, i) => {
				if (!p.text.trim()) return null;
				const hit = passages.findIndex((m) => inPassage(p, m));
				const lit = hit === active ? 'rounded-md bg-lit-soft px-3 py-1.5 text-foreground shadow-[inset_3px_0_0_var(--lit)]' : hit >= 0 ? 'rounded-md bg-lit-soft/40 px-3 py-1' : 'text-muted-foreground';
				return (
					<p key={i} data-passage={hit >= 0 ? hit : undefined} className={lit}>
						{p.text}
					</p>
				);
			})}
		</div>
	);
}

export default function DocumentOverlay({
	document: documentItem,
	onClose,
	isInContext,
	onToggleContext,
}: DocumentOverlayProps) {
	// State to track if we're in the browser environment
	const [mounted, setMounted] = useState(false);
	
	// Tag management state; tags load and refresh through the shared helper
	const { data: loadedTags, error: tagsLoadError } = useDocumentTags(documentItem.id);
	const tags = loadedTags ?? [];
	const [showTagInput, setShowTagInput] = useState(false);
	const [tagInput, setTagInput] = useState('');
	const [isTagging, setIsTagging] = useState(false);
	const [tagSuccess, setTagSuccess] = useState(false);
	const [tagError, setTagError] = useState<string | null>(null);

	// Matches from the search: the full text comes from the database, so every passage can be shown
	const passages = documentItem.passages ?? [];
	const [active, setActive] = useState(0);
	const [fullText, setFullText] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (passages.length === 0) return;
		let live = true;
		fetch(`/api/documents/${encodeURIComponent(documentItem.id)}/text`)
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => live && d?.body && setFullText(d.body))
			.catch(() => {});
		return () => { live = false; };
	}, [documentItem.id, passages.length]);
	const text = fullText ?? documentItem.content;

	// Scroll the article (only the article, never the page) to the picked match
	useEffect(() => {
		if (passages.length === 0) return;
		const box = scrollRef.current;
		const el = box?.querySelector<HTMLElement>(`[data-passage="${active}"]`);
		if (box && el) box.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' });
	}, [active, text, passages.length]);

	// Esc closes reading mode (unless you're typing a tag)
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement)) onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	useEffect(() => {
		if (tagsLoadError) reportError('document-tags-load', tagsLoadError);
	}, [tagsLoadError]);

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
			// Updates the results and refreshes this document's tags
			await changeTag([documentItem.id], tagInput.trim(), 'add');

			// Show success and reset
			setTagSuccess(true);
			setTimeout(() => setTagSuccess(false), 2000);
			setTagInput('');
			setShowTagInput(false);
		} catch (err) {
			reportError('document-tag-add', err);
			setTagError(err instanceof Error ? err.message : 'Failed to add tag');
		} finally {
			setIsTagging(false);
		}
	};

	const handleRemoveTag = async (tagToRemove: string) => {
		setIsTagging(true);
		setTagError(null);

		try {
			await changeTag([documentItem.id], tagToRemove, 'remove');
		} catch (err) {
			reportError('document-tag-remove', err);
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
				className={`w-full ${passages.length ? 'max-w-6xl' : 'max-w-4xl'} max-h-[90vh] overflow-hidden shadow-2xl`}
				style={{ position: 'relative', zIndex: Z_INDEX.modal }}>
				<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={onClose}
								aria-label="Close reading mode"
								title="Close (Esc)"
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

				<div className="flex max-h-[calc(90vh-120px)]">
				{/* A plain div (not CardContent) so the scroll box can take a ref */}
				<div data-slot="card-content" ref={scrollRef} className="relative min-w-0 flex-1 overflow-y-auto px-6 pb-6">
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
						{passages.length ? <PassageText text={text} passages={passages} active={active} /> : <ContentParagraphs content={documentItem.content} />}
					</div>
				</div>
				{passages.length > 0 && (
					<aside aria-label="Matches" className="w-64 shrink-0 space-y-2 overflow-y-auto border-l border-border bg-muted/40 p-3">
						<p className="text-xs font-semibold">{documentItem.matches ?? passages.length} match{(documentItem.matches ?? passages.length) === 1 ? '' : 'es'}</p>
						{passages.map((m, i) => (
							<button key={m.position} type="button" onClick={() => setActive(i)} aria-pressed={i === active}
								className={`block w-full rounded-lg border px-2.5 py-2 text-left text-xs ${i === active ? 'border-lit bg-lit-soft' : 'border-border bg-card hover:border-lit/60'}`}>
								<span className="block font-medium text-foreground">{matchLabel(m)}</span>
								<span className="mt-0.5 block line-clamp-2 text-muted-foreground">{m.text}</span>
							</button>
						))}
					</aside>
				)}
				</div>
			</Card>
		</div>,
		typeof window !== 'undefined' ? window.document.body : document.createElement('div')
	);
}

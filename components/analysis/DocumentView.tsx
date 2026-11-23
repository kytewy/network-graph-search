'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, ChevronDown, Copy, Maximize2, Minimize2, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DocumentOverlay, { nodeToReadingItem } from '@/components/network/DocumentOverlay';
import { useHighlightOnHover } from '@/hooks/use-highlight-on-hover';
import { citedId, documentTitle, findCitations, linkCitations, matchCitation, toPlainText } from '@/lib/chat/citations';
import { useContextStore } from '@/lib/stores/context-store';
import type { Node } from '@/lib/config/types';

interface DocumentViewProps {
	question: string;
	answer: string;
	/** Filling the whole panel (no chat beside it) */
	full: boolean;
	/** ⤢: widen the panel, or fill it when already wide */
	onExpand: () => void;
	onClose: () => void;
}

function download(name: string, text: string, type: string) {
	const url = URL.createObjectURL(new Blob([text], { type }));
	Object.assign(document.createElement('a'), { href: url, download: name }).click();
	URL.revokeObjectURL(url);
}

const fileName = (title: string, ext: string) =>
	`${title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase().slice(0, 60) || 'analysis'}.${ext}`;

/**
 * An answer opened as a document: a toolbar (copy, download, expand, close),
 * the answer with its [citations] linked to the documents in context, and a
 * Sources list. Hovering a citation lights its document up on the graph;
 * clicking opens it in reading mode.
 */
export function DocumentView({ question, answer, full, onExpand, onClose }: DocumentViewProps) {
	const contextNodes = useContextStore((s) => s.contextNodes);
	const addNodesToContext = useContextStore((s) => s.addNodesToContext);
	const removeNodeFromContext = useContextStore((s) => s.removeNodeFromContext);
	const highlight = useHighlightOnHover();
	const [reading, setReading] = useState<Node | null>(null);
	const [copied, setCopied] = useState(false);

	const title = documentTitle(answer, question);
	const { linked, sources, unmatched } = useMemo(() => {
		const docs = contextNodes.map((n) => ({ id: n.id, label: n.label }));
		const cited = findCitations(answer);
		const found = cited.map((name) => matchCitation(name, docs));
		const ids = [...new Set(found.filter(Boolean).map((d) => d!.id))];
		return {
			linked: linkCitations(answer, docs),
			sources: ids.map((id) => contextNodes.find((n) => n.id === id)!),
			unmatched: found.filter((d) => !d).length,
		};
	}, [answer, contextNodes]);

	// The answer as a file: title, the question, the answer, then its sources
	const asMarkdown = () =>
		[`# ${title}`, `_Question: ${question}_`, answer, sources.length ? `## Sources\n${sources.map((s) => `- ${s.label}`).join('\n')}` : '']
			.filter(Boolean)
			.join('\n\n');

	const tool = 'h-8 px-2 rounded-md flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50';
	const ExpandIcon = full ? Minimize2 : Maximize2;

	return (
		<article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm" aria-label={`Document: ${title}`} data-testid="document-view">
			{/* Toolbar, like a file viewer */}
			<header className="@container flex items-center gap-1 border-b px-3 py-2">
				<p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
				<button
					type="button"
					className={tool}
					aria-label="Copy document"
					title="Copy"
					onClick={() => {
						navigator.clipboard?.writeText(answer);
						setCopied(true);
						setTimeout(() => setCopied(false), 1500);
					}}>
					{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
				</button>
				<DropdownMenu>
					<DropdownMenuTrigger className={tool} aria-label="Download document" title="Download">
						<span className={full ? '' : 'sr-only @lg:not-sr-only'}>Download</span>
						<ChevronDown className="h-3.5 w-3.5" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onSelect={() => download(fileName(title, 'md'), asMarkdown(), 'text/markdown')}>Markdown (.md)</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => download(fileName(title, 'txt'), toPlainText(asMarkdown()), 'text/plain')}>Plain text (.txt)</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<button type="button" className={tool} onClick={onExpand} aria-label={full ? 'Show chat beside document' : 'Expand document'} title={full ? 'Show the chat beside it' : 'Expand'}>
					<ExpandIcon className="h-4 w-4" />
				</button>
				<button type="button" className={tool} onClick={onClose} aria-label="Close document" title="Close">
					<X className="h-4 w-4" />
				</button>
			</header>

			<div className="flex-1 overflow-y-auto px-6 py-5">
				<div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							// A citation link lights its document on the graph and opens it on click
							a: ({ href, children }) => {
								const id = citedId(href);
								const node = id ? contextNodes.find((n) => n.id === id) : undefined;
								if (!node) return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
								return (
									<button
										type="button"
										data-citation={node.id}
										{...highlight(node.id)}
										onClick={() => setReading(node as Node)}
										className="rounded px-0.5 font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:bg-primary/10">
										[{children}]
									</button>
								);
							},
						}}>
						{linked}
					</ReactMarkdown>
				</div>

				{(sources.length > 0 || unmatched > 0) && (
					<section className="mt-6 border-t pt-4" aria-label="Sources">
						<h3 className="mb-2 text-sm font-semibold">Sources ({sources.length})</h3>
						<ul className="space-y-1">
							{sources.map((s) => (
								<li key={s.id}>
									<button
										type="button"
										{...highlight(s.id)}
										onClick={() => setReading(s as Node)}
										className="w-full rounded-md px-2 py-1 text-left text-sm hover:bg-primary/10">
										{s.label}
									</button>
								</li>
							))}
						</ul>
						{unmatched > 0 && (
							<p className="mt-2 text-xs text-muted-foreground">
								{unmatched} cited {unmatched === 1 ? 'name' : 'names'} didn&apos;t match a document in context.
							</p>
						)}
					</section>
				)}
			</div>

			{reading && (
				<DocumentOverlay
					document={nodeToReadingItem(reading)}
					onClose={() => setReading(null)}
					isInContext={contextNodes.some((n) => n.id === reading.id)}
					onToggleContext={() =>
						contextNodes.some((n) => n.id === reading.id) ? removeNodeFromContext(reading.id) : addNodesToContext([reading])
					}
				/>
			)}
		</article>
	);
}

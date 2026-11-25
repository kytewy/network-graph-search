'use client';

import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { coverage } from '@/lib/chat/coverage';
import { BUDGET_CHARS } from '@/lib/chat/read-document';
import { cutCount, sentDetail, sentShare, type Receipt, type SentDocument } from '@/lib/chat/receipt';

interface ReceiptDialogProps {
	receipt: Receipt | null;
	/** The answer, to mark which documents it cites */
	answer: string;
	onClose: () => void;
	/** Opens a document in reading mode (the receipt comes back when it closes) */
	onOpenDocument?: (id: string) => void;
}

const n = (x: number) => x.toLocaleString('en-US');
/** One grid for the header and every row, so the columns line up */
const ROW = 'grid grid-cols-[2.5rem_minmax(0,1fr)_7.5rem_5rem] items-center gap-x-3';
/** A document's own length; receipts saved before lengths were recorded use what was sent from */
const lengthOf = (d: SentDocument) => d.length || d.total;

/** "What was sent": every input to one answer, exactly as the server sent it */
export function ReceiptDialog({ receipt, answer, onClose, onOpenDocument }: ReceiptDialogProps) {
	if (!receipt) return null;
	const citedIds = new Set(coverage(answer, receipt).cited.map((d) => d.id));
	const readDocs = receipt.documents.filter((d) => d.readOnRequest);
	const readCount = readDocs.length;
	const readChars = readDocs.reduce((sum, d) => sum + d.sent, 0);
	const totalLength = receipt.documents.reduce((sum, d) => sum + lengthOf(d), 0);
	// A summary isn't part of the text, so only text that was sent counts here
	const totalSent = receipt.documents.reduce((sum, d) => sum + (d.sentAs === 'text' ? d.sent : 0), 0);
	const cut = cutCount(receipt);
	const docs = receipt.documents.length;
	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent style={{ width: 'min(60rem, calc(100vw - 2rem))', maxWidth: 'none' }} className="flex h-[85vh] flex-col overflow-hidden">
				{/* A fixed height, so the top stays put; the header and tabs stay, only the list scrolls */}
				<DialogHeader className="shrink-0">
					<DialogTitle>What was sent</DialogTitle>
					<DialogDescription data-testid="receipt-line">
						{docs} document{docs === 1 ? '' : 's'} · about {n(receipt.tokens)} of {n(receipt.contextWindow)} tokens · {receipt.model}
						{cut > 0 && ` · ${cut} cut to ${n(receipt.charLimit)} characters`}
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue="documents" className="flex min-h-0 min-w-0 flex-1 flex-col">
					<TabsList className="shrink-0">
						<TabsTrigger value="documents">Documents {docs}</TabsTrigger>
						<TabsTrigger value="instructions">Instructions</TabsTrigger>
						<TabsTrigger value="memory">Memory {receipt.memoryTurns}</TabsTrigger>
					</TabsList>
					<TabsContent value="documents" className="min-h-0 flex-1 overflow-y-auto pr-1">
						{readCount > 0 && (
							<p className="mb-2 text-xs text-violet-800" data-testid="read-on-request">
								Read {readCount} in full on request · {n(readChars)} of {n(BUDGET_CHARS)} budget characters · {receipt.readRounds ?? 1} round{(receipt.readRounds ?? 1) === 1 ? '' : 's'}
								{(receipt.readsRefused ?? 0) > 0 && ` · ${receipt.readsRefused} more asked after the budget ran out`}
							</p>
						)}
						<div className={`${ROW} border-b pb-1 text-xs text-muted-foreground`} aria-hidden>
							<span>Cited</span>
							<span>Document</span>
							<span>Sent</span>
							<span className="text-right">Characters</span>
						</div>
						<ul className="divide-y text-sm" aria-label="Documents sent">
							{[...receipt.documents].sort((a, b) => Number(citedIds.has(b.id)) - Number(citedIds.has(a.id))).map((d) => (
								<li key={d.id} className={`${ROW} py-1.5`}>
									<span className="flex justify-center">{citedIds.has(d.id) && <Check role="img" aria-label="Cited" className="h-3.5 w-3.5 text-teal-700" />}</span>
									<span className="flex min-w-0 items-baseline gap-2">
										<button
											type="button"
											onClick={() => onOpenDocument?.(d.id)}
											title={`Open ${d.title} in reading mode`}
											className="truncate text-left underline-offset-2 hover:text-primary hover:underline">
											{d.title}
										</button>
										{d.readOnRequest && <span className="shrink-0 text-xs text-violet-700">read in full</span>}
									</span>
									<SentMeter d={d} />
									<span className="text-right text-xs tabular-nums text-muted-foreground">{n(lengthOf(d))}</span>
								</li>
							))}
						</ul>
						<p className="mt-2 border-t pt-2 text-right text-xs text-muted-foreground" data-testid="receipt-total">
							{docs} documents · {n(totalLength)} characters in all · {n(totalSent)} sent ({Math.round((totalSent / Math.max(totalLength, 1)) * 100)}%)
						</p>
					</TabsContent>
					<TabsContent value="instructions" className="min-h-0 flex-1 space-y-3 overflow-y-auto text-sm">
						<div>
							<h3 className="font-medium">Question</h3>
							<p className="text-muted-foreground">{receipt.question ?? 'The default analysis: themes, relationships, patterns and insights'}</p>
						</div>
						<div>
							<h3 className="font-medium">Workstream goal</h3>
							<p className="text-muted-foreground">{receipt.goal ?? 'None set'}</p>
						</div>
						<div>
							<h3 className="font-medium">Suggestion options</h3>
							<p className="text-muted-foreground">
								{receipt.suggestions ? 'Sent: the filters, colours, clusters and titles the answer may suggest' : 'Not sent'}
							</p>
						</div>
					</TabsContent>
					<TabsContent value="memory" className="min-h-0 flex-1 overflow-y-auto text-sm text-muted-foreground">
						{receipt.memoryTurns === 0
							? 'No earlier questions went along: this was answered on its own.'
							: `The last ${receipt.memoryTurns} question${receipt.memoryTurns === 1 ? '' : 's'} and answer${receipt.memoryTurns === 1 ? '' : 's'} went along, so follow-ups make sense.`}
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

/** How much of one document went: a small bar and a percentage, or "Summary" */
function SentMeter({ d }: { d: SentDocument }) {
	const share = sentShare(d);
	if (share === null)
		return (
			<span className="text-xs text-muted-foreground" title={sentDetail(d)}>
				Summary
			</span>
		);
	const pct = Math.round(share * 100);
	return (
		<span className="flex items-center gap-2 whitespace-nowrap" title={sentDetail(d)} aria-label={`${pct}% sent`}>
			<span aria-hidden className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-200">
				<span className={`block h-full ${pct < 100 ? 'bg-amber-500' : 'bg-teal-600'}`} style={{ width: `${pct}%` }} />
			</span>
			<span className={`w-9 text-right text-xs tabular-nums ${pct < 100 ? 'text-amber-800' : 'text-muted-foreground'}`}>{pct}%</span>
		</span>
	);
}

'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cutCount, describeSent, type Receipt } from '@/lib/chat/receipt';

interface ReceiptDialogProps {
	receipt: Receipt | null;
	onClose: () => void;
}

const n = (x: number) => x.toLocaleString('en-US');

/** "What was sent": every input to one answer, exactly as the server sent it */
export function ReceiptDialog({ receipt, onClose }: ReceiptDialogProps) {
	if (!receipt) return null;
	const cut = cutCount(receipt);
	const docs = receipt.documents.length;
	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent style={{ width: 'min(60rem, calc(100vw - 2rem))', maxWidth: 'none' }} className="max-h-[85vh] grid-cols-[minmax(0,1fr)] overflow-x-hidden overflow-y-auto">
				<DialogHeader>
					<DialogTitle>What was sent</DialogTitle>
					<DialogDescription data-testid="receipt-line">
						{docs} document{docs === 1 ? '' : 's'} · about {n(receipt.tokens)} of {n(receipt.contextWindow)} tokens · {receipt.model}
						{cut > 0 && ` · ${cut} cut to ${n(receipt.charLimit)} characters`}
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue="documents" className="min-w-0">
					<TabsList>
						<TabsTrigger value="documents">Documents {docs}</TabsTrigger>
						<TabsTrigger value="instructions">Instructions</TabsTrigger>
						<TabsTrigger value="memory">Memory {receipt.memoryTurns}</TabsTrigger>
					</TabsList>
					<TabsContent value="documents">
						{cut > 0 && (
							<p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
								Each document sends at most {n(receipt.charLimit)} characters, about a paragraph. {cut} of {docs} were cut, so the AI saw only their start.
							</p>
						)}
						<ul className="divide-y text-sm" aria-label="Documents sent">
							{receipt.documents.map((d) => (
								<li key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 py-2">
									<span className="truncate" title={d.title}>{d.title}</span>
									<span className={`whitespace-nowrap ${d.total > d.sent ? 'text-amber-800' : 'text-muted-foreground'}`}>{describeSent(d)}</span>
								</li>
							))}
						</ul>
					</TabsContent>
					<TabsContent value="instructions" className="space-y-3 text-sm">
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
					<TabsContent value="memory" className="text-sm text-muted-foreground">
						{receipt.memoryTurns === 0
							? 'No earlier questions went along: this was answered on its own.'
							: `The last ${receipt.memoryTurns} question${receipt.memoryTurns === 1 ? '' : 's'} and answer${receipt.memoryTurns === 1 ? '' : 's'} went along, so follow-ups make sense.`}
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

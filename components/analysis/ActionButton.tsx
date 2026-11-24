'use client';

import { Check, ChevronDown, Filter, Network, Palette, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { alternatives, describeAction, previewCount } from '@/lib/chat/actions';
import type { ChatAction } from '@/lib/contracts/analysis';

// The same icons as the graph's Filter, Colour and Cluster buttons
const ICONS = { filter: Filter, color: Palette, cluster: Network, context: Plus } as const;

function ActionText({ action }: { action: ChatAction }) {
	const Icon = ICONS[action.type];
	const count = previewCount(action);
	return (
		<>
			<Icon className="h-3 w-3 shrink-0" aria-hidden />
			<span>{describeAction(action)}</span>
			{count !== null && <span className="opacity-60">· {count} {count === 1 ? 'doc' : 'docs'}</span>}
		</>
	);
}

interface ActionButtonProps {
	action: ChatAction;
	/** The action that was applied from this button (it or an alternative), if any */
	applied?: ChatAction;
	onApply: (action: ChatAction) => void;
	onUndo: () => void;
}

/**
 * One suggestion under an answer. The app writes its text from the action, so
 * it says exactly what will happen; the AI's wording is in the hover. ▾ offers
 * close alternatives ("Country: European Union" instead of "Continent: Europe").
 */
export function ActionButton({ action, applied, onApply, onUndo }: ActionButtonProps) {
	if (applied) {
		return (
			<span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-xs text-green-800">
				<Check className="h-3 w-3" aria-hidden />
				{describeAction(applied)}
				<button type="button" className="font-medium underline" onClick={onUndo}>
					Undo
				</button>
			</span>
		);
	}
	const others = alternatives(action);
	return (
		<span className="inline-flex items-stretch overflow-hidden rounded-full border border-primary/40 bg-white text-xs text-primary">
			<button type="button" onClick={() => onApply(action)} title={`Suggested: ${action.label}`} className="inline-flex items-center gap-1 px-2.5 py-1 hover:bg-primary/5">
				<ActionText action={action} />
			</button>
			{others.length > 0 && (
				<DropdownMenu>
					<DropdownMenuTrigger aria-label={`Other choices for ${describeAction(action)}`} className="border-l border-primary/30 px-1.5 hover:bg-primary/5">
						<ChevronDown className="h-3 w-3" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="text-xs">
						{others.map((alt) => (
							<DropdownMenuItem key={describeAction(alt)} onSelect={() => onApply(alt)} className="gap-1.5 text-xs">
								<ActionText action={alt} />
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</span>
	);
}

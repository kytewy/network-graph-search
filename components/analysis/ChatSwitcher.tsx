'use client';

import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, SquarePen, Trash2 } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatTurns, MAIN_CHAT, useContextStore } from '@/lib/stores/context-store';

const arrow = 'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground disabled:opacity-30';

/** "‹ 2 of 5 › Cluster: High-risk obligations ▾  + New": flip between chats, start one, delete one */
export function ChatSwitcher({ onSwitch }: { onSwitch: () => void }) {
	const { chats, activeChatId, chatConversations, newChat, selectChat, deleteChat } = useContextStore();
	const [confirming, setConfirming] = useState(false);
	const index = Math.max(0, chats.findIndex((c) => c.id === activeChatId));
	const active = chats[index];
	const questions = (id: string) => chatTurns(chatConversations, id).length;
	const open = (id: string) => {
		selectChat(id);
		setConfirming(false);
		onSwitch();
	};
	const isMain = active.id === MAIN_CHAT.id;

	if (confirming) {
		const n = questions(active.id);
		return (
			<div className="flex items-center gap-2 border-b py-1.5 text-xs" role="group" aria-label="Confirm delete">
				<span className="min-w-0 flex-1 truncate">
					{isMain ? 'Clear' : 'Delete'} “{active.name}” and its {n} question{n === 1 ? '' : 's'}?
				</span>
				<button
					type="button"
					onClick={() => {
						deleteChat(active.id);
						setConfirming(false);
						onSwitch();
					}}
					className="rounded-md bg-destructive px-2 py-1 text-white hover:bg-destructive/90">
					{isMain ? 'Clear' : 'Delete'}
				</button>
				<button type="button" onClick={() => setConfirming(false)} className="rounded-md px-2 py-1 hover:bg-accent/50">
					Cancel
				</button>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-1 border-b py-1.5 text-xs" data-testid="chat-switcher">
			<button type="button" className={arrow} aria-label="Previous chat" disabled={index === 0} onClick={() => open(chats[index - 1].id)}>
				<ChevronLeft className="h-4 w-4" />
			</button>
			<span className="tabular-nums text-muted-foreground" aria-live="polite">
				{index + 1} of {chats.length}
			</span>
			<button type="button" className={arrow} aria-label="Next chat" disabled={index === chats.length - 1} onClick={() => open(chats[index + 1].id)}>
				<ChevronRight className="h-4 w-4" />
			</button>
			<DropdownMenu>
				<DropdownMenuTrigger className="flex min-w-0 flex-1 items-center gap-1 rounded-md border bg-white px-2 py-1 text-left hover:bg-accent/30" aria-label={`Chats: ${active.name}`}>
					<span className="min-w-0 flex-1 truncate">{active.name}</span>
					<ChevronDown aria-hidden className="h-3.5 w-3.5 shrink-0" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-72 text-xs">
					{chats.map((c) => (
						<DropdownMenuItem key={c.id} onSelect={() => open(c.id)} className={`gap-2 text-xs ${c.id === activeChatId ? 'bg-accent/60 font-medium' : ''}`}>
							<span className="min-w-0 flex-1 truncate">{c.name}</span>
							<span className="shrink-0 text-muted-foreground">{questions(c.id)} q</span>
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={() => setConfirming(true)} disabled={isMain && questions(active.id) === 0} className="gap-2 text-xs text-destructive">
						<Trash2 aria-hidden className="h-3.5 w-3.5" />
						{isMain ? 'Clear this chat' : 'Delete this chat'}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<button
				type="button"
				onClick={() => {
					newChat();
					setConfirming(false);
					onSwitch();
				}}
				className="flex items-center gap-1 rounded-md px-2 py-1 text-primary hover:bg-primary/5">
				<SquarePen aria-hidden className="h-3.5 w-3.5" /> New
			</button>
		</div>
	);
}

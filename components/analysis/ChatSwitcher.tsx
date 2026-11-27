'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, Trash2, X } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatTurns, MAIN_CHAT, useContextStore } from '@/lib/stores/context-store';

/** Chats you've closed: hidden from the tabs, still in the ▾ list (kept in this browser) */
const CLOSED_KEY = 'lantern:closed-chat-tabs';

function readClosed(): string[] {
	try {
		const saved = JSON.parse(localStorage.getItem(CLOSED_KEY) ?? '[]');
		return Array.isArray(saved) ? saved : [];
	} catch {
		return [];
	}
}

/** One tab per chat, × to close a tab, ▾ for every chat (and delete), + for a new one */
export function ChatSwitcher({ onSwitch }: { onSwitch: () => void }) {
	const { chats, activeChatId, chatConversations, newChat, selectChat, deleteChat } = useContextStore();
	const [confirming, setConfirming] = useState(false);
	const [closed, setClosed] = useState<string[]>([]);
	const activeRef = useRef<HTMLButtonElement>(null);
	const active = chats.find((c) => c.id === activeChatId) ?? chats[0];
	const questions = (id: string) => chatTurns(chatConversations, id).length;
	const isMain = active.id === MAIN_CHAT.id;
	// The open chat always has a tab, even if it was closed before
	const tabs = chats.filter((c) => c.id === active.id || !closed.includes(c.id));

	useEffect(() => {
		setClosed(readClosed());
	}, []);
	useEffect(() => {
		activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}, [active.id]);

	const saveClosed = (next: string[]) => {
		setClosed(next);
		try {
			localStorage.setItem(CLOSED_KEY, JSON.stringify(next));
		} catch {
			// Private mode: tabs just reopen next visit
		}
	};
	const open = (id: string) => {
		selectChat(id);
		if (closed.includes(id)) saveClosed(closed.filter((c) => c !== id));
		setConfirming(false);
		onSwitch();
	};
	const close = (id: string) => {
		const at = tabs.findIndex((c) => c.id === id);
		saveClosed([...closed, id]);
		// Closing the open tab moves to its neighbour, like a browser
		if (id === active.id) {
			const next = tabs[at + 1] ?? tabs[at - 1];
			if (next) open(next.id);
		}
	};

	if (confirming) {
		const n = questions(active.id);
		return (
			<div className="flex items-center gap-2 py-1.5 text-xs" role="group" aria-label="Confirm delete">
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
		<div className="-mx-4 mb-2 flex items-end gap-1 border-b border-border/70 px-2 pt-1 text-xs" data-testid="chat-switcher">
			<div role="tablist" aria-label="Chats" className="flex min-w-0 flex-1 items-end gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{tabs.map((c) => {
					const on = c.id === active.id;
					return (
						<div
							key={c.id}
							className={`group -mb-px flex max-w-[11rem] shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 pl-2.5 pr-1 ${
								on ? 'border-border/70 bg-card text-foreground' : 'border-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground'
							}`}>
							{on && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
							<button
								ref={on ? activeRef : undefined}
								type="button"
								role="tab"
								aria-selected={on}
								title={c.name}
								onClick={() => open(c.id)}
								className="min-w-0 truncate py-2 text-left">
								{c.name}
							</button>
							{tabs.length > 1 && (
								<button
									type="button"
									aria-label={`Close ${c.name}`}
									onClick={() => close(c.id)}
									className={`rounded p-0.5 hover:bg-accent ${on ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}>
									<X aria-hidden className="h-3 w-3" />
								</button>
							)}
						</div>
					);
				})}
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger aria-label="All chats" title="All chats" className="mb-1 rounded-md p-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground">
					<ChevronDown aria-hidden className="h-3.5 w-3.5" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-72 text-xs">
					{chats.map((c) => (
						<DropdownMenuItem key={c.id} onSelect={() => open(c.id)} className={`gap-2 text-xs ${c.id === active.id ? 'bg-accent/60 font-medium' : ''}`}>
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
				aria-label="New chat"
				title="New chat"
				onClick={() => {
					newChat();
					setConfirming(false);
					onSwitch();
				}}
				className="mb-1 rounded-md p-1.5 text-primary hover:bg-primary/5">
				<Plus aria-hidden className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}

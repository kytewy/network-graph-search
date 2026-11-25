'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-state';
import { useContextStore } from '@/lib/stores/context-store';
import { useUrlSearch } from '@/hooks/use-url-search';
import { clearWorkspace, MAX_GOAL, useWorkspaceGoal } from '@/lib/workspace/keep';

/**
 * The top of the workspace: its goal ("What are you trying to answer?"),
 * sent with every chat question, then what's kept and a way to start over.
 */
export function WorkspaceBar() {
	const { goal, setGoal } = useWorkspaceGoal();
	const searches = useAppStore((s) => s.rounds.length);
	const inContext = useContextStore((s) => s.contextNodes.length);
	const { clear } = useUrlSearch();
	const [confirming, setConfirming] = useState(false);

	return (
		<div className="space-y-1" data-testid="workspace-bar">
			<label className="flex items-center gap-2 rounded-lg border border-primary/30 bg-white px-3 py-1.5 focus-within:border-primary">
				<Target className="h-4 w-4 shrink-0 text-primary" aria-hidden />
				<input
					value={goal}
					onChange={(e) => setGoal(e.target.value)}
					maxLength={MAX_GOAL}
					aria-label="Workspace goal"
					placeholder="What are you trying to answer? …so I can…"
					className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
				/>
			</label>
			{searches > 0 && (
				// One short line: the details are in the hover, and "Start over?" takes the whole line
				<div className="flex items-center gap-2 whitespace-nowrap px-1 text-xs text-muted-foreground">
					{confirming ? (
						<>
							<span>Start over?</span>
							<button
								type="button"
								className="ml-auto font-medium text-destructive hover:underline"
								onClick={() => {
									clearWorkspace();
									clear();
									setConfirming(false);
								}}>
								Yes, clear it
							</button>
							<button type="button" className="hover:underline" onClick={() => setConfirming(false)}>
								Cancel
							</button>
						</>
					) : (
						<>
							<span data-testid="workspace-status" title={`${searches} ${searches === 1 ? 'search' : 'searches'} · ${inContext} in context`}>
								✓ Saved
							</span>
							<button type="button" className="ml-auto hover:text-foreground hover:underline" onClick={() => setConfirming(true)}>
								New workspace
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
}

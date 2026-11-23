'use client';

import { useState } from 'react';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MAX_PROMPT_NAME, useSavedPrompts, type SavedPrompt } from '@/lib/stores/saved-prompts';

interface SavedPromptsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Puts a prompt's text in the chat box */
	onUse: (text: string) => void;
	/** What's in the chat box now, offered as the start of a new prompt */
	draft: string;
	/** Open straight into the new-prompt form with this text (Save as prompt on a chat question) */
	saveText?: string | null;
}

/** The name + text form, for a new prompt or an edit */
function PromptForm({ initial, onSave, onCancel }: { initial: { name: string; text: string }; onSave: (name: string, text: string) => boolean; onCancel: () => void }) {
	const [name, setName] = useState(initial.name);
	const [text, setText] = useState(initial.text);
	const field = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none';
	return (
		<form
			className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3"
			onSubmit={(e) => {
				e.preventDefault();
				if (onSave(name, text)) onCancel();
			}}>
			<input autoFocus aria-label="Prompt name" placeholder="Name, e.g. Compare to OSFI" maxLength={MAX_PROMPT_NAME} value={name} onChange={(e) => setName(e.target.value)} className={field} />
			<textarea aria-label="Prompt text" placeholder="The question to ask" rows={4} value={text} onChange={(e) => setText(e.target.value)} className={`${field} resize-y`} />
			<div className="flex justify-end gap-2">
				<Button type="button" variant="ghost" size="sm" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" size="sm" disabled={!name.trim() || !text.trim()}>
					Save prompt
				</Button>
			</div>
		</form>
	);
}

/**
 * Every saved prompt in one window: use one, edit it, delete it, or add a new
 * one (starting from whatever is in the chat box).
 */
export function SavedPromptsDialog({ open, onOpenChange, onUse, draft, saveText }: SavedPromptsDialogProps) {
	const { prompts, addPrompt, updatePrompt, removePrompt, duplicatePrompt } = useSavedPrompts();
	// 'new', a prompt's id being edited, or nothing
	const [editing, setEditing] = useState<string | null>(null);
	const startNew = saveText != null;
	const formOpen = editing === 'new' || (startNew && editing === null);

	const use = (p: SavedPrompt) => {
		onUse(p.text);
		onOpenChange(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setEditing(null);
				onOpenChange(next);
			}}>
			<DialogContent
				className="max-h-[85vh] overflow-y-auto"
				// Width set directly, so it holds even before the styles are rebuilt
				style={{ maxWidth: 'min(42rem, calc(100vw - 2rem))' }}>
				<DialogHeader>
					<DialogTitle>Saved prompts</DialogTitle>
					<DialogDescription>Questions you ask often. Pick one to put it in the chat box.</DialogDescription>
				</DialogHeader>

				{formOpen ? (
					<PromptForm
						initial={{ name: '', text: saveText ?? draft }}
						onSave={(n, t) => addPrompt(n, t) !== null}
						onCancel={() => (startNew ? onOpenChange(false) : setEditing(null))}
					/>
				) : (
					<Button variant="outline" className="w-full justify-start gap-2" onClick={() => setEditing('new')}>
						<Plus className="h-4 w-4" />
						{draft.trim() ? 'Save what’s in the chat box as a prompt' : 'New prompt'}
					</Button>
				)}

				<ul className="space-y-2" aria-label="Saved prompts list">
					{prompts.length === 0 && <li className="text-sm text-muted-foreground">No saved prompts yet.</li>}
					{prompts.map((p) =>
						editing === p.id ? (
							<li key={p.id}>
								<PromptForm initial={p} onSave={(n, t) => updatePrompt(p.id, n, t)} onCancel={() => setEditing(null)} />
							</li>
						) : (
							<li key={p.id} className="group flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 hover:border-primary/40">
								<button type="button" onClick={() => use(p)} className="min-w-0 flex-1 text-left" aria-label={`Use ${p.name}`}>
									<span className="block text-sm font-medium">{p.name}</span>
									<span className="text-xs text-muted-foreground line-clamp-2">{p.text}</span>
								</button>
								<button type="button" onClick={() => setEditing(duplicatePrompt(p.id))} aria-label={`Duplicate ${p.name}`} title="Duplicate and edit" className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50">
									<Copy className="h-3.5 w-3.5" />
								</button>
								<button type="button" onClick={() => setEditing(p.id)} aria-label={`Edit ${p.name}`} title="Edit" className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50">
									<Pencil className="h-3.5 w-3.5" />
								</button>
								<button type="button" onClick={() => removePrompt(p.id)} aria-label={`Delete ${p.name}`} title="Delete" className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-accent/50">
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</li>
						)
					)}
				</ul>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Saved prompts: questions you ask often, one click away in the chat. Kept in
 * this browser (localStorage) for now; they can move to workstreams later.
 * Starts with the three prompts the chat used to have as fixed buttons.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QUICK_PROMPTS } from '@/lib/prompts/analysis-prompts';

export interface SavedPrompt {
	id: string;
	name: string;
	text: string;
}

export const SAVED_PROMPTS_KEY = 'network-graph-search:saved-prompts';
export const MAX_PROMPT_NAME = 40;

export const STARTER_PROMPTS: SavedPrompt[] = [
	{ id: 'summary', name: 'Summary', text: QUICK_PROMPTS.summary.withSelection },
	{ id: 'business-impact', name: 'Business impact', text: QUICK_PROMPTS.businessImpact.withSelection },
	{ id: 'citations', name: 'Citations', text: QUICK_PROMPTS.citations.withSelection },
];

/** A name and text, tidied; null when either is empty */
export function cleanPrompt(name: string, text: string): Omit<SavedPrompt, 'id'> | null {
	const n = name.trim().slice(0, MAX_PROMPT_NAME);
	const t = text.trim();
	return n && t ? { name: n, text: t } : null;
}

interface SavedPromptsState {
	prompts: SavedPrompt[];
	/** Returns the new prompt's id, or null if the name or text is empty */
	addPrompt: (name: string, text: string) => string | null;
	updatePrompt: (id: string, name: string, text: string) => boolean;
	removePrompt: (id: string) => void;
}

export const useSavedPrompts = create<SavedPromptsState>()(
	persist(
		(set) => ({
			prompts: STARTER_PROMPTS,
			addPrompt: (name, text) => {
				const clean = cleanPrompt(name, text);
				if (!clean) return null;
				const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
				set((s) => ({ prompts: [...s.prompts, { id, ...clean }] }));
				return id;
			},
			updatePrompt: (id, name, text) => {
				const clean = cleanPrompt(name, text);
				if (!clean) return false;
				set((s) => ({ prompts: s.prompts.map((p) => (p.id === id ? { id, ...clean } : p)) }));
				return true;
			},
			removePrompt: (id) => set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) })),
		}),
		{ name: SAVED_PROMPTS_KEY, version: 1 }
	)
);

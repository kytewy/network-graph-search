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
	/** When it was last saved or used, so the chips show your recent ones */
	usedAt?: number;
}

export const SAVED_PROMPTS_KEY = 'network-graph-search:saved-prompts';
export const MAX_PROMPT_NAME = 40;

export const STARTER_PROMPTS: SavedPrompt[] = [
	{ id: 'summary', name: 'Summary', text: QUICK_PROMPTS.summary.withSelection },
	{ id: 'business-impact', name: 'Business impact', text: QUICK_PROMPTS.businessImpact.withSelection },
	{ id: 'citations', name: 'Citations', text: QUICK_PROMPTS.citations.withSelection },
];

/** The prompts for the chips: most recently used or saved first, then the list order */
export function recentPrompts(prompts: readonly SavedPrompt[], count: number): SavedPrompt[] {
	return prompts
		.map((p, i) => ({ p, i }))
		.sort((a, b) => (b.p.usedAt ?? 0) - (a.p.usedAt ?? 0) || a.i - b.i)
		.slice(0, count)
		.map(({ p }) => p);
}

/** Prompts for the "/" menu: names that match come before text-only matches */
export function matchPrompts(prompts: readonly SavedPrompt[], query: string): SavedPrompt[] {
	const q = query.trim().toLowerCase();
	if (!q) return [...prompts];
	const byName = prompts.filter((p) => p.name.toLowerCase().includes(q));
	const byText = prompts.filter((p) => !byName.includes(p) && p.text.toLowerCase().includes(q));
	return [...byName, ...byText];
}

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
	/** Copies a prompt (named "… (copy)") just below the original; returns the copy's id */
	duplicatePrompt: (id: string) => string | null;
	/** Marks a prompt as just used, so it moves to the front of the chips */
	touchPrompt: (id: string) => void;
}

const newId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const useSavedPrompts = create<SavedPromptsState>()(
	persist(
		(set, get) => ({
			prompts: STARTER_PROMPTS,
			addPrompt: (name, text) => {
				const clean = cleanPrompt(name, text);
				if (!clean) return null;
				const id = newId();
				set((s) => ({ prompts: [...s.prompts, { id, ...clean, usedAt: Date.now() }] }));
				return id;
			},
			updatePrompt: (id, name, text) => {
				const clean = cleanPrompt(name, text);
				if (!clean) return false;
				set((s) => ({ prompts: s.prompts.map((p) => (p.id === id ? { id, ...clean } : p)) }));
				return true;
			},
			touchPrompt: (id) => set((s) => ({ prompts: s.prompts.map((p) => (p.id === id ? { ...p, usedAt: Date.now() } : p)) })),
			removePrompt: (id) => set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) })),
			duplicatePrompt: (id) => {
				const at = get().prompts.findIndex((p) => p.id === id);
				if (at < 0) return null;
				const original = get().prompts[at];
				const copy = { id: newId(), name: `${original.name} (copy)`.slice(0, MAX_PROMPT_NAME), text: original.text };
				set((s) => ({ prompts: [...s.prompts.slice(0, at + 1), copy, ...s.prompts.slice(at + 1)] }));
				return copy.id;
			},
		}),
		{ name: SAVED_PROMPTS_KEY, version: 1 }
	)
);

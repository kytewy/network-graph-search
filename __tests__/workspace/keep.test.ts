import { clearWorkspace, keepSaving, readSnapshot, restoreSnapshot, snapshotMatches, takeSnapshot, useWorkspaceGoal, WORKSPACE_KEY, type Snapshot } from '@/lib/workspace/keep';
import { makeRound } from '@/lib/workspace/collect';
import { useAppStore } from '@/lib/stores/app-state';
import { useContextStore } from '@/lib/stores/context-store';
import type { Node } from '@/lib/config/types';

const doc = (id: string) => ({ id, label: id, score: 0.8, foundBy: [1] }) as Node;
const rounds = [makeRound(1, 'AI regulation', 50, [doc('a'), doc('b')]), makeRound(2, 'compliance', 50, [doc('b')])];

beforeEach(() => {
	localStorage.clear();
	clearWorkspace();
});

describe('snapshotMatches', () => {
	const snap = { rounds } as Snapshot;
	it('restores when the address has the same first search, or none', () => {
		expect(snapshotMatches(snap, ' ai regulation ', 50)).toBe(true);
		expect(snapshotMatches(snap, undefined, 50)).toBe(true);
	});
	it('starts fresh for a different search or size, or with nothing saved', () => {
		expect(snapshotMatches(snap, 'privacy', 50)).toBe(false);
		expect(snapshotMatches(snap, 'AI regulation', 20)).toBe(false);
		expect(snapshotMatches(null, 'AI regulation', 50)).toBe(false);
	});
});

describe('keeping the workspace', () => {
	it('saves what changes and brings it back after a "refresh"', async () => {
		vi.useFakeTimers();
		const stop = keepSaving(10);
		useWorkspaceGoal.getState().setGoal('Brief the board Friday');
		useAppStore.setState({ rounds, selectedSearches: ['2'] });
		useAppStore.getState().setSearchResults([doc('a'), doc('b')]);
		useContextStore.setState({
			contextNodes: [doc('a')],
			chatConversations: [
				{ id: '1', prompt: 'q', response: 'answer', timestamp: new Date(0), status: 'done' },
				{ id: '2', prompt: 'q2', response: '', timestamp: new Date(0), status: 'thinking' },
			],
		});
		vi.advanceTimersByTime(20);
		stop();
		vi.useRealTimers();

		const saved = readSnapshot()!;
		expect(saved.goal).toBe('Brief the board Friday');
		expect(saved.chat.map((c) => c.id)).toEqual(['1']); // the unfinished answer isn't kept

		// "Refresh": empty everything without touching storage, then restore
		useAppStore.setState({ rounds: [], selectedSearches: [] });
		useContextStore.setState({ contextNodes: [], chatConversations: [] });
		useWorkspaceGoal.setState({ goal: '' });
		restoreSnapshot(saved);
		expect(takeSnapshot()).toMatchObject({ goal: 'Brief the board Friday', selectedSearches: ['2'] });
		expect(useAppStore.getState().rounds.map((r) => r.query)).toEqual(['AI regulation', 'compliance']);
		expect(useContextStore.getState().contextNodes.map((n) => n.id)).toEqual(['a']);
		expect(useContextStore.getState().chatConversations[0].timestamp).toBeInstanceOf(Date);
	});

	it('New workspace empties it, saved copy included', () => {
		localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ v: 1, rounds }));
		useAppStore.setState({ rounds });
		clearWorkspace();
		expect(readSnapshot()).toBeNull();
		expect(useAppStore.getState().rounds).toEqual([]);
	});

	it('ignores a broken saved copy', () => {
		localStorage.setItem(WORKSPACE_KEY, '{not json');
		expect(readSnapshot()).toBeNull();
	});
});

import { expect, test } from '@playwright/test';
import reply from './fixtures/search-reply.json';
import { graphNodeCount, RESULT_COUNT, search } from './helpers';

const compliance = {
	nodes: [
		{ ...reply.nodes.find((n) => n.id === 'eu-ai-act')!, score: 0.71 },
		{ ...reply.nodes.find((n) => n.id === 'us-eo')!, id: 'nist-rmf', label: 'NIST AI RMF', score: 0.83 },
	],
	edges: [],
};
const total = RESULT_COUNT + 1;

test('the workspace (goal, searches, context, chat) survives a refresh; New workspace clears it', async ({ page }) => {
	const sent: any[] = [];
	await page.route('**/api/analyze-nodes', (r) => {
		sent.push(r.request().postDataJSON());
		return r.fulfill({ json: { summary: 'Aimed at the board briefing.' } });
	});
	await search(page);
	await page.route('**/api/reranked-vector-search', (r) =>
		r.request().postDataJSON().query === 'compliance' ? r.fulfill({ json: compliance }) : r.fallback()
	);
	const box = page.getByPlaceholder(/Search across/);
	await box.fill('compliance');
	await box.press('Shift+Enter');
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(total));

	// A goal, two documents in context, one chat answer
	await page.getByLabel('Workspace goal').fill('Which AI rules hit Canadian banks, so I can brief the board Friday');
	await page.getByTestId('context-groups').getByRole('button', { name: '+ All #2 compliance' }).click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const chatBox = page.getByRole('textbox', { name: 'Ask about the documents' });
	await chatBox.fill('What matters most?');
	await chatBox.press('Enter');
	await expect(page.locator('[data-role="assistant"]')).toContainText('board briefing');
	// The goal goes with the question
	expect(sent.at(-1).goal).toContain('brief the board Friday');
	await expect(page.getByTestId('workspace-status')).toHaveText('✓ Saved · 2 searches · 2 in context');

	// Refresh: everything comes back without searching again
	await page.waitForTimeout(600); // the save waits a moment after the last change
	await page.reload();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(total));
	await expect(page.getByLabel('Workspace goal')).toHaveValue(/brief the board Friday/);
	await expect(page.getByTestId('workspace-status')).toHaveText('✓ Saved · 2 searches · 2 in context');
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	await expect(page.locator('[data-role="assistant"]')).toContainText('board briefing');

	// New workspace asks first, then clears it all
	await page.getByRole('button', { name: 'New workspace' }).click();
	await page.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByTestId('workspace-status')).toBeVisible();
	await page.getByRole('button', { name: 'New workspace' }).click();
	await page.getByRole('button', { name: 'Yes, clear it' }).click();
	await expect(page.getByTestId('workspace-status')).toHaveCount(0);
	await expect(page.getByLabel('Workspace goal')).toHaveValue('');
	await expect(page).not.toHaveURL(/q=/);
	await page.reload();
	await expect(page.getByTestId('workspace-status')).toHaveCount(0);
});

test('a link to a different search starts fresh instead of restoring', async ({ page }) => {
	await search(page);
	await page.getByLabel('Workspace goal').fill('Old goal');
	await page.waitForTimeout(600);
	await page.goto('/graph?q=privacy&k=50');
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(RESULT_COUNT));
	await expect(page.getByTestId('workspace-status')).toHaveText(/1 search ·/);
});

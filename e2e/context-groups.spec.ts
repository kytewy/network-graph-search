import { expect, test } from '@playwright/test';
import reply from './fixtures/search-reply.json';
import { search } from './helpers';

const compliance = {
	nodes: [
		{ ...reply.nodes.find((n) => n.id === 'eu-ai-act')!, score: 0.71 },
		{ ...reply.nodes.find((n) => n.id === 'osfi-e23')!, score: 0.95 },
		{ ...reply.nodes.find((n) => n.id === 'us-eo')!, id: 'nist-rmf', label: 'NIST AI RMF', score: 0.83 },
	],
	edges: [],
};

test('context grouped by search (bulk add/remove) and by cluster (ask the chat)', async ({ page }) => {
	const asked: string[] = [];
	await page.route('**/api/analyze-nodes', (r) => {
		asked.push(r.request().postDataJSON().customPrompt);
		return r.fulfill({ json: { summary: 'ok' } });
	});
	await search(page);
	await page.route('**/api/reranked-vector-search', (r) =>
		r.request().postDataJSON().query === 'compliance' ? r.fulfill({ json: compliance }) : r.fallback()
	);
	const box = page.getByPlaceholder(/Search across/);
	await box.fill('compliance');
	await box.press('Shift+Enter');

	// Search #1's top 10 into context, from its section
	const groups = page.getByTestId('context-groups');
	await expect(groups.getByRole('region', { name: '#1 AI regulation' })).toContainText('0 of 6');
	await groups.getByRole('button', { name: '+ Top 10 #1 AI regulation' }).click();
	await expect(groups).toContainText('6 in context · 2 found by 2+ searches ★');
	await expect(groups.getByRole('region', { name: '#1 AI regulation' }).getByLabel('Found by #1, #2').first()).toBeVisible();
	await expect(groups.getByRole('region', { name: '#2 compliance' })).toContainText('2 of 3');

	// All of #2 adds the one it found alone
	await groups.getByRole('button', { name: '+ All #2 compliance' }).click();
	await expect(groups.getByRole('region', { name: '#2 compliance' })).toContainText('NIST AI RMF');

	// Group: none is the old table
	await page.getByRole('group', { name: 'Group context' }).getByRole('button', { name: 'none' }).click();
	await expect(page.getByTestId('context-table')).toBeVisible();

	// Cluster, then group by cluster and ask about one
	const ids = [...reply.nodes.map((n) => n.id), 'nist-rmf'];
	const clusters = [
		{ cluster_id: 'cluster_0', label: 'Cluster 0', size: 4, top_terms: ['eu'], node_ids: ids.slice(0, 4) },
		{ cluster_id: 'cluster_1', label: 'Cluster 1', size: 3, top_terms: ['us'], node_ids: ids.slice(4) },
	];
	await page.route('**/api/cluster-analysis', (r) =>
		r.fulfill({ json: { clusters, cluster_assignments: Object.fromEntries(clusters.flatMap((c) => c.node_ids.map((id) => [id, c.cluster_id]))) } })
	);
	await page.route('**/api/analyze-cluster', (r) => r.fulfill({ json: { clusterName: ['EU rules', 'Frameworks'][r.request().postDataJSON().clusterIndex], description: 'x' } }));
	const header = page.locator('[data-panel-header="right"]');
	await header.getByRole('tab', { name: 'Clusters' }).click();
	await page.getByRole('button', { name: 'Analyze Clusters' }).click();
	await expect(page.getByTestId('cluster-summary')).toContainText('ok');
	await header.getByRole('tab', { name: /^Context/ }).click();
	await page.getByRole('group', { name: 'Group context' }).getByRole('button', { name: 'cluster' }).click();
	await expect(groups.getByRole('region', { name: 'EU rules' })).toContainText('4');
	await groups.getByRole('button', { name: 'Ask about this Frameworks' }).click();
	await expect(header.getByRole('tab', { name: 'Chat' })).toHaveAttribute('data-state', 'active');
	await expect.poll(() => asked.at(-1)).toContain('"Frameworks" cluster');
});

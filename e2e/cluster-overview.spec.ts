import { expect, test } from '@playwright/test';
import reply from './fixtures/search-reply.json';
import { search } from './helpers';

const [a, b, c] = [reply.nodes.slice(0, 3), reply.nodes.slice(3, 5), reply.nodes.slice(5)].map((g) => g.map((n) => n.id));
const clusters = [a, b, c].map((ids, i) => ({ cluster_id: `cluster_${i}`, label: `Cluster ${i}`, size: ids.length, top_terms: ['ai'], node_ids: ids }));
const names = ['EU rules', 'Other jurisdictions', 'Asia guidance'];

test('clusters open with a count, a quick summary (spinner first) and one line per cluster', async ({ page }) => {
	let releaseSummary!: () => void;
	const summaryHeld = new Promise<void>((r) => (releaseSummary = r));
	await page.route('**/api/cluster-analysis', (r) =>
		r.fulfill({ json: { clusters, cluster_assignments: Object.fromEntries(clusters.flatMap((c) => c.node_ids.map((id) => [id, c.cluster_id]))) } })
	);
	await page.route('**/api/analyze-cluster', (r) => {
		const i = r.request().postDataJSON().clusterIndex;
		return r.fulfill({ json: { clusterName: names[i], description: `About ${names[i]}` } });
	});
	await page.route('**/api/analyze-nodes', async (r) => {
		await summaryHeld;
		await r.fulfill({ json: { summary: 'Three clusters: EU rules lead, with other jurisdictions and Asia guidance alongside.' } });
	});

	await search(page);
	for (const row of await page.getByTestId('results-table').locator('[data-result-row]').all()) await row.getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Clusters' }).click();
	await page.getByRole('button', { name: 'Analyze Clusters' }).click();

	const overview = page.getByTestId('cluster-overview');
	await expect(overview).toContainText(`3 clusters · ${reply.nodes.length} documents`);
	// The spinner shows while the summary is being written...
	await expect(overview.getByLabel('Writing summary')).toBeVisible();
	await expect(overview.getByRole('button', { name: /EU rules/ })).toBeVisible();
	// ...then the summary replaces it
	releaseSummary();
	await expect(page.getByTestId('cluster-summary')).toContainText('Three clusters');
	await expect(overview.getByLabel('Writing summary')).toHaveCount(0);

	// A line jumps to its cluster's card
	await overview.getByRole('button', { name: /Asia guidance/ }).click();
	await expect(page.locator('#cluster-card-cluster_2')).toBeInViewport();
});

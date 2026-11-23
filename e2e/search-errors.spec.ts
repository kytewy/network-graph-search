import { expect, test } from '@playwright/test';
import reply from './fixtures/search-reply.json';
import { RESULT_COUNT, graphNodeCount } from './helpers';

test('a failed search says why, and Try again recovers', async ({ page }) => {
	// The first search is refused (429 isn't retried automatically); later ones work
	let calls = 0;
	await page.route('**/api/reranked-vector-search', (route) =>
		++calls === 1
			? route.fulfill({ status: 429, json: { error: 'Too many requests. Please wait a moment.' } })
			: route.fulfill({ json: reply })
	);

	await page.goto('/graph');
	const box = page.getByPlaceholder(/Search across/);
	await box.fill('AI regulation');
	await box.press('Enter');

	const alert = page.getByRole('alert').filter({ hasText: 'Search failed' });
	await expect(alert).toContainText('Too many requests');

	await alert.getByRole('button', { name: 'Try again' }).click();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(RESULT_COUNT));
	await expect(alert).toBeHidden();
});

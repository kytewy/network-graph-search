import { expect, test } from '@playwright/test';
import { graphNodeCount, RESULT_COUNT, search } from './helpers';

// Suggestions are switched off for now (SUGGESTIONS in ChatInterface); turn this back on with them
test.skip('answers suggest actions: exact wording with counts, alternatives in ▾, nothing changes until clicked, Undo', async ({ page }) => {
	let sentOptions: any;
	await page.route('**/api/analyze-nodes', (r) => {
		sentOptions = r.request().postDataJSON().actionOptions;
		return r.fulfill({
			json: {
				summary: 'Europe leads on binding rules.',
				actions: [
					{ type: 'filter', filter: 'continents', values: ['Europe'], label: 'Focus on the EU' },
					{ type: 'color', mode: 'publisher', label: 'See who published' },
					{ type: 'filter', filter: 'continents', values: ['Antarctica'], label: 'Nothing here' },
				],
			},
		});
	});
	await search(page);
	await page.getByTestId('results-table').locator('[data-result-row]').first().getByRole('switch').click();
	await page.locator('[data-panel-header="right"]').getByRole('tab', { name: 'Chat' }).click();
	const box = page.getByRole('textbox', { name: 'Ask about the documents' });
	await box.fill('Where are the binding rules?');
	await box.press('Enter');

	// The browser told the server what's available
	expect(sentOptions.continents).toContain('Europe');
	expect(sentOptions.colorModes).toContain('publisher');

	// The app's own wording with a count (the AI's wording is in the hover); nothing has changed yet
	const actions = page.getByLabel('Suggested actions');
	const europe = actions.getByRole('button', { name: 'Continent: Europe · 3 docs', exact: true });
	await expect(europe).toBeVisible();
	await expect(europe).toHaveAttribute('title', 'Suggested: Focus on the EU');
	await expect(actions.getByRole('button', { name: 'Colour by Publisher', exact: true })).toBeVisible();
	// A filter that would leave nothing isn't offered
	await expect(actions).not.toContainText('Antarctica');
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(RESULT_COUNT));

	// ▾ offers close alternatives: pick the country instead of the continent
	await actions.getByRole('button', { name: 'Other choices for Continent: Europe' }).click();
	await page.getByRole('menuitem', { name: /Country: European Union · 2 docs/ }).click();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', '2');
	await expect(actions).toContainText('Country: European Union');
	await actions.getByRole('button', { name: 'Undo' }).click();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', String(RESULT_COUNT));

	// The suggestion itself, then undo
	await europe.click();
	await expect(graphNodeCount(page)).toHaveAttribute('data-node-count', '3');
	await actions.getByRole('button', { name: 'Undo' }).click();

	// Colour by publisher, then undo it
	await actions.getByRole('button', { name: 'Colour by Publisher', exact: true }).click();
	await expect(page).toHaveURL(/color=publisher/);
	await actions.getByRole('button', { name: 'Undo' }).click();
	await expect(page).not.toHaveURL(/color=publisher/);
});

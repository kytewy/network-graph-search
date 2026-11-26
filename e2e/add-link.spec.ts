import { expect, test } from '@playwright/test';

const URL = 'https://ised-isde.canada.ca/site/innovation-better-canada/en/artificial-intelligence-and-data-act-aida-companion-document';

test('add a link from the search panel: preview, label, add', async ({ page }) => {
	await page.route('**/api/sources/preview', (r) =>
		r.fulfill({ json: { url: URL, title: 'The Artificial Intelligence and Data Act (AIDA) – Companion document', siteName: 'Canada.ca', length: 31200, excerpt: 'This page has been archived on the Web.' } })
	);
	let added: unknown;
	await page.route('**/api/sources', (r) => {
		added = r.request().postDataJSON();
		return r.fulfill({ status: 201, json: { id: 'link-1', title: 'AIDA companion', created: true, length: 31200 } });
	});
	await page.goto('/graph');
	await page.getByRole('button', { name: '+ Add a link' }).first().click();

	const dialog = page.getByRole('dialog', { name: 'Add a link' });
	await dialog.getByPlaceholder('https://…').fill(URL);
	await dialog.getByRole('button', { name: 'Preview' }).click();
	await expect(dialog.getByTestId('link-preview')).toContainText('31,200 characters');

	await dialog.getByLabel('Publisher').selectOption('Government');
	await dialog.getByLabel('Type').selectOption('Guidance');
	await dialog.getByLabel('Country').selectOption('Canada');
	await dialog.getByRole('button', { name: 'Add', exact: true }).click();

	await expect(dialog.getByRole('status')).toContainText('Added');
	expect(added).toMatchObject({ url: URL, publisher: 'Government', documentType: 'Guidance', country: 'Canada', continent: 'North America' });
});

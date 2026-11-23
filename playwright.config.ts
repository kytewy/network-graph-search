import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests (P1-13): a robot opens the real app and clicks through it.
 * Search replies are faked (e2e/fixtures), so no Pinecone or OpenAI calls.
 *
 *   npm run e2e          start a dev server on port 3100 and run the tests
 *   npm run e2e:ui       the same, in Playwright's interactive window
 *   E2E_BASE_URL=http://localhost:3000 npm run e2e   use an app already running
 */
const PORT = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1600, height: 900 },
				// E2E_CHROME_CHANNEL=chrome uses an installed Chrome instead of Playwright's
				channel: process.env.E2E_CHROME_CHANNEL,
				// The graph is drawn with WebGL; this software renderer works without a GPU
				launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
			},
		},
	],
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				command: `npx next dev -p ${PORT}`,
				url: `${baseURL}/graph`,
				reuseExistingServer: !process.env.CI,
				timeout: 180_000,
			},
});

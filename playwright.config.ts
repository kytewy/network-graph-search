import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests (P1-13): a robot opens the real app and clicks through it.
 * Search replies are faked (e2e/fixtures), so no Pinecone or OpenAI calls.
 *
 *   npm run e2e          build the app, serve it on port 3100 and run the tests
 *   npm run e2e:ui       the same, in Playwright's interactive window
 *   E2E_BASE_URL=http://localhost:3000 npm run e2e   use an app already running
 *   E2E_DEV=1 npm run e2e   use a dev server instead (slower; recompiles pages)
 *
 * A built app is the default: a dev server compiles pages on first visit and
 * can reload them mid-test, which makes tests slow and flaky.
 */
const PORT = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const serveCommand = process.env.E2E_DEV
	? `npx next dev -p ${PORT}`
	: `npm run build && npx next start -p ${PORT}`;
// Without a graphics card (Linux CI, containers) WebGL needs a software renderer.
// On a desktop with a GPU it would only slow the graph down.
const softwareWebGL = process.platform === 'linux' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [];

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	// The graph's layout and WebGL take a moment; allow for slower machines
	timeout: 60_000,
	expect: { timeout: 15_000 },
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
				launchOptions: { args: softwareWebGL },
			},
		},
	],
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				command: serveCommand,
				url: `${baseURL}/graph`,
				reuseExistingServer: !process.env.CI,
				// Building the app takes a minute or two
				timeout: 300_000,
			},
});

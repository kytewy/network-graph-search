import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests (P1-12 moved them from Jest). Browser tests come with P1-13.
export default defineConfig({
	oxc: { jsx: { runtime: 'automatic' } },
	resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
		include: ['__tests__/**/*.test.{ts,tsx}'],
		exclude: ['**/node_modules/**', '.next/**', 'venv/**', '.venv/**', 'backend/**', 'scripts/**'],
	},
});

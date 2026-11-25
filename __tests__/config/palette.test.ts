import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CSS_TOKENS, PALETTE } from '@/lib/config/palette';
import { CLUSTER_RING_COLORS, HIGHLIGHT_COLOR } from '@/lib/config/graph-colors';

const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
const root = css.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? '';

function token(name: string): string | undefined {
	return root.match(new RegExp(`\\s${name}:\\s*([^;]+);`))?.[1].trim().toLowerCase();
}

describe('palette', () => {
	it.each(Object.entries(CSS_TOKENS))('%s in globals.css matches the palette', (name, key) => {
		expect(token(name)).toBe(PALETTE[key]);
	});

	it('every new token is exposed to Tailwind', () => {
		for (const name of ['primary-soft', 'lit', 'lit-soft', 'lit-foreground', 'ok', 'warn']) {
			expect(css).toContain(`--color-${name}: var(--${name});`);
		}
	});

	it('the graph highlights in the brand purple', () => {
		expect(HIGHLIGHT_COLOR).toBe(PALETTE.primary);
	});

	it('cluster rings deepen as more of the cluster is in context', () => {
		const light = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16);
		expect(light(CLUSTER_RING_COLORS.none)).toBeGreaterThan(light(CLUSTER_RING_COLORS.some));
		expect(light(CLUSTER_RING_COLORS.some)).toBeGreaterThan(light(CLUSTER_RING_COLORS.all));
	});
});

/**
 * @vitest-environment node
 */
import { readdirSync, readFileSync } from 'node:fs';
import { pending } from '../../scripts/migrate.mjs';

describe('migrations', () => {
	it('runs new numbered .sql files once, in order', () => {
		expect(pending(['0002_more.sql', 'README.md', '0001_init.sql', '0003_x.sql'], ['0001_init.sql'])).toEqual(['0002_more.sql', '0003_x.sql']);
		expect(pending(['0001_init.sql'], ['0001_init.sql'])).toEqual([]);
	});

	it('the first migration creates the tables the app needs', () => {
		const files = readdirSync('db/migrations');
		expect(files[0]).toBe('0001_init.sql');
		const sql = readFileSync('db/migrations/0001_init.sql', 'utf8');
		for (const table of ['workstreams', 'documents', 'workstream_documents', 'searches', 'chats', 'chat_documents', 'reports']) {
			expect(sql).toContain(`CREATE TABLE ${table} (`);
		}
	});
});

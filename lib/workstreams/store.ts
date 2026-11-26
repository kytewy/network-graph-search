/** Workstreams in Postgres: the list with its counts, one workstream, and creating one. Server only. */
import { db } from '@/lib/db/client';
import type { CreateWorkstream } from '@/lib/contracts/workstreams';
import type { StepId } from './steps';

export type Workstream = {
	id: string;
	name: string;
	goal: string | null;
	dueOn: Date | null;
	step: StepId;
	updatedAt: Date;
	documents: number;
	searches: number;
	chats: number;
};

const COLUMNS = (sql: ReturnType<typeof db>) => sql`
	w.id, w.name, w.goal, w.due_on AS "dueOn", w.step, w.updated_at AS "updatedAt",
	(SELECT count(*)::int FROM workstream_documents d WHERE d.workstream_id = w.id) AS documents,
	(SELECT count(*)::int FROM searches s WHERE s.workstream_id = w.id) AS searches,
	(SELECT count(*)::int FROM chats c WHERE c.workstream_id = w.id) AS chats`;

/** Every workstream, most recently changed first */
export async function listWorkstreams(): Promise<Workstream[]> {
	const sql = db();
	return sql<Workstream[]>`SELECT ${COLUMNS(sql)} FROM workstreams w ORDER BY w.updated_at DESC`;
}

/** One workstream, or null (also for an id that isn't a uuid) */
export async function getWorkstream(id: string): Promise<Workstream | null> {
	if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
	const sql = db();
	const [row] = await sql<Workstream[]>`SELECT ${COLUMNS(sql)} FROM workstreams w WHERE w.id = ${id}`;
	return row ?? null;
}

export async function createWorkstream(input: CreateWorkstream): Promise<{ id: string }> {
	const [row] = await db()<{ id: string }[]>`
		INSERT INTO workstreams (name, goal, due_on) VALUES (${input.name}, ${input.goal || null}, ${input.dueOn ?? null})
		RETURNING id`;
	return row;
}

-- The first tables. Postgres is the system of record; Pinecone keeps vectors
-- and filter fields only. Each migration runs once, in file-name order.

CREATE TABLE workstreams (
	id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name        text NOT NULL,
	goal        text,
	created_at  timestamptz NOT NULL DEFAULT now(),
	updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Every document the app knows, with its full text (not the cut copy search keeps)
CREATE TABLE documents (
	id             text PRIMARY KEY,
	title          text NOT NULL,
	url            text,
	-- How it arrived: the scraped index, a pasted link, an upload, or web search
	source         text NOT NULL DEFAULT 'index' CHECK (source IN ('index', 'link', 'upload', 'web')),
	publisher      text,
	document_type  text,
	country        text,
	continent      text,
	summary        text,
	body           text,
	body_length    integer GENERATED ALWAYS AS (coalesce(length(body), 0)) STORED,
	version        text,
	published_at   date,
	added_at       timestamptz NOT NULL DEFAULT now()
);

-- Which documents a workstream collected, and how
CREATE TABLE workstream_documents (
	workstream_id  uuid NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
	document_id    text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
	found_by       integer[] NOT NULL DEFAULT '{}',
	added_at       timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (workstream_id, document_id)
);

-- The searches run in a workstream (#1, #2…)
CREATE TABLE searches (
	id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workstream_id  uuid NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
	n              integer NOT NULL,
	query          text NOT NULL,
	top_k          integer NOT NULL,
	created_at     timestamptz NOT NULL DEFAULT now(),
	UNIQUE (workstream_id, n)
);

-- Chats, each with its own documents
CREATE TABLE chats (
	id             text PRIMARY KEY,
	workstream_id  uuid NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
	name           text NOT NULL,
	created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chat_documents (
	chat_id      text NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
	document_id  text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
	PRIMARY KEY (chat_id, document_id)
);

-- Saved answers, kept with exactly what was sent (the receipt)
CREATE TABLE reports (
	id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workstream_id  uuid NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
	chat_id        text REFERENCES chats(id) ON DELETE SET NULL,
	title          text NOT NULL,
	body           text NOT NULL,
	receipt        jsonb,
	created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX searches_workstream ON searches (workstream_id);
CREATE INDEX chats_workstream ON chats (workstream_id);
CREATE INDEX reports_workstream ON reports (workstream_id);

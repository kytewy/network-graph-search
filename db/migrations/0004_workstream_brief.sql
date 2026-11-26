-- A workstream's brief and where it is: when it's due, and which of the six steps it's on.
-- (0003 is taken by passages on its own branch; migrations run in name order, each once.)
ALTER TABLE workstreams ADD COLUMN due_on date;
ALTER TABLE workstreams ADD COLUMN step text NOT NULL DEFAULT 'brief'
	CHECK (step IN ('brief', 'collect', 'read', 'analyze', 'report', 'monitor'));

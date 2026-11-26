-- Each document's text in passages (~1,500 characters, on paragraph boundaries), so search and the
-- AI can work with the part that matters instead of a document's opening. Rebuilt from body.
CREATE TABLE passages (
	document_id  text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
	position     integer NOT NULL,
	heading      text,
	start_char   integer NOT NULL,
	body         text NOT NULL,
	PRIMARY KEY (document_id, position)
);

-- Who set a document's publication date: the scraped index, the page itself, an AI first pass, or you
ALTER TABLE documents ADD COLUMN published_by text CHECK (published_by IN ('index', 'page', 'ai', 'you'));
UPDATE documents SET published_by = 'index' WHERE published_at IS NOT NULL AND source = 'index';

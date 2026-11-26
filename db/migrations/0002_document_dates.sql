-- When a law or rule takes effect, alongside when it was published (published_at)
-- and when Lantern got it (added_at). Laws often apply in stages after publication.
ALTER TABLE documents ADD COLUMN effective_at date;

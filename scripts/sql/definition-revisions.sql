-- Applied once by the authorized database migration role. Runtime readers cannot create these tables.
CREATE TABLE IF NOT EXISTS agnostic_definition_revisions (
  revision_id TEXT PRIMARY KEY,
  catalog_sha256 TEXT NOT NULL UNIQUE,
  source_commit TEXT NOT NULL,
  catalog JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agnostic_definition_release (
  release_key TEXT PRIMARY KEY CHECK (release_key = 'active'),
  active_revision_id TEXT NOT NULL REFERENCES agnostic_definition_revisions(revision_id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

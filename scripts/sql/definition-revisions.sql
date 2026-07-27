CREATE TABLE IF NOT EXISTS agnostic_definition_revisions (
  id TEXT PRIMARY KEY,
  bundle JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agnostic_definition_state (
  state_key TEXT PRIMARY KEY CHECK (state_key = 'active'),
  revision_id TEXT NOT NULL REFERENCES agnostic_definition_revisions(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configure provider-specific access policies separately. The application
-- credential needs SELECT/INSERT on revisions and SELECT/INSERT/UPDATE on the
-- single state_key='active' row. Do not grant public write access.

CREATE TABLE IF NOT EXISTS ticket_comments (
  id          BIGSERIAL PRIMARY KEY,
  ticket_id   UUID NOT NULL,
  author_id   BIGINT,
  author_name TEXT,
  text        TEXT NOT NULL,
  status_label TEXT,
  is_system   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_comments_ticket_id ON ticket_comments(ticket_id);

ALTER TABLE ticket_comments DISABLE ROW LEVEL SECURITY;

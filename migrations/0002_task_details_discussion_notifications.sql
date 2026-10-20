ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS tasks_class_id_idx ON tasks (class_id);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks (due_date);
CREATE INDEX IF NOT EXISTS tasks_subject_id_idx ON tasks (subject_id);

CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS task_comments_task_idx ON task_comments (task_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  kind VARCHAR(32) NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON notifications (user_id, read_at, created_at DESC);

ALTER TABLE classes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

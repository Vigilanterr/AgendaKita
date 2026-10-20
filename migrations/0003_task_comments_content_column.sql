ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS content TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'task_comments'
      AND column_name = 'body'
  ) THEN
    EXECUTE 'UPDATE task_comments SET content = body WHERE content IS NULL';
    EXECUTE 'ALTER TABLE task_comments DROP COLUMN body';
  END IF;
END $$;

UPDATE task_comments SET content = '' WHERE content IS NULL;

ALTER TABLE task_comments ALTER COLUMN content SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON task_comments (task_id, created_at);

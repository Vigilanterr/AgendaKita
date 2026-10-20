CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(24) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_unique ON subjects (LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS subjects_code_unique ON subjects (LOWER(code));

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id SERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS teacher_assignments_unique
  ON teacher_assignments (teacher_id, class_id, subject_id);

CREATE INDEX IF NOT EXISTS teacher_assignments_teacher_idx
  ON teacher_assignments (teacher_id);

CREATE INDEX IF NOT EXISTS teacher_assignments_class_idx
  ON teacher_assignments (class_id);

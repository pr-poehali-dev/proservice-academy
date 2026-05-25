CREATE TABLE IF NOT EXISTS t_p57209028_proservice_academy.psa_slides (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES t_p57209028_proservice_academy.psa_lessons(id),
  title TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_psa_slides_lesson_id ON t_p57209028_proservice_academy.psa_slides(lesson_id);

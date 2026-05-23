CREATE TABLE psa_lesson_progress (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES psa_users(id), lesson_id INTEGER REFERENCES psa_lessons(id), completed BOOLEAN DEFAULT false, completed_at TIMESTAMPTZ, UNIQUE(user_id, lesson_id));

CREATE TABLE psa_homeworks (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES psa_users(id), lesson_title TEXT NOT NULL, text TEXT NOT NULL, status TEXT DEFAULT 'pending', grade INTEGER, trainer_comment TEXT DEFAULT '', submitted_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE psa_student_meta (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES psa_users(id) UNIQUE, candidate_status TEXT, candidate_comment TEXT DEFAULT '', trainer_notes TEXT DEFAULT '', updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE psa_student_notes (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES psa_users(id) UNIQUE, notes TEXT DEFAULT '', updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE psa_hw_drafts (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES psa_users(id) UNIQUE, lesson_title TEXT DEFAULT '', text TEXT DEFAULT '', updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE psa_forum_topics (id SERIAL PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER REFERENCES psa_users(id), pinned BOOLEAN DEFAULT false, closed BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE psa_forum_posts (id SERIAL PRIMARY KEY, topic_id INTEGER REFERENCES psa_forum_topics(id), author_id INTEGER REFERENCES psa_users(id), text TEXT NOT NULL, likes INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE psa_forum_likes (user_id INTEGER REFERENCES psa_users(id), post_id INTEGER REFERENCES psa_forum_posts(id), PRIMARY KEY (user_id, post_id));

CREATE TABLE psa_student_docs (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES psa_users(id), name TEXT NOT NULL, label TEXT NOT NULL, size TEXT NOT NULL, file_type TEXT NOT NULL, data_url TEXT NOT NULL, uploaded_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE psa_notifications (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES psa_users(id), lesson_title TEXT NOT NULL, status TEXT NOT NULL, grade INTEGER, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());
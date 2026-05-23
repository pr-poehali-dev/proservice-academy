CREATE TABLE psa_direct_messages (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER REFERENCES psa_users(id),
  to_user_id INTEGER REFERENCES psa_users(id),
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
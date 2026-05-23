CREATE TABLE psa_trainer_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES psa_users(id) UNIQUE,
  display_name TEXT DEFAULT '',
  about TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  vk_url TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
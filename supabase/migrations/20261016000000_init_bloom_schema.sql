-- GDGoC HUST 20/10 - Bloom With Us
-- Supabase Migration: 20261016000000_init_bloom_schema.sql

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  secret_code TEXT NOT NULL,
  group_access_code TEXT NOT NULL,
  wish_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boys (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  token TEXT,
  secret_code TEXT,
  description TEXT,
  personal_wish TEXT,
  ornament_type TEXT DEFAULT 'lotus',
  gift_hint TEXT,
  has_written_wish BOOLEAN DEFAULT false,
  assigned_girl_id TEXT,
  assigned_girl_name TEXT
);

CREATE TABLE IF NOT EXISTS girls (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  token TEXT UNIQUE NOT NULL,
  current_question_index INTEGER DEFAULT 0,
  wrong_attempts INTEGER DEFAULT 0,
  stage TEXT DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  unlocked_codes JSONB DEFAULT '[]'::jsonb,
  assigned_boy_id TEXT,
  assigned_boy_name TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  boy_id TEXT,
  question_type TEXT DEFAULT 'multiple_choice',
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_key TEXT NOT NULL,
  clue TEXT
);

CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  recipient_name TEXT,
  sender_name TEXT,
  message TEXT,
  gift_content TEXT,
  ornament_type TEXT DEFAULT 'lotus',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default organization group
INSERT INTO groups (id, group_name, secret_code, group_access_code, wish_message)
VALUES (
  'grp_hust',
  'GDGoC HUST',
  '2010',
  'GDGOC2010',
  'Chúc toàn thể các bạn nữ GDGoC HUST ngày 20/10 luôn xinh đẹp, rạng rỡ và ngập tràn hạnh phúc!'
)
ON CONFLICT (id) DO NOTHING;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE groups TO anon, authenticated;
GRANT ALL ON TABLE boys TO anon, authenticated;
GRANT ALL ON TABLE girls TO anon, authenticated;
GRANT ALL ON TABLE questions TO anon, authenticated;
GRANT ALL ON TABLE gifts TO anon, authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE boys ENABLE ROW LEVEL SECURITY;
ALTER TABLE girls ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Cleanly recreate policies for collaborative public event
DROP POLICY IF EXISTS "Public Read/Write groups" ON groups;
CREATE POLICY "Public Read/Write groups" ON groups FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write boys" ON boys;
CREATE POLICY "Public Read/Write boys" ON boys FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write girls" ON girls;
CREATE POLICY "Public Read/Write girls" ON girls FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write questions" ON questions;
CREATE POLICY "Public Read/Write questions" ON questions FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert gifts" ON gifts;
CREATE POLICY "Public Insert gifts" ON gifts FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update gifts" ON gifts;
CREATE POLICY "Public Update gifts" ON gifts FOR UPDATE TO public USING (true) WITH CHECK (true);

-- RPC get_gift function
CREATE OR REPLACE FUNCTION get_gift(p_code TEXT)
RETURNS SETOF gifts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM gifts WHERE UPPER(TRIM(code)) = UPPER(TRIM(p_code));
$$;

GRANT EXECUTE ON FUNCTION get_gift(TEXT) TO anon, authenticated;

-- Enable Supabase Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE groups;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE boys;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE girls;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE questions;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

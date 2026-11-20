-- =========================================================================
-- EduTrack AI - Supabase Database Schema Migration
-- Run this in your Supabase Project -> SQL Editor to initialize all tables
-- =========================================================================

-- 1. Enable standard UUID and PG extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Elena Rostova',
  role TEXT NOT NULL DEFAULT 'student',
  department TEXT NOT NULL DEFAULT 'Computer Science',
  standing TEXT NOT NULL DEFAULT 'Year 3 (Junior)',
  avatar_url TEXT,
  dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_uid ON public.users(uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 3. Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  course TEXT NOT NULL,
  instructor TEXT NOT NULL DEFAULT 'Prof. Marcus Vance',
  due_date TEXT NOT NULL,
  due_label TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'not_started',
  progress INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 15,
  max_points INTEGER NOT NULL DEFAULT 100,
  grade_score INTEGER,
  grade_letter TEXT,
  milestone_text TEXT NOT NULL DEFAULT '',
  guidelines TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  submitted_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_rubric_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);

-- 4. Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  date TEXT NOT NULL,
  time_range TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'lecture',
  badge_text TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);

-- 5. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  size_bytes INTEGER NOT NULL DEFAULT 1024000,
  size_label TEXT NOT NULL DEFAULT '1.0 MB',
  ai_synced BOOLEAN NOT NULL DEFAULT TRUE,
  last_read_label TEXT NOT NULL DEFAULT 'Just now',
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- 6. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  tag_label TEXT NOT NULL DEFAULT 'Course Update',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date_label TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  is_rsvped BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  meta_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_user_id ON public.announcements(user_id);

-- 7. Study Blocks Table
CREATE TABLE IF NOT EXISTS public.study_blocks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium Priority',
  time_range TEXT NOT NULL,
  duration_label TEXT NOT NULL,
  target_text TEXT NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'Deep Flow Block',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_blocks_user_id ON public.study_blocks(user_id);

-- 8. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  course_scope TEXT NOT NULL DEFAULT 'Operating Systems',
  code_snippet TEXT,
  code_filename TEXT,
  timestamp_label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

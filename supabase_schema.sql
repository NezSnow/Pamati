-- ============================================================
-- PAMATI — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (mirrors auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- MEMORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEMORY IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memory_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GALLERY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUCKET LIST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bucket_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write everything
CREATE POLICY "Auth users: all on users" ON public.users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users: all on memories" ON public.memories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users: all on memory_images" ON public.memory_images
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users: all on gallery" ON public.gallery
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users: all on bucket_list" ON public.bucket_list
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE
-- ============================================================

-- Create a single 'pamati' bucket for all media
-- Run this in Storage settings or uncomment if using SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pamati', 'pamati', true);

-- Allow authenticated users to upload/read
-- CREATE POLICY "Authenticated upload" ON storage.objects
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'pamati');
-- CREATE POLICY "Public read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'pamati');

-- ============================================================
-- SAMPLE DATA (optional — uncomment to insert)
-- ============================================================

-- INSERT INTO public.memories (title, description, date) VALUES
--   ('First Ganap', 'The one that started it all. What a night!', '2024-01-15'),
--   ('Road Trip to Tagaytay', 'Cold air, bulalo, and a lot of laughs.', '2024-03-20'),
--   ('Beach Weekend', 'Sun, sand, and zero responsibilities.', '2024-06-01');

-- INSERT INTO public.bucket_list (title, description, status) VALUES
--   ('Climb Mt. Pulag', 'Sea of clouds awaits!', 'planned'),
--   ('Siargao surf trip', 'Learn to surf finally.', 'planned'),
--   ('Intramuros heritage walk', 'Done and dusted!', 'completed');

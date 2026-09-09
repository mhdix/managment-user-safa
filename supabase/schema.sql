-- =============================================
-- سامانه حضور و غیاب - Supabase Schema
-- =============================================

-- 1. People (افراد)
CREATE TABLE IF NOT EXISTS public.people (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name  TEXT    NOT NULL,
  last_name   TEXT    NOT NULL,
  phone       TEXT    NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Programs (برنامه‌ها)
CREATE TABLE IF NOT EXISTS public.programs (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT    NOT NULL,
  description TEXT    DEFAULT '',
  date        DATE    NOT NULL,
  start_time  TIME    NOT NULL,
  end_time    TIME,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Program Participants (شرکت‌کنندگان برنامه)
CREATE TABLE IF NOT EXISTS public.program_participants (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id  UUID    REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  person_id   UUID    REFERENCES public.people(id)   ON DELETE CASCADE NOT NULL,
  UNIQUE(program_id, person_id)
);

-- 4. Attendances (حضور و غیاب)
CREATE TABLE IF NOT EXISTS public.attendances (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id    UUID    REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  person_id     UUID    REFERENCES public.people(id)   ON DELETE CASCADE NOT NULL,
  status        TEXT    NOT NULL CHECK (status IN ('حاضر', 'غایب', 'تاخیر')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  reason        TEXT    DEFAULT '',
  date          DATE    NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE public.people               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances          ENABLE ROW LEVEL SECURITY;

-- فقط کاربر احراز‌هویت‌شده (ادمین) دسترسی دارد
CREATE POLICY "admin_access_people"               ON public.people               FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_access_programs"             ON public.programs             FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_access_program_participants" ON public.program_participants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_access_attendances"          ON public.attendances          FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_attendances_updated_at
  BEFORE UPDATE ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- نحوه استفاده:
-- 1. وارد Supabase Dashboard شوید
-- 2. SQL Editor را باز کنید
-- 3. این کد را اجرا کنید
-- 4. Authentication → Users → Add User
--    ادمین: admin@yourapp.com / password
-- =============================================

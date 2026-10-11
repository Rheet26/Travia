-- Supabase Migration: Travia RLS Security and Booking Ownership Enforcement
-- Migration Date: 2026-10-11
-- Description:
-- 1. Adds journey columns to public.bookings if missing.
-- 2. Enforces Row Level Security (RLS) on public.bookings and public.passengers.
-- 3. Ensures passengers can ONLY view, insert, update, or delete bookings where auth.uid() = user_id.
-- 4. Allows ADMIN role to view and manage all bookings.
-- 5. Hardens public.profiles RLS policies so users can only insert or update their own profile.

-- 1. Ensure journey columns on public.bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS from_station TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS to_station TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS boarding_time TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS arrival_time TEXT;

-- 2. Ensure RLS is enabled on public.bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for public.bookings
DROP POLICY IF EXISTS "Users can view own bookings or Admins view all" ON public.bookings;
CREATE POLICY "Users can view own bookings or Admins view all" ON public.bookings
  FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
CREATE POLICY "Users can insert own bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can update own bookings or Admins update all" ON public.bookings;
CREATE POLICY "Users can update own bookings or Admins update all" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "Users can delete own bookings or Admins delete all" ON public.bookings;
CREATE POLICY "Users can delete own bookings or Admins delete all" ON public.bookings
  FOR DELETE USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 4. Ensure RLS is enabled on public.passengers
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Passengers viewable if booking viewable" ON public.passengers;
CREATE POLICY "Passengers viewable if booking viewable" ON public.passengers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'))
    )
  );

DROP POLICY IF EXISTS "Passengers insertable by user or admin" ON public.passengers;
CREATE POLICY "Passengers insertable by user or admin" ON public.passengers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'))
    )
  );

DROP POLICY IF EXISTS "Passengers updatable by user or admin" ON public.passengers;
CREATE POLICY "Passengers updatable by user or admin" ON public.passengers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'))
    )
  );

DROP POLICY IF EXISTS "Passengers deletable by user or admin" ON public.passengers;
CREATE POLICY "Passengers deletable by user or admin" ON public.passengers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'))
    )
  );

-- 5. Secure public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';

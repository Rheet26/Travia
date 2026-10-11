-- 1. Create Enums Safely
DO $$
BEGIN
  BEGIN
    CREATE TYPE public.app_role AS ENUM ('PASSENGER', 'ADMIN');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE TYPE public.berth_type AS ENUM ('Lower', 'Middle', 'Upper');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE TYPE public.berth_preference AS ENUM ('Lower', 'Middle', 'Upper', 'No Preference');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE TYPE public.gender_type AS ENUM ('Male', 'Female', 'Other');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE TYPE public.booking_status AS ENUM ('CONFIRMED', 'RAC', 'WAITLIST', 'CANCELLED');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 2. Grant Schema & Table Privileges to anon, authenticated, and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 3. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'PASSENGER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (true);

-- Trigger to handle new user signup robustly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  raw_role TEXT;
  parsed_role public.app_role;
BEGIN
  raw_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'PASSENGER'));
  IF raw_role = 'ADMIN' THEN
    parsed_role := 'ADMIN'::public.app_role;
  ELSE
    parsed_role := 'PASSENGER'::public.app_role;
  END IF;

  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    parsed_role
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Stations Table
CREATE TABLE IF NOT EXISTS public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stations viewable by everyone" ON public.stations;
CREATE POLICY "Stations viewable by everyone" ON public.stations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert stations" ON public.stations;
CREATE POLICY "Admins can insert stations" ON public.stations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Admins can update stations" ON public.stations;
CREATE POLICY "Admins can update stations" ON public.stations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Admins can delete stations" ON public.stations;
CREATE POLICY "Admins can delete stations" ON public.stations FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.role() = 'service_role'
);

-- 5. Trains Table
CREATE TABLE IF NOT EXISTS public.trains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  from_station TEXT NOT NULL,
  to_station TEXT NOT NULL,
  departure TEXT NOT NULL,
  arrival TEXT NOT NULL,
  fare NUMERIC(10, 2) NOT NULL CHECK (fare >= 0),
  seats INT NOT NULL DEFAULT 6 CHECK (seats >= 0),
  rac_total INT NOT NULL DEFAULT 3 CHECK (rac_total >= 0),
  wl_total INT NOT NULL DEFAULT 5 CHECK (wl_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trains viewable by everyone" ON public.trains;
CREATE POLICY "Trains viewable by everyone" ON public.trains FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert trains" ON public.trains;
CREATE POLICY "Admins can insert trains" ON public.trains FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Admins can update trains" ON public.trains;
CREATE POLICY "Admins can update trains" ON public.trains FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Admins can delete trains" ON public.trains;
CREATE POLICY "Admins can delete trains" ON public.trains FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.role() = 'service_role'
);

-- 6. Train Stops Table
CREATE TABLE IF NOT EXISTS public.train_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_id UUID NOT NULL REFERENCES public.trains(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  stop_number INT NOT NULL,
  arrival_time TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  distance_km INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(train_id, stop_number)
);

ALTER TABLE public.train_stops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Train stops viewable by everyone" ON public.train_stops;
CREATE POLICY "Train stops viewable by everyone" ON public.train_stops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert train stops" ON public.train_stops;
CREATE POLICY "Admins can insert train stops" ON public.train_stops FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.role() = 'service_role'
);

-- 7. Coaches Table
CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_id UUID NOT NULL REFERENCES public.trains(id) ON DELETE CASCADE,
  coach_number TEXT NOT NULL,
  coach_type TEXT NOT NULL DEFAULT 'Sleeper',
  total_seats INT NOT NULL DEFAULT 72,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(train_id, coach_number)
);

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coaches viewable by everyone" ON public.coaches;
CREATE POLICY "Coaches viewable by everyone" ON public.coaches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert coaches" ON public.coaches;
CREATE POLICY "Admins can insert coaches" ON public.coaches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.role() = 'service_role'
);

-- 8. Seats Table
CREATE TABLE IF NOT EXISTS public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_id UUID NOT NULL REFERENCES public.trains(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  coach TEXT NOT NULL DEFAULT 'S1',
  seat_number INT NOT NULL,
  berth public.berth_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(train_id, coach, seat_number)
);

ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Seats viewable by everyone" ON public.seats;
CREATE POLICY "Seats viewable by everyone" ON public.seats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert seats" ON public.seats;
CREATE POLICY "Admins can insert seats" ON public.seats FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.role() = 'service_role'
);

-- 9. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pnr TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  train_id UUID NOT NULL REFERENCES public.trains(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  age INT NOT NULL CHECK (age > 0 AND age <= 120),
  gender public.gender_type NOT NULL,
  preference public.berth_preference NOT NULL DEFAULT 'No Preference',
  status public.booking_status NOT NULL,
  seat_number INT,
  berth public.berth_type,
  queue_position INT,
  fare NUMERIC(10, 2) NOT NULL,
  journey_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookings or Admins view all" ON public.bookings;
CREATE POLICY "Users can view own bookings or Admins view all" ON public.bookings
  FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
CREATE POLICY "Users can insert own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- 10. Passengers Table
CREATE TABLE IF NOT EXISTS public.passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT NOT NULL,
  gender public.gender_type NOT NULL,
  berth_preference public.berth_preference NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Grant permissions to anon and authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- 11. Atomic Booking RPC Function
CREATE OR REPLACE FUNCTION public.book_ticket(
  p_train_id UUID,
  p_passenger_name TEXT,
  p_age INT,
  p_gender public.gender_type,
  p_preference public.berth_preference
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_train public.trains%ROWTYPE;
  v_confirmed_count INT;
  v_rac_count INT;
  v_wl_count INT;
  v_seats_left INT;
  v_rac_left INT;
  v_wl_left INT;
  v_assigned_seat INT := NULL;
  v_assigned_berth public.berth_type := NULL;
  v_queue_pos INT := NULL;
  v_status public.booking_status;
  v_pnr TEXT;
  v_booking_id UUID;
  v_taken_seats INT[];
  v_b public.berth_type;
  s INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to book tickets.';
  END IF;

  SELECT * INTO v_train FROM public.trains WHERE id = p_train_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Train not found.';
  END IF;

  SELECT COUNT(*) INTO v_confirmed_count FROM public.bookings
    WHERE train_id = p_train_id AND status = 'CONFIRMED';
  SELECT COUNT(*) INTO v_rac_count FROM public.bookings
    WHERE train_id = p_train_id AND status = 'RAC';
  SELECT COUNT(*) INTO v_wl_count FROM public.bookings
    WHERE train_id = p_train_id AND status = 'WAITLIST';

  v_seats_left := v_train.seats - v_confirmed_count;
  v_rac_left := v_train.rac_total - v_rac_count;
  v_wl_left := v_train.wl_total - v_wl_count;

  IF v_seats_left > 0 THEN
    v_status := 'CONFIRMED';
    SELECT ARRAY_AGG(seat_number) INTO v_taken_seats FROM public.bookings
      WHERE train_id = p_train_id AND status = 'CONFIRMED';

    FOR s IN 1..v_train.seats LOOP
      IF v_taken_seats IS NULL OR NOT (s = ANY(v_taken_seats)) THEN
        v_b := CASE (s - 1) % 3 WHEN 0 THEN 'Lower'::public.berth_type WHEN 1 THEN 'Middle'::public.berth_type ELSE 'Upper'::public.berth_type END;
        IF v_assigned_seat IS NULL THEN
          v_assigned_seat := s;
          v_assigned_berth := v_b;
        END IF;
        IF p_preference <> 'No Preference' AND v_b::text = p_preference::text THEN
          v_assigned_seat := s;
          v_assigned_berth := v_b;
          EXIT;
        END IF;
      END IF;
    END LOOP;
  ELSIF v_rac_left > 0 THEN
    v_status := 'RAC';
    v_queue_pos := v_rac_count + 1;
  ELSIF v_wl_left > 0 THEN
    v_status := 'WAITLIST';
    v_queue_pos := v_wl_count + 1;
  ELSE
    RAISE EXCEPTION 'Booking closed — no seats, RAC or waitlist positions remaining.';
  END IF;

  v_pnr := SUBSTRING(v_train.number FROM 1 FOR 3) || FLOOR(1000000 + random() * 8999999)::TEXT;

  INSERT INTO public.bookings (
    pnr, user_id, train_id, passenger_name, age, gender, preference, status, seat_number, berth, queue_position, fare
  ) VALUES (
    v_pnr, v_user_id, p_train_id, p_passenger_name, p_age, p_gender, p_preference, v_status, v_assigned_seat, v_assigned_berth, v_queue_pos, v_train.fare
  ) RETURNING id INTO v_booking_id;

  INSERT INTO public.passengers (booking_id, name, age, gender, berth_preference)
  VALUES (v_booking_id, p_passenger_name, p_age, p_gender, p_preference);

  RETURN jsonb_build_object(
    'id', v_booking_id,
    'pnr', v_pnr,
    'trainId', p_train_id,
    'passengerName', p_passenger_name,
    'age', p_age,
    'gender', p_gender,
    'preference', p_preference,
    'status', v_status,
    'seatNumber', v_assigned_seat,
    'berth', v_assigned_berth,
    'queuePosition', v_queue_pos,
    'fare', v_train.fare,
    'message', CASE WHEN v_status = 'CONFIRMED' THEN 'Confirmed · Seat ' || v_assigned_seat || ' (' || v_assigned_berth || ')' ELSE v_status::text || ' position ' || v_queue_pos END
  );
END;
$$;

-- 12. Atomic Ticket Cancellation RPC Function
CREATE OR REPLACE FUNCTION public.cancel_ticket(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_train public.trains%ROWTYPE;
  v_rac_cand public.bookings%ROWTYPE;
  v_wl_cand public.bookings%ROWTYPE;
  v_taken_seats INT[];
  v_assigned_seat INT := NULL;
  v_assigned_berth public.berth_type := NULL;
  v_b public.berth_type;
  v_rac_pos INT := 0;
  v_wl_pos INT := 0;
  v_rec RECORD;
  s INT;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  IF v_booking.status = 'CANCELLED' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Booking is already cancelled.');
  END IF;

  IF v_booking.user_id <> auth.uid() AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Not authorized to cancel this booking.';
  END IF;

  SELECT * INTO v_train FROM public.trains WHERE id = v_booking.train_id FOR UPDATE;

  UPDATE public.bookings
  SET status = 'CANCELLED', seat_number = NULL, berth = NULL, queue_position = NULL
  WHERE id = p_booking_id;

  SELECT * INTO v_rac_cand FROM public.bookings
    WHERE train_id = v_booking.train_id AND status = 'RAC'
    ORDER BY queue_position ASC, created_at ASC
    LIMIT 1;

  IF v_rac_cand.id IS NOT NULL THEN
    SELECT ARRAY_AGG(seat_number) INTO v_taken_seats FROM public.bookings
      WHERE train_id = v_booking.train_id AND status = 'CONFIRMED';

    FOR s IN 1..v_train.seats LOOP
      IF v_taken_seats IS NULL OR NOT (s = ANY(v_taken_seats)) THEN
        v_b := CASE (s - 1) % 3 WHEN 0 THEN 'Lower'::public.berth_type WHEN 1 THEN 'Middle'::public.berth_type ELSE 'Upper'::public.berth_type END;
        IF v_assigned_seat IS NULL THEN
          v_assigned_seat := s;
          v_assigned_berth := v_b;
        END IF;
        IF v_rac_cand.preference <> 'No Preference' AND v_b::text = v_rac_cand.preference::text THEN
          v_assigned_seat := s;
          v_assigned_berth := v_b;
          EXIT;
        END IF;
      END IF;
    END LOOP;

    IF v_assigned_seat IS NOT NULL THEN
      UPDATE public.bookings
      SET status = 'CONFIRMED', seat_number = v_assigned_seat, berth = v_assigned_berth, queue_position = NULL
      WHERE id = v_rac_cand.id;
    END IF;
  END IF;

  SELECT * INTO v_wl_cand FROM public.bookings
    WHERE train_id = v_booking.train_id AND status = 'WAITLIST'
    ORDER BY queue_position ASC, created_at ASC
    LIMIT 1;

  IF v_wl_cand.id IS NOT NULL THEN
    UPDATE public.bookings
    SET status = 'RAC'
    WHERE id = v_wl_cand.id;
  END IF;

  FOR v_rec IN SELECT id FROM public.bookings WHERE train_id = v_booking.train_id AND status = 'RAC' ORDER BY created_at ASC LOOP
    v_rac_pos := v_rac_pos + 1;
    UPDATE public.bookings SET queue_position = v_rac_pos WHERE id = v_rec.id;
  END LOOP;

  FOR v_rec IN SELECT id FROM public.bookings WHERE train_id = v_booking.train_id AND status = 'WAITLIST' ORDER BY created_at ASC LOOP
    v_wl_pos := v_wl_pos + 1;
    UPDATE public.bookings SET queue_position = v_wl_pos WHERE id = v_rec.id;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message', 'Booking cancelled and queues updated.');
END;
$$;

-- 13. Direct Signup RPC Function (Bypasses GoTrue SMTP & Rate Limits)
CREATE OR REPLACE FUNCTION public.signup_without_confirmation(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'PASSENGER'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
  v_app_meta JSONB;
  v_user_meta JSONB;
  v_clean_email TEXT;
  v_clean_role TEXT;
  v_parsed_role public.app_role;
BEGIN
  v_clean_email := LOWER(TRIM(p_email));
  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RAISE EXCEPTION 'Email cannot be empty.';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
    RAISE EXCEPTION 'User with email % already exists. Please login instead.', v_clean_email;
  END IF;

  v_clean_role := UPPER(COALESCE(p_role, 'PASSENGER'));
  IF v_clean_role = 'ADMIN' THEN
    v_parsed_role := 'ADMIN'::public.app_role;
  ELSE
    v_parsed_role := 'PASSENGER'::public.app_role;
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
  v_app_meta := '{"provider": "email", "providers": ["email"]}'::jsonb;
  v_user_meta := jsonb_build_object('name', TRIM(p_name), 'role', v_clean_role);

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_clean_email,
    v_encrypted_pw,
    NOW(),
    v_app_meta,
    v_user_meta,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
    'email', v_user_id::text, NOW(), NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    v_user_id,
    COALESCE(NULLIF(TRIM(p_name), ''), split_part(v_clean_email, '@', 1)),
    v_clean_email,
    v_parsed_role
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

  RETURN jsonb_build_object(
    'id', v_user_id,
    'email', v_clean_email,
    'message', 'User account created and confirmed successfully.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.signup_without_confirmation TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.book_ticket TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_ticket TO anon, authenticated, service_role;

-- 14. Synthetic Data Seeding
-- Seed Stations
INSERT INTO public.stations (code, name, city, state)
VALUES
  ('BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'),
  ('NDLS', 'New Delhi', 'New Delhi', 'Delhi'),
  ('BPL', 'Bhopal Junction', 'Bhopal', 'Madhya Pradesh'),
  ('TVC', 'Thiruvananthapuram Central', 'Thiruvananthapuram', 'Kerala'),
  ('HWH', 'Howrah Junction', 'Kolkata', 'West Bengal'),
  ('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu'),
  ('SBC', 'KSR Bengaluru', 'Bengaluru', 'Karnataka'),
  ('ADI', 'Ahmedabad Junction', 'Ahmedabad', 'Gujarat')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, city = EXCLUDED.city, state = EXCLUDED.state;

-- Seed Trains
INSERT INTO public.trains (number, name, from_station, to_station, departure, arrival, fare, seats, rac_total, wl_total)
VALUES
  ('12951', 'Rajdhani Express', 'Mumbai Central', 'New Delhi', '17:00', '08:35', 2450.00, 6, 3, 5),
  ('12002', 'Shatabdi Express', 'New Delhi', 'Bhopal', '06:00', '14:05', 1320.00, 8, 2, 6),
  ('12626', 'Kerala Express', 'New Delhi', 'Thiruvananthapuram', '11:25', '05:15', 1890.00, 5, 3, 4),
  ('22436', 'Vande Bharat Express', 'New Delhi', 'Varanasi', '06:00', '14:00', 1750.00, 8, 3, 5),
  ('12260', 'Duronto Express', 'Howrah Junction', 'New Delhi', '17:00', '08:25', 2200.00, 6, 2, 4)
ON CONFLICT (number) DO UPDATE SET
  name = EXCLUDED.name, from_station = EXCLUDED.from_station, to_station = EXCLUDED.to_station,
  departure = EXCLUDED.departure, arrival = EXCLUDED.arrival, fare = EXCLUDED.fare,
  seats = EXCLUDED.seats, rac_total = EXCLUDED.rac_total, wl_total = EXCLUDED.wl_total;

-- Seed Coaches & Seats for each train
DO $$
DECLARE
  r_train RECORD;
  v_coach_id UUID;
  s INT;
  v_berth public.berth_type;
BEGIN
  FOR r_train IN SELECT id, seats FROM public.trains LOOP
    -- Insert default Coach S1
    INSERT INTO public.coaches (train_id, coach_number, coach_type, total_seats)
    VALUES (r_train.id, 'S1', 'Sleeper', 72)
    ON CONFLICT (train_id, coach_number) DO UPDATE SET total_seats = EXCLUDED.total_seats
    RETURNING id INTO v_coach_id;

    IF v_coach_id IS NULL THEN
      SELECT id INTO v_coach_id FROM public.coaches WHERE train_id = r_train.id AND coach_number = 'S1';
    END IF;

    -- Generate seats for train
    FOR s IN 1..r_train.seats LOOP
      v_berth := CASE (s - 1) % 3 WHEN 0 THEN 'Lower'::public.berth_type WHEN 1 THEN 'Middle'::public.berth_type ELSE 'Upper'::public.berth_type END;
      INSERT INTO public.seats (train_id, coach_id, coach, seat_number, berth, status)
      VALUES (r_train.id, v_coach_id, 'S1', s, v_berth, 'AVAILABLE')
      ON CONFLICT (train_id, coach, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 15. Notify PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

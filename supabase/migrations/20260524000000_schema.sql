-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- TABLES
-- -------------------------------------------------------------

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    usn VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    dept VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    poster_url TEXT,
    logo_url TEXT,
    building VARCHAR(255) NOT NULL,
    hall VARCHAR(255) NOT NULL,
    maps_url TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INT NOT NULL,
    allow_reentry BOOLEAN DEFAULT FALSE NOT NULL,
    max_reentry INT DEFAULT 0 NOT NULL,
    attendance_threshold NUMERIC DEFAULT 75.0 NOT NULL,
    wallet_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    qr_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    registration_fields JSONB DEFAULT '{"usn": true, "name": true, "email": true, "phone": true, "dept": true, "year": true}'::jsonb NOT NULL,
    published BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    wallet_id VARCHAR(255),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(student_id, event_id)
);

-- 5. Attendance Sessions Table (movement logs)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    duration_minutes INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Attendance Summary Table (aggregated metrics)
CREATE TABLE IF NOT EXISTS public.attendance_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    total_minutes INT DEFAULT 0 NOT NULL,
    attendance_percent NUMERIC DEFAULT 0.0 NOT NULL,
    status VARCHAR(50) DEFAULT 'INSIDE' NOT NULL, -- 'PRESENT', 'ABSENT', 'INSIDE'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(student_id, event_id)
);

-- 7. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 1. Students Table Policies
CREATE POLICY "Students can view their own profile" ON public.students
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can view all student profiles" ON public.students
    FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Students can insert their own profile" ON public.students
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Students can update their own profile" ON public.students
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Admins Table Policies
CREATE POLICY "Admins can view admins list" ON public.admins
    FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Note: Inserting into admins table will be done via Next.js server actions (using Supabase Service Role client)
-- to enforce the admin registration code, so client RLS INSERT is disabled/locked down by default.

-- 3. Events Table Policies
CREATE POLICY "Anyone can view published events" ON public.events
    FOR SELECT TO public USING (published = true);

CREATE POLICY "Admins can view all events" ON public.events
    FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can insert events" ON public.events
    FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update events" ON public.events
    FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can delete events" ON public.events
    FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 4. Tickets Table Policies
CREATE POLICY "Students can view their own tickets" ON public.tickets
    FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Admins can view all tickets" ON public.tickets
    FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Students can register themselves (insert ticket)" ON public.tickets
    FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can modify tickets" ON public.tickets
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 5. Attendance Sessions Table Policies
CREATE POLICY "Students can view their own sessions" ON public.attendance_sessions
    FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.attendance_sessions
    FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can modify sessions" ON public.attendance_sessions
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 6. Attendance Summary Table Policies
CREATE POLICY "Students can view their own attendance summary" ON public.attendance_summary
    FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Admins can view all summaries" ON public.attendance_summary
    FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can modify summaries" ON public.attendance_summary
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 7. Push Subscriptions Table Policies
CREATE POLICY "Students can manage their own push subscriptions" ON public.push_subscriptions
    FOR ALL TO authenticated USING (student_id = auth.uid());

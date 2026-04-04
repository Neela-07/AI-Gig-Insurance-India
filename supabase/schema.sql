-- ==============================================================================
-- SMART SHIELD AI - COMPREHENSIVE SUPABASE DATABASE SCHEMA (CORRECTED)
-- Fix: Using TEXT for IDs instead of UUID for application compatibility (WRK-XXXX / CLM-XXXX)
-- ==============================================================================

-- 1. ENUM TYPES
-- (Rerun these only if they don't exist yet)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('worker', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'policy_status') THEN
        CREATE TYPE policy_status AS ENUM ('active', 'pending', 'expired', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
        CREATE TYPE claim_status AS ENUM ('processing', 'fraud_check', 'review', 'approved', 'rejected', 'credited');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_category') THEN
        CREATE TYPE event_category AS ENUM ('rain', 'heat', 'aqi', 'traffic', 'outage');
    END IF;
END $$;

-- 2. CORE TABLES (Drop and recreate to fix the UUID -> TEXT transition)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.claims CASCADE;
DROP TABLE IF EXISTS public.policies CASCADE;
DROP TABLE IF EXISTS public.risk_telemetry CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- USERS (Registration & Login)
CREATE TABLE public.users (
    id TEXT PRIMARY KEY, -- e.g. 'WRK-8821' or 'mock-id-new'
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, 
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'worker',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- INSURANCE POLICIES
CREATE TABLE public.policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Policy IDs can stay UUID
    worker_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    coverage_amount NUMERIC NOT NULL,
    premium_amount NUMERIC NOT NULL,
    billing_cycle TEXT DEFAULT 'weekly',
    status policy_status DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year')
);

-- PARAMETRIC CLAIMS (HISTORY)
CREATE TABLE public.claims (
    id TEXT PRIMARY KEY, -- e.g. 'CLM-12345'
    worker_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    event_type event_category NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payout_amount NUMERIC NOT NULL,
    status claim_status DEFAULT 'processing',
    fraud_score NUMERIC DEFAULT 0.0,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- RISK TELEMETRY (LIVE LOGS)
CREATE TABLE public.risk_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name TEXT DEFAULT 'Mumbai Central',
    temperature_c NUMERIC,
    rainfall_mm NUMERIC,
    aqi_value NUMERIC,
    traffic_density_pct NUMERIC,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SEED DATA (MOCK CONTENT)
INSERT INTO public.users (id, email, password_hash, full_name, role)
VALUES 
    ('WRK-8821', 'worker@smartshield.ai', 'PBKDF2_SECURE_HASH', 'Rahul Sharma', 'worker'),
    ('ADM-0001', 'admin@smartshield.ai', 'PBKDF2_SECURE_HASH', 'SmartShield Admin', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.policies (worker_id, plan_name, coverage_amount, premium_amount, billing_cycle)
VALUES 
    ('WRK-8821', 'Gold Shield Plan', 50000, 299, 'weekly')
ON CONFLICT DO NOTHING;

INSERT INTO public.claims (id, worker_id, event_type, triggered_at, payout_amount, status, fraud_score, description)
VALUES
    ('CLM-8821', 'WRK-8821', 'rain', NOW() - INTERVAL '2 days', 800, 'credited', 0.05, 'Automatic trigger: Mumbai rainfall exceeded 40mm threshold.'),
    ('CLM-9210', 'WRK-8821', 'heat', NOW() - INTERVAL '5 days', 600, 'credited', 0.12, 'Parametric breach: Temperature hit 43°C for 2+ hours.'),
    ('CLM-4432', 'WRK-8821', 'aqi', NOW() - INTERVAL '10 days', 500, 'rejected', 0.88, 'Suspicious claim timing: AQI probe mismatch detected.'),
    ('CLM-1102', 'WRK-8821', 'traffic', NOW() - INTERVAL '12 days', 450, 'credited', 0.15, 'Traffic density 85% detected on delivery route.')
ON CONFLICT DO NOTHING;

-- 4. SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All operations for service role" ON public.users FOR ALL TO service_role USING (true);
CREATE POLICY "Allow All operations for service role" ON public.policies FOR ALL TO service_role USING (true);
CREATE POLICY "Allow All operations for service role" ON public.claims FOR ALL TO service_role USING (true);
CREATE POLICY "Allow All operations for public testing" ON public.users FOR ALL TO public USING (true);
CREATE POLICY "Allow All operations for public testing" ON public.policies FOR ALL TO public USING (true);
CREATE POLICY "Allow All operations for public testing" ON public.claims FOR ALL TO public USING (true);
CREATE POLICY "Allow All operations for public testing" ON public.risk_telemetry FOR ALL TO public USING (true);
CREATE POLICY "Allow All operations for public testing" ON public.notifications FOR ALL TO public USING (true);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_claims_worker_txt ON public.claims(worker_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_time_log ON public.risk_telemetry(recorded_at DESC);

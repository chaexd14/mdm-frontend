-- Kiosk Fleet Management Database Schema for Supabase

-- 1. Create kiosks table
CREATE TABLE IF NOT EXISTS public.kiosks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT DEFAULT 'Manila',
    os TEXT DEFAULT 'Android 14',
    agent_version TEXT DEFAULT '1.0.0',
    app_version TEXT DEFAULT '1.0.0',
    last_seen TIMESTAMPTZ DEFAULT now(),
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT,
    url TEXT DEFAULT 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli',
    kiosk_url TEXT DEFAULT 'https://app.hotel.saikotechsolutions.com/guest-booking/zicarelli',
    refresh_interval INTEGER DEFAULT 30,
    allow_transactions BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'default',
    battery_level INTEGER DEFAULT 100,
    is_charging BOOLEAN DEFAULT false,
    is_device_owner BOOLEAN DEFAULT false,
    lock_task_state TEXT DEFAULT 'NONE',
    model TEXT DEFAULT 'Android Tablet',
    manufacturer TEXT DEFAULT 'Android',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migration for existing tables: safely add Android MDM columns if not already present
ALTER TABLE public.kiosks ADD COLUMN IF NOT EXISTS battery_level INTEGER DEFAULT 100;
ALTER TABLE public.kiosks ADD COLUMN IF NOT EXISTS is_charging BOOLEAN DEFAULT false;
ALTER TABLE public.kiosks ADD COLUMN IF NOT EXISTS is_device_owner BOOLEAN DEFAULT false;
ALTER TABLE public.kiosks ADD COLUMN IF NOT EXISTS lock_task_state TEXT DEFAULT 'NONE';
ALTER TABLE public.kiosks ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'Android Tablet';
ALTER TABLE public.kiosks ADD COLUMN IF NOT EXISTS manufacturer TEXT DEFAULT 'Android';

-- 2. Create kiosk_commands table
CREATE TABLE IF NOT EXISTS public.kiosk_commands (
    id TEXT PRIMARY KEY,
    kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    executed_at TIMESTAMPTZ
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_commands ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for public / anon access
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'kiosks' AND policyname = 'kiosks_policy_all'
    ) THEN
        CREATE POLICY "kiosks_policy_all" ON public.kiosks FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'kiosk_commands' AND policyname = 'commands_policy_all'
    ) THEN
        CREATE POLICY "commands_policy_all" ON public.kiosk_commands FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. Indexes for high-performance lookups
CREATE INDEX IF NOT EXISTS idx_kiosks_device_id ON public.kiosks(device_id);
CREATE INDEX IF NOT EXISTS idx_commands_device_id_status ON public.kiosk_commands(device_id, status);

-- 6. Enable Realtime replication for instant dashboard reactivity
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosks;
    EXCEPTION WHEN duplicate_object THEN
        -- already added
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_commands;
    EXCEPTION WHEN duplicate_object THEN
        -- already added
    END;
END $$;



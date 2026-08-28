-- Kiosk Fleet Management Database Schema for Supabase

-- 1. Create kiosks table
CREATE TABLE IF NOT EXISTS public.kiosks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT DEFAULT 'Manila',
    os TEXT DEFAULT 'Windows 11 Pro',
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


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

-- SQL script to create tables for the True Portfolio system
-- Run this in your Supabase SQL editor

-- Create yearly_starting_capitals table
CREATE TABLE IF NOT EXISTS public.yearly_starting_capitals (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    capitals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create capital_changes table
CREATE TABLE IF NOT EXISTS public.capital_changes (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    changes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly_starting_capital_overrides table
CREATE TABLE IF NOT EXISTS public.monthly_starting_capital_overrides (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    overrides JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.yearly_starting_capitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_starting_capital_overrides ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since this is a single-user app)
CREATE POLICY "Allow all operations on yearly_starting_capitals" ON public.yearly_starting_capitals
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on capital_changes" ON public.capital_changes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on monthly_starting_capital_overrides" ON public.monthly_starting_capital_overrides
    FOR ALL USING (true) WITH CHECK (true);

-- Insert default rows if they don't exist
INSERT INTO public.yearly_starting_capitals (id, capitals) 
VALUES ('00000000-0000-0000-0000-000000000001', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.capital_changes (id, changes)
VALUES ('00000000-0000-0000-0000-000000000001', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.monthly_starting_capital_overrides (id, overrides)
VALUES ('00000000-0000-0000-0000-000000000001', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_yearly_starting_capitals_updated_at 
    BEFORE UPDATE ON public.yearly_starting_capitals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capital_changes_updated_at
    BEFORE UPDATE ON public.capital_changes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_starting_capital_overrides_updated_at
    BEFORE UPDATE ON public.monthly_starting_capital_overrides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

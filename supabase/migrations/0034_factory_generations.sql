-- Create table for Factory Generations (History)
CREATE TABLE IF NOT EXISTS public.factory_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt TEXT NOT NULL,
    video_url TEXT NOT NULL,
    feedback TEXT, -- 'LIKE' or 'DISLIKE'
    feedback_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup RLS
ALTER TABLE public.factory_generations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (since factory is public right now)
CREATE POLICY "Allow public read access" ON public.factory_generations FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.factory_generations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.factory_generations FOR UPDATE USING (true);

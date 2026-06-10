-- Create news table
CREATE TABLE news (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create news_comments table
CREATE TABLE news_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id uuid REFERENCES news(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for news
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all news" ON news FOR SELECT USING (true);
CREATE POLICY "Allowed users can insert news" ON news FOR INSERT WITH CHECK (
  auth.uid() = author_id AND 
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'ceo' OR role = 'coowner')
  )
);
CREATE POLICY "Allowed users can update their news" ON news FOR UPDATE USING (
  auth.uid() = author_id AND 
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'ceo' OR role = 'coowner')
  )
);
CREATE POLICY "Allowed users can delete their news" ON news FOR DELETE USING (
  auth.uid() = author_id AND 
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'ceo' OR role = 'coowner')
  )
);

-- RLS for news_comments
ALTER TABLE news_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all news comments" ON news_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments on news" ON news_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit their own news comments" ON news_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own news comments" ON news_comments FOR DELETE USING (auth.uid() = user_id);

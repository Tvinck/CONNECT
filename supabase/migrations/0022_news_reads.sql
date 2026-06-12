-- Create news_reads table
CREATE TABLE news_reads (
  news_id uuid REFERENCES news(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (news_id, user_id)
);

-- RLS for news_reads
ALTER TABLE news_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all news reads" ON news_reads FOR SELECT USING (true);
CREATE POLICY "Users can mark news as read for themselves" ON news_reads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reads" ON news_reads FOR DELETE USING (auth.uid() = user_id);

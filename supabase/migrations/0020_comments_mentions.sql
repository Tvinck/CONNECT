-- Add mention_tag to users
ALTER TABLE users ADD COLUMN mention_tag text UNIQUE;

-- Create task_comments table
CREATE TABLE task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notifications table
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- e.g. 'mention'
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attempt to set mention_tag for "Артём Кошелев" and "Большой Босс" if they exist
UPDATE users SET mention_tag = 'art.koshelev' WHERE full_name ILIKE '%Артём Кошелев%';
UPDATE users SET mention_tag = 'b.boss' WHERE full_name ILIKE '%Большой Босс%';

-- RLS for task_comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all task comments" ON task_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON task_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit their own comments" ON task_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON task_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
-- System creates notifications via service_role, or we can allow insert for all authenticated users for now
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

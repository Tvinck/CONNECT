-- Allow authenticated users to delete their own notifications
CREATE POLICY notif_delete_own ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

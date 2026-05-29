-- ============================================================================
-- CONNECT — atomic shop purchase function
--
-- Fixes the race condition in the shop purchase flow by wrapping the entire
-- operation (stock check → points check → insert → deduct → decrement) in a
-- single serialisable transaction with row-level locks.
--
-- If two requests arrive simultaneously for the last item in stock, the second
-- one blocks on the FOR UPDATE lock until the first commits, then sees stock=0
-- and returns an error instead of overselling.
--
-- The function accepts p_user_id explicitly because the API route calls it via
-- the service_role admin client (auth.uid() is NULL in that context).
--
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================================

CREATE OR REPLACE FUNCTION public.purchase_shop_item(
  p_user_id uuid,
  p_item_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item   RECORD;
  v_user   RECORD;
  v_pid    uuid;
BEGIN
  -- Lock the item row so no concurrent purchase can read stale stock.
  SELECT id, title, price, stock, is_active
    INTO v_item
    FROM shop_items
   WHERE id = p_item_id
     FOR UPDATE;

  IF NOT FOUND OR NOT v_item.is_active THEN
    RETURN json_build_object('error', 'Товар не найден');
  END IF;

  IF v_item.stock IS NOT NULL AND v_item.stock <= 0 THEN
    RETURN json_build_object('error', 'Товар закончился');
  END IF;

  -- Lock the user row so no concurrent action can read stale points.
  SELECT id, points
    INTO v_user
    FROM users
   WHERE id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Профиль не найден');
  END IF;

  IF v_user.points < v_item.price THEN
    RETURN json_build_object(
      'error',
      format('Недостаточно баллов. Нужно %s, у вас %s', v_item.price, v_user.points)
    );
  END IF;

  -- All checks passed — execute atomically inside this transaction.

  INSERT INTO shop_purchases (user_id, item_id, points_spent, status)
  VALUES (p_user_id, p_item_id, v_item.price, 'pending')
  RETURNING id INTO v_pid;

  UPDATE users
     SET points = points - v_item.price
   WHERE id = p_user_id;

  IF v_item.stock IS NOT NULL THEN
    UPDATE shop_items
       SET stock = stock - 1
     WHERE id = p_item_id;
  END IF;

  RETURN json_build_object(
    'ok',          true,
    'purchase_id', v_pid,
    'new_points',  v_user.points - v_item.price
  );
END;
$$;

-- Add points_reward constraint to prevent accidental negative or absurd values.
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_points_reward_range
  CHECK (points_reward BETWEEN 0 AND 1000);

-- Tracks daily active site time for time-based daily missions.

CREATE TABLE IF NOT EXISTS public.daily_active_time (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  active_seconds INT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_date)
);

ALTER TABLE public.daily_active_time ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_active_time_own" ON public.daily_active_time;
CREATE POLICY "daily_active_time_own" ON public.daily_active_time
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.claim_daily_mission(p_mission_key TEXT)
RETURNS TABLE(mission_key TEXT, xp_reward INT, coins_reward INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := CURRENT_DATE;
  v_completed_tasks INT := 0;
  v_focus_seconds INT := 0;
  v_overdue_count INT := 0;
  v_xp INT := 0;
  v_coins INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT COUNT(*) INTO v_completed_tasks
  FROM public.tasks
  WHERE owner_id = v_user_id
    AND status = 'done'
    AND completed_at >= v_today::timestamptz
    AND completed_at < (v_today + 1)::timestamptz;

  SELECT COALESCE(active_seconds, 0) INTO v_focus_seconds
  FROM public.daily_active_time
  WHERE user_id = v_user_id
    AND activity_date = v_today;

  SELECT COUNT(*) INTO v_overdue_count
  FROM public.tasks
  WHERE owner_id = v_user_id
    AND status <> 'done'
    AND archived_at IS NULL
    AND due_date IS NOT NULL
    AND due_date < v_today::timestamptz;

  IF p_mission_key = 'complete_3_tasks' THEN
    IF v_completed_tasks < 3 THEN
      RAISE EXCEPTION 'Missão ainda não concluída';
    END IF;
    v_coins := 30;
  ELSIF p_mission_key = 'focus_50_minutes' THEN
    IF COALESCE(v_focus_seconds, 0) < 3000 THEN
      RAISE EXCEPTION 'Missão ainda não concluída';
    END IF;
    v_xp := 50;
  ELSIF p_mission_key = 'clear_overdue' THEN
    IF v_overdue_count > 0 OR v_completed_tasks < 1 THEN
      RAISE EXCEPTION 'Missão ainda não concluída';
    END IF;
    v_xp := 25;
    v_coins := 15;
  ELSE
    RAISE EXCEPTION 'Missão desconhecida';
  END IF;

  INSERT INTO public.daily_mission_claims (user_id, mission_key, mission_date, xp_reward, coins_reward)
  VALUES (v_user_id, p_mission_key, v_today, v_xp, v_coins);

  UPDATE public.profiles
  SET xp = xp + v_xp,
      coins = coins + v_coins,
      last_active_date = v_today
  WHERE id = v_user_id;

  INSERT INTO public.xp_events (user_id, amount, reason)
  VALUES (v_user_id, v_xp, 'daily_mission');

  RETURN QUERY SELECT p_mission_key, v_xp, v_coins;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_mission(TEXT) TO authenticated;

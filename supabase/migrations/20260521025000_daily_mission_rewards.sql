-- Daily mission claims + safer task reward rollback

CREATE TABLE IF NOT EXISTS public.daily_mission_claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_key   TEXT NOT NULL,
  mission_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_reward     INT NOT NULL DEFAULT 0,
  coins_reward  INT NOT NULL DEFAULT 0,
  claimed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_key, mission_date)
);

ALTER TABLE public.daily_mission_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_mission_claims_own" ON public.daily_mission_claims;
CREATE POLICY "daily_mission_claims_own" ON public.daily_mission_claims
  FOR SELECT USING (auth.uid() = user_id);

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

  SELECT COALESCE(SUM(duration_seconds), 0)::INT INTO v_focus_seconds
  FROM public.pomodoro_sessions
  WHERE user_id = v_user_id
    AND kind = 'focus'
    AND ended_at IS NOT NULL
    AND started_at >= v_today::timestamptz
    AND started_at < (v_today + 1)::timestamptz;

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
    IF v_focus_seconds < 3000 THEN
      RAISE EXCEPTION 'Missão ainda não concluída';
    END IF;
    v_xp := 50;
  ELSIF p_mission_key = 'clear_overdue' THEN
    IF v_overdue_count > 0 THEN
      RAISE EXCEPTION 'Ainda existem tarefas atrasadas';
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

CREATE OR REPLACE FUNCTION public.award_task_xp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_xp    INT := 50;
  v_coins INT := 10;
  v_had_early_bonus BOOLEAN := false;
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    IF NEW.due_date IS NOT NULL AND NEW.due_date > now() THEN
      v_xp    := v_xp + 25;
      v_coins := v_coins + 5;
      INSERT INTO public.xp_events (user_id, amount, reason, task_id)
        VALUES (NEW.owner_id, 25, 'early_delivery', NEW.id);
    END IF;

    INSERT INTO public.xp_events (user_id, amount, reason, task_id)
      VALUES (NEW.owner_id, 50, 'task_completed', NEW.id);

    UPDATE public.profiles
    SET
      xp          = xp + v_xp,
      coins       = coins + v_coins,
      last_active_date = CURRENT_DATE,
      streak_days = CASE
        WHEN last_active_date = CURRENT_DATE THEN streak_days
        WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
        ELSE 1
      END
    WHERE id = NEW.owner_id;

  ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.xp_events
      WHERE user_id = OLD.owner_id
        AND task_id = OLD.id
        AND reason = 'early_delivery'
    ) INTO v_had_early_bonus;

    UPDATE public.profiles
    SET
      xp = GREATEST(0, xp - CASE WHEN v_had_early_bonus THEN 75 ELSE 50 END),
      coins = GREATEST(0, coins - CASE WHEN v_had_early_bonus THEN 15 ELSE 10 END)
    WHERE id = OLD.owner_id;

    DELETE FROM public.xp_events
    WHERE user_id = OLD.owner_id
      AND task_id = OLD.id
      AND reason IN ('task_completed', 'early_delivery');
  END IF;

  RETURN NEW;
END;
$$;

-- Permite resgatar missão de foco usando tempo ativo local ou Pomodoro do dia.
-- Também tolera tarefas antigas que ficaram "done" sem completed_at por bug no cliente.

UPDATE public.tasks
SET completed_at = COALESCE(completed_at, updated_at, now())
WHERE status = 'done'
  AND completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.claim_daily_mission(p_mission_key TEXT)
RETURNS TABLE(mission_key TEXT, xp_reward INT, coins_reward INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_completed_tasks INT := 0;
  v_focus_seconds INT := 0;
  v_active_seconds INT := 0;
  v_pomodoro_seconds INT := 0;
  v_overdue_count INT := 0;
  v_xp INT := 0;
  v_coins INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.daily_mission_claims
    WHERE user_id = v_user_id
      AND mission_key = p_mission_key
      AND mission_date = v_today
  ) THEN
    RAISE EXCEPTION 'Missão já resgatada hoje';
  END IF;

  SELECT COUNT(*) INTO v_completed_tasks
  FROM public.tasks
  WHERE owner_id = v_user_id
    AND status = 'done'
    AND COALESCE(completed_at, updated_at)::date = v_today;

  SELECT COALESCE(active_seconds, 0) INTO v_active_seconds
  FROM public.daily_active_time
  WHERE user_id = v_user_id
    AND activity_date = v_today;

  SELECT COALESCE(SUM(duration_seconds), 0)::INT INTO v_pomodoro_seconds
  FROM public.pomodoro_sessions
  WHERE user_id = v_user_id
    AND kind = 'focus'
    AND started_at::date = v_today;

  v_focus_seconds := GREATEST(COALESCE(v_active_seconds, 0), COALESCE(v_pomodoro_seconds, 0));

  SELECT COUNT(*) INTO v_overdue_count
  FROM public.tasks
  WHERE owner_id = v_user_id
    AND status <> 'done'
    AND archived_at IS NULL
    AND due_date IS NOT NULL
    AND due_date::date < v_today;

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

  IF v_xp > 0 THEN
    INSERT INTO public.xp_events (user_id, amount, reason)
    VALUES (v_user_id, v_xp, 'daily_mission');
  END IF;

  RETURN QUERY SELECT p_mission_key, v_xp, v_coins;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_mission(TEXT) TO authenticated;

-- Normaliza condition_type legado e evita triggers duplicados de XP.

UPDATE public.badges SET condition_type = 'tasks_completed' WHERE condition_type = 'tasks_done';
UPDATE public.badges SET condition_type = 'pomodoro_sessions' WHERE condition_type = 'pomodoros_done';
UPDATE public.badges SET condition_type = 'early_deliveries' WHERE condition_type = 'tasks_early';
UPDATE public.badges SET condition_type = 'level' WHERE condition_type = 'level_reached';

DROP TRIGGER IF EXISTS trg_award_xp_task_done ON public.tasks;
DROP TRIGGER IF EXISTS trg_award_xp_pomodoro ON public.pomodoro_sessions;

DROP TRIGGER IF EXISTS tasks_award_xp ON public.tasks;
DROP TRIGGER IF EXISTS pomodoro_award_xp ON public.pomodoro_sessions;

CREATE OR REPLACE FUNCTION public.award_pomodoro_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kind = 'focus' THEN
    INSERT INTO public.xp_events (user_id, amount, reason)
      VALUES (NEW.user_id, 10, 'pomodoro_session');

    UPDATE public.profiles
    SET
      xp = xp + 10,
      coins = coins + 2,
      last_active_date = CURRENT_DATE,
      streak_days = CASE
        WHEN last_active_date = CURRENT_DATE THEN streak_days
        WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
        ELSE 1
      END
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_award_xp AFTER UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.award_task_xp();
CREATE TRIGGER pomodoro_award_xp AFTER INSERT ON public.pomodoro_sessions FOR EACH ROW EXECUTE FUNCTION public.award_pomodoro_xp();

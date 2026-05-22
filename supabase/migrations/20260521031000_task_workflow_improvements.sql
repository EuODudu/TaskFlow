-- Task workflow improvements:
-- - plan tasks for today without changing due date
-- - scale task completion rewards by priority and estimated size

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS planned_for DATE;

CREATE INDEX IF NOT EXISTS tasks_owner_planned_for_idx
  ON public.tasks(owner_id, planned_for)
  WHERE archived_at IS NULL;

CREATE OR REPLACE FUNCTION public.award_task_xp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_xp    INT := 50;
  v_coins INT := 10;
  v_had_early_bonus BOOLEAN := false;
  v_estimated INT := COALESCE(NEW.estimated_minutes, OLD.estimated_minutes, 0);
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    v_xp := CASE NEW.priority
      WHEN 'low' THEN 35
      WHEN 'medium' THEN 50
      WHEN 'high' THEN 70
      WHEN 'urgent' THEN 90
      ELSE 50
    END;

    v_coins := CASE NEW.priority
      WHEN 'low' THEN 7
      WHEN 'medium' THEN 10
      WHEN 'high' THEN 14
      WHEN 'urgent' THEN 18
      ELSE 10
    END;

    IF v_estimated >= 120 THEN
      v_xp := v_xp + 35;
      v_coins := v_coins + 8;
    ELSIF v_estimated >= 60 THEN
      v_xp := v_xp + 20;
      v_coins := v_coins + 5;
    ELSIF v_estimated >= 30 THEN
      v_xp := v_xp + 10;
      v_coins := v_coins + 2;
    END IF;

    IF NEW.due_date IS NOT NULL AND NEW.due_date > now() THEN
      v_xp    := v_xp + 25;
      v_coins := v_coins + 5;
      INSERT INTO public.xp_events (user_id, amount, reason, task_id)
        VALUES (NEW.owner_id, 25, 'early_delivery', NEW.id);
    END IF;

    INSERT INTO public.xp_events (user_id, amount, reason, task_id)
      VALUES (
        NEW.owner_id,
        v_xp - CASE WHEN NEW.due_date IS NOT NULL AND NEW.due_date > now() THEN 25 ELSE 0 END,
        'task_completed',
        NEW.id
      );

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

    SELECT COALESCE(SUM(amount), 0)::INT INTO v_xp
    FROM public.xp_events
    WHERE user_id = OLD.owner_id
      AND task_id = OLD.id
      AND reason IN ('task_completed', 'early_delivery');

    -- Coins were not stored historically, so estimate rollback from the same task attributes.
    v_coins := CASE OLD.priority
      WHEN 'low' THEN 7
      WHEN 'medium' THEN 10
      WHEN 'high' THEN 14
      WHEN 'urgent' THEN 18
      ELSE 10
    END;

    IF v_estimated >= 120 THEN
      v_coins := v_coins + 8;
    ELSIF v_estimated >= 60 THEN
      v_coins := v_coins + 5;
    ELSIF v_estimated >= 30 THEN
      v_coins := v_coins + 2;
    END IF;

    IF v_had_early_bonus THEN
      v_coins := v_coins + 5;
    END IF;

    UPDATE public.profiles
    SET
      xp = GREATEST(0, xp - v_xp),
      coins = GREATEST(0, coins - v_coins)
    WHERE id = OLD.owner_id;

    DELETE FROM public.xp_events
    WHERE user_id = OLD.owner_id
      AND task_id = OLD.id
      AND reason IN ('task_completed', 'early_delivery');
  END IF;

  RETURN NEW;
END;
$$;

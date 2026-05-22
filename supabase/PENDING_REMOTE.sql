-- =========================================================
-- ORBIT PRODUCTIVITY - SQL COMPLETO PARA SUBIR NO SUPABASE
-- Projeto: tjnymhgzvqttophpfghu
-- Execute este arquivo inteiro no SQL Editor do Supabase.
-- =========================================================

-- =========================================================
-- 1. Avatar 2D: slots de acessórios, aura e pose
-- =========================================================

ALTER TABLE public.user_avatar
  ADD COLUMN IF NOT EXISTS accessory_head  TEXT,
  ADD COLUMN IF NOT EXISTS accessory_face  TEXT,
  ADD COLUMN IF NOT EXISTS accessory_back  TEXT,
  ADD COLUMN IF NOT EXISTS accessory_hand  TEXT,
  ADD COLUMN IF NOT EXISTS accessory_chest TEXT,
  ADD COLUMN IF NOT EXISTS aura_emoji      TEXT,
  ADD COLUMN IF NOT EXISTS pose            TEXT NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS hair_style      TEXT NOT NULL DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS hair_color      TEXT NOT NULL DEFAULT '#5D3A1A',
  ADD COLUMN IF NOT EXISTS skin_tone       TEXT NOT NULL DEFAULT '#FDBCB4',
  ADD COLUMN IF NOT EXISTS clothes_color   TEXT NOT NULL DEFAULT '#3b82f6';

-- Remove duplicado legado de óculos; o item mantido é acc_glasses.
DELETE FROM public.avatar_items WHERE slug = 'acc_sunglasses';

-- Auras com textos revisados
INSERT INTO public.avatar_items
  (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint)
VALUES
  ('aura_none',    'Sem aura',        'aura', '✨', 1,  0,   true,  'common',    'Remove qualquer efeito ao redor do personagem.', '#94a3b8'),
  ('aura_sparkle', 'Aura de foco',    'aura', '✨', 4,  120, false, 'common',    'Partículas douradas leves para um visual concentrado.', '#facc15'),
  ('aura_fire',    'Aura flamejante', 'aura', '🔥', 9,  200, false, 'rare',      'Chamas suaves com energia de alta produtividade.', '#f97316'),
  ('aura_frost',   'Aura glacial',    'aura', '❄️', 12, 280, false, 'rare',      'Cristais frios e brilho limpo ao redor do personagem.', '#38bdf8'),
  ('aura_cosmic',  'Aura cósmica',    'aura', '💫', 18, 450, false, 'epic',      'Órbitas e estrelas para um efeito espacial premium.', '#8b5cf6'),
  ('aura_neon',    'Aura neon cyber', 'aura', '🌀', 22, 620, false, 'legendary', 'Espiral tecnológica com brilho cibernético.', '#22d3ee'),
  ('aura_rainbow', 'Aura arco-íris',  'aura', '🌈', 26, 880, false, 'mythic',    'Arcos coloridos com acabamento lendário.', '#ec4899')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  unlock_level = EXCLUDED.unlock_level,
  price_coins = EXCLUDED.price_coins,
  is_default = EXCLUDED.is_default,
  rarity = EXCLUDED.rarity,
  description = EXCLUDED.description,
  color_hint = EXCLUDED.color_hint;

-- Acessórios novos com textos revisados
INSERT INTO public.avatar_items
  (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint)
VALUES
  ('acc_wings', 'Asas angelicais',  'accessory', '🪽', 13, 320, false, 'epic',      'Costas: asas grandes com penas luminosas.', '#f8fafc'),
  ('acc_halo',  'Auréola dourada',  'accessory', '⭕', 17, 420, false, 'epic',      'Cabeça: anel dourado com brilho suave.', '#facc15'),
  ('acc_cape',  'Capa de herói',    'accessory', '🦸', 7,  150, false, 'rare',      'Costas: capa ampla com movimento e presença.', '#dc2626'),
  ('acc_drone', 'Drone assistente', 'accessory', '🛸', 19, 500, false, 'legendary', 'Mão: drone flutuante com feixes de luz.', '#22d3ee')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  unlock_level = EXCLUDED.unlock_level,
  price_coins = EXCLUDED.price_coins,
  is_default = EXCLUDED.is_default,
  rarity = EXCLUDED.rarity,
  description = EXCLUDED.description,
  color_hint = EXCLUDED.color_hint;

-- =========================================================
-- 2. Missões diárias: tempo ativo no site
-- =========================================================

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
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 3. Missões diárias: função de resgate
-- =========================================================

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

  INSERT INTO public.daily_mission_claims
    (user_id, mission_key, mission_date, xp_reward, coins_reward)
  VALUES
    (v_user_id, p_mission_key, v_today, v_xp, v_coins);

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

-- =========================================================
-- 4. Tarefas: planejamento do dia
-- =========================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS planned_for DATE;

CREATE INDEX IF NOT EXISTS tasks_owner_planned_for_idx
  ON public.tasks(owner_id, planned_for)
  WHERE archived_at IS NULL;

-- =========================================================
-- 5. Tarefas: XP/moedas por prioridade e tempo estimado
-- =========================================================

CREATE OR REPLACE FUNCTION public.award_task_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp INT := 50;
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
      v_xp := v_xp + 25;
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
    SET xp = xp + v_xp,
        coins = coins + v_coins,
        last_active_date = CURRENT_DATE,
        streak_days = CASE
          WHEN last_active_date = CURRENT_DATE THEN streak_days
          WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
          ELSE 1
        END
    WHERE id = NEW.owner_id;

  ELSIF NEW.status <> 'done' AND OLD.status = 'done' THEN
    SELECT EXISTS(
      SELECT 1
      FROM public.xp_events
      WHERE user_id = OLD.owner_id
        AND task_id = OLD.id
        AND reason = 'early_delivery'
    ) INTO v_had_early_bonus;

    SELECT COALESCE(SUM(amount), 0)::INT INTO v_xp
    FROM public.xp_events
    WHERE user_id = OLD.owner_id
      AND task_id = OLD.id
      AND reason IN ('task_completed', 'early_delivery');

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
    SET xp = GREATEST(0, xp - v_xp),
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

-- =========================================================
-- 6. Garantia final: reaplica textos revisados em itens já existentes
-- =========================================================

UPDATE public.avatar_items
SET name = v.name,
    description = v.description,
    color_hint = v.color_hint
FROM (VALUES
  ('aura_none',    'Sem aura',          'Remove qualquer efeito ao redor do personagem.', '#94a3b8'),
  ('aura_sparkle', 'Aura de foco',      'Partículas douradas leves para um visual concentrado.', '#facc15'),
  ('aura_fire',    'Aura flamejante',   'Chamas suaves com energia de alta produtividade.', '#f97316'),
  ('aura_frost',   'Aura glacial',      'Cristais frios e brilho limpo ao redor do personagem.', '#38bdf8'),
  ('aura_cosmic',  'Aura cósmica',      'Órbitas e estrelas para um efeito espacial premium.', '#8b5cf6'),
  ('aura_neon',    'Aura neon cyber',   'Espiral tecnológica com brilho cibernético.', '#22d3ee'),
  ('aura_rainbow', 'Aura arco-íris',    'Arcos coloridos com acabamento lendário.', '#ec4899'),
  ('acc_wings',    'Asas angelicais',   'Costas: asas grandes com penas luminosas.', '#f8fafc'),
  ('acc_halo',     'Auréola dourada',   'Cabeça: anel dourado com brilho suave.', '#facc15'),
  ('acc_cape',     'Capa de herói',     'Costas: capa ampla com movimento e presença.', '#dc2626'),
  ('acc_drone',    'Drone assistente',  'Mão: drone flutuante com feixes de luz.', '#22d3ee')
) AS v(slug, name, description, color_hint)
WHERE public.avatar_items.slug = v.slug;

-- =========================================================
-- 7. Decorações exclusivas de parede do escritório
-- =========================================================

INSERT INTO public.avatar_items
  (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, grid_w, grid_h, description, color_hint)
VALUES
  ('office_wall_window',      'Janela Panorâmica',     'office_item', '🪟', 1,  45, false, 'common', 2, 1, 'Janela decorativa exclusiva para a parede.',        '#60a5fa'),
  ('office_wall_clock',       'Relógio Premium',       'office_item', '🕒', 2,  35, false, 'common', 1, 1, 'Relógio minimalista para decorar a parede.',       '#2563eb'),
  ('office_wall_art_triptych','Trio de Quadros Aura',  'office_item', '🖼️', 5, 110, false, 'rare',   2, 1, 'Composição abstrata premium para a parede.',       '#ec4899'),
  ('office_wall_shelf',       'Prateleira Decorativa', 'office_item', '📚', 4,  90, false, 'rare',   2, 1, 'Prateleira suspensa com livros e planta.',          '#16a34a'),
  ('office_wall_neon_sign',   'Letreiro Neon Focus',   'office_item', '💡', 8, 180, false, 'epic',   2, 1, 'Letreiro neon com brilho discreto para a parede.', '#22d3ee')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  unlock_level = EXCLUDED.unlock_level,
  price_coins = EXCLUDED.price_coins,
  is_default = EXCLUDED.is_default,
  rarity = EXCLUDED.rarity,
  grid_w = EXCLUDED.grid_w,
  grid_h = EXCLUDED.grid_h,
  description = EXCLUDED.description,
  color_hint = EXCLUDED.color_hint;

-- =========================================================
-- FIM
-- =========================================================

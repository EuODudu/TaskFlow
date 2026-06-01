-- =========================================================
-- ORBIT PRODUCTIVITY - SQL COMPLETO PARA SUBIR NO SUPABASE
-- Projeto: tjnymhgzvqttophpfghu
-- Execute este arquivo inteiro no SQL Editor do Supabase.
-- =========================================================

-- =========================================================
-- 1. Avatar 2D: slots de acessórios, aura e pose
-- =========================================================

DROP TABLE IF EXISTS public.office_items CASCADE;

DELETE FROM public.avatar_items
WHERE category IN ('office_item', 'office_theme')
   OR slug LIKE 'office_%';

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
  v_overdue_count INT := 0;
  v_xp INT := 0;
  v_coins INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.daily_mission_claims AS dmc
    WHERE dmc.user_id = v_user_id
      AND dmc.mission_key = p_mission_key
      AND dmc.mission_date = v_today
  ) THEN
    RAISE EXCEPTION 'Missão já resgatada hoje';
  END IF;

  SELECT COUNT(*) INTO v_completed_tasks
  FROM public.tasks AS t
  WHERE t.owner_id = v_user_id
    AND t.status = 'done'
    AND COALESCE(t.completed_at, t.updated_at)::date = v_today;

  SELECT COALESCE(active_seconds, 0) INTO v_focus_seconds
  FROM public.daily_active_time AS dat
  WHERE dat.user_id = v_user_id
    AND dat.activity_date = v_today;

  SELECT GREATEST(
    COALESCE(v_focus_seconds, 0),
    COALESCE((
      SELECT SUM(ps.duration_seconds)::INT
      FROM public.pomodoro_sessions AS ps
      WHERE ps.user_id = v_user_id
        AND ps.kind = 'focus'
        AND ps.started_at::date = v_today
    ), 0)
  ) INTO v_focus_seconds;

  SELECT COUNT(*) INTO v_overdue_count
  FROM public.tasks AS t
  WHERE t.owner_id = v_user_id
    AND t.status <> 'done'
    AND t.archived_at IS NULL
    AND t.due_date IS NOT NULL
    AND t.due_date::date < v_today;

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

  UPDATE public.profiles AS p
  SET xp = p.xp + v_xp,
      coins = p.coins + v_coins,
      last_active_date = v_today
  WHERE p.id = v_user_id;

  IF v_xp > 0 THEN
    INSERT INTO public.xp_events (user_id, amount, reason)
    VALUES (v_user_id, v_xp, 'daily_mission');
  END IF;

  RETURN QUERY SELECT p_mission_key::TEXT, v_xp::INT, v_coins::INT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_mission(TEXT) TO authenticated;

-- =========================================================
-- 4. Ranking global
-- =========================================================

DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  xp INT,
  coins INT,
  streak_days INT,
  tasks_completed INT,
  rank_position INT,
  total_users INT,
  face_emoji TEXT,
  bg_color TEXT,
  accessory_emoji TEXT,
  pet_emoji TEXT,
  skin_tone TEXT,
  hair_color TEXT,
  hair_style TEXT,
  clothes_color TEXT,
  accessory_head TEXT,
  accessory_face TEXT,
  accessory_back TEXT,
  accessory_hand TEXT,
  accessory_chest TEXT,
  aura_emoji TEXT,
  pose TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH task_counts AS (
    SELECT
      t.owner_id,
      COUNT(*)::INT AS tasks_completed
    FROM public.tasks AS t
    WHERE t.status = 'done'
      AND t.archived_at IS NULL
    GROUP BY t.owner_id
  ),
  ranked AS (
    SELECT
      p.id,
      p.full_name,
      p.avatar_url,
      p.xp,
      p.coins,
      p.streak_days,
      COALESCE(tc.tasks_completed, 0)::INT AS tasks_completed,
      ROW_NUMBER() OVER (
        ORDER BY p.xp DESC, p.streak_days DESC, p.coins DESC, p.updated_at ASC, p.id ASC
      )::INT AS rank_position,
      COUNT(*) OVER ()::INT AS total_users,
      COALESCE(ua.face_emoji, '🧑') AS face_emoji,
      COALESCE(ua.bg_color, '#6366f1') AS bg_color,
      ua.accessory_emoji,
      ua.pet_emoji,
      ua.skin_tone,
      ua.hair_color,
      ua.hair_style,
      ua.clothes_color,
      ua.accessory_head,
      ua.accessory_face,
      ua.accessory_back,
      ua.accessory_hand,
      ua.accessory_chest,
      ua.aura_emoji,
      COALESCE(ua.pose, 'idle') AS pose
    FROM public.profiles AS p
    LEFT JOIN public.user_avatar AS ua ON ua.user_id = p.id
    LEFT JOIN task_counts AS tc ON tc.owner_id = p.id
  )
  SELECT
    r.id,
    r.full_name,
    r.avatar_url,
    r.xp,
    r.coins,
    r.streak_days,
    r.tasks_completed,
    r.rank_position,
    r.total_users,
    r.face_emoji,
    r.bg_color,
    r.accessory_emoji,
    r.pet_emoji,
    r.skin_tone,
    r.hair_color,
    r.hair_style,
    r.clothes_color,
    r.accessory_head,
    r.accessory_face,
    r.accessory_back,
    r.accessory_hand,
    r.accessory_chest,
    r.aura_emoji,
    r.pose
  FROM ranked AS r
  WHERE r.rank_position <= 50
     OR r.id = auth.uid()
  ORDER BY r.rank_position ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

-- =========================================================
-- 5. Tarefas: planejamento do dia
-- =========================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS planned_for DATE;

CREATE INDEX IF NOT EXISTS tasks_owner_planned_for_idx
  ON public.tasks(owner_id, planned_for)
  WHERE archived_at IS NULL;

-- =========================================================
-- 6. Tarefas: XP/moedas por prioridade e tempo estimado
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
-- 7. Garantia final: reaplica textos revisados em itens já existentes
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
-- 8. Mesa Mental (notas gamificadas)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.mental_notes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL DEFAULT 'Nova nota',
  content           TEXT,
  note_type         TEXT NOT NULL DEFAULT 'quick'
    CHECK (note_type IN ('priority', 'idea', 'quick', 'urgent', 'brain_dump')),
  priority          TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  x                 NUMERIC NOT NULL DEFAULT 0,
  y                 NUMERIC NOT NULL DEFAULT 0,
  rotation          NUMERIC NOT NULL DEFAULT 0,
  is_pinned         BOOLEAN NOT NULL DEFAULT false,
  is_completed      BOOLEAN NOT NULL DEFAULT false,
  completed_at      TIMESTAMPTZ,
  converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  archived_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mental_notes_user_active_idx
  ON public.mental_notes (user_id, archived_at, is_completed, updated_at DESC);

ALTER TABLE public.mental_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mental_notes_own" ON public.mental_notes;
CREATE POLICY "mental_notes_own" ON public.mental_notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.mental_notes_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mental_notes_updated_at ON public.mental_notes;
CREATE TRIGGER mental_notes_updated_at
  BEFORE UPDATE ON public.mental_notes
  FOR EACH ROW EXECUTE FUNCTION public.mental_notes_set_updated_at();

-- =========================================================
-- 12. Notificações de conquistas: tipos legados + triggers XP
-- IMPORTANTE: rode este bloco INTEIRO (do UPDATE até o último CREATE TRIGGER).
-- Não execute só a linha "AFTER UPDATE..." isolada — isso gera erro de sintaxe.
-- Pré-requisito: seção 5 (award_task_xp) já executada neste arquivo.
-- =========================================================

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

-- =========================================================
-- 13. Grafo de conhecimento (PKM)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT,
  node_type   TEXT NOT NULL DEFAULT 'note'
    CHECK (node_type IN ('note', 'task', 'project', 'process', 'area', 'resource', 'daily', 'template')),
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  task_id     UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  project_id  UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS knowledge_nodes_user_active_idx
  ON public.knowledge_nodes (user_id, archived_at, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id  UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  target_id  UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  edge_type  TEXT NOT NULL DEFAULT 'link'
    CHECK (edge_type IN ('link', 'parent', 'related')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, target_id, edge_type)
);

CREATE INDEX IF NOT EXISTS knowledge_edges_user_idx ON public.knowledge_edges (user_id);
CREATE INDEX IF NOT EXISTS knowledge_edges_source_idx ON public.knowledge_edges (source_id);
CREATE INDEX IF NOT EXISTS knowledge_edges_target_idx ON public.knowledge_edges (target_id);

ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knowledge_nodes_own" ON public.knowledge_nodes;
CREATE POLICY "knowledge_nodes_own" ON public.knowledge_nodes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "knowledge_edges_own" ON public.knowledge_edges;
CREATE POLICY "knowledge_edges_own" ON public.knowledge_edges
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.knowledge_nodes_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS knowledge_nodes_updated_at ON public.knowledge_nodes;
CREATE TRIGGER knowledge_nodes_updated_at
  BEFORE UPDATE ON public.knowledge_nodes
  FOR EACH ROW EXECUTE FUNCTION public.knowledge_nodes_set_updated_at();

INSERT INTO public.badges (slug, name, description, icon, rarity, xp_reward, coins_reward, condition_type, condition_value)
VALUES
  ('knowledge_notes_5',  'Arquivista',   'Crie 5 notas de conhecimento',        '📚', 'common',  40,  20, 'knowledge_notes',  5),
  ('knowledge_notes_25', 'Bibliotecário','Crie 25 notas de conhecimento',       '📖', 'rare',   120,  60, 'knowledge_notes', 25),
  ('knowledge_links_10', 'Conector',     'Estabeleça 10 links entre notas',     '🔗', 'common',  50,  25, 'knowledge_links', 10),
  ('knowledge_links_50', 'Tecelão',      'Estabeleça 50 links entre notas',     '🕸️', 'epic',   200, 100, 'knowledge_links', 50)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- FIM
-- =========================================================

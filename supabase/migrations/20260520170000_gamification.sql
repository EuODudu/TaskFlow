-- =========== Gamification: extend profiles ===========
ALTER TABLE public.profiles
  ADD COLUMN xp            INT NOT NULL DEFAULT 0,
  ADD COLUMN coins         INT NOT NULL DEFAULT 0,
  ADD COLUMN streak_days   INT NOT NULL DEFAULT 0,
  ADD COLUMN last_active_date DATE;

-- =========== XP Events ===========
CREATE TABLE public.xp_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INT         NOT NULL,
  reason     TEXT        NOT NULL, -- task_completed | early_delivery | pomodoro_session | badge_earned | streak_bonus
  task_id    UUID        REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_events_own" ON public.xp_events FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX xp_events_user_idx ON public.xp_events(user_id, created_at DESC);

-- =========== Badges (static catalogue) ===========
CREATE TABLE public.badges (
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT  UNIQUE NOT NULL,
  name            TEXT  NOT NULL,
  description     TEXT  NOT NULL,
  icon            TEXT  NOT NULL DEFAULT '🏅',
  rarity          TEXT  NOT NULL DEFAULT 'common',  -- common | rare | epic | legendary
  xp_reward       INT   NOT NULL DEFAULT 0,
  coins_reward    INT   NOT NULL DEFAULT 0,
  condition_type  TEXT  NOT NULL,                   -- tasks_completed | early_deliveries | streak_days | pomodoro_sessions | level | xp_total
  condition_value INT   NOT NULL DEFAULT 1
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select_all" ON public.badges FOR SELECT TO authenticated USING (true);

INSERT INTO public.badges (slug, name, description, icon, rarity, xp_reward, coins_reward, condition_type, condition_value) VALUES
  ('first_task',      'Primeira Missão',     'Complete sua primeira tarefa',            '🎯', 'common',    25,   10, 'tasks_completed',   1),
  ('ten_tasks',       'Veterano',            'Complete 10 tarefas',                     '💪', 'common',    50,   25, 'tasks_completed',  10),
  ('fifty_tasks',     'Meio Centurião',      'Complete 50 tarefas',                     '🎖️','rare',      150,   75, 'tasks_completed',  50),
  ('hundred_tasks',   'Centurião',           'Complete 100 tarefas',                    '🏆', 'epic',     300,  150, 'tasks_completed', 100),
  ('early_5',         'Entregador Veloz',    'Complete 5 tarefas antes do prazo',       '🚀', 'rare',     150,   75, 'early_deliveries',  5),
  ('early_20',        'Flash Delivery',      'Complete 20 tarefas antes do prazo',      '⚡', 'epic',     300,  150, 'early_deliveries', 20),
  ('streak_3',        'Em Chamas',           '3 dias seguidos de atividade',            '🔥', 'common',    25,   10, 'streak_days',       3),
  ('streak_7',        'Imparável',           '7 dias seguidos',                         '🌟', 'rare',     100,   50, 'streak_days',       7),
  ('streak_30',       'Lendário',            '30 dias seguidos!',                       '👑', 'legendary', 500, 250, 'streak_days',      30),
  ('pomodoro_10',     'Foco Total',          'Complete 10 sessões Pomodoro',            '🍅', 'common',    50,   25, 'pomodoro_sessions', 10),
  ('pomodoro_50',     'Monge do Foco',       'Complete 50 sessões Pomodoro',            '🧘', 'rare',     150,   75, 'pomodoro_sessions', 50),
  ('pomodoro_100',    'Ninja do Foco',       'Complete 100 sessões Pomodoro',           '🧠', 'epic',     300,  150, 'pomodoro_sessions',100),
  ('level_5',         'Analista Júnior',     'Alcance o nível 5',                       '💼', 'common',    75,   30, 'level',             5),
  ('level_10',        'Profissional',        'Alcance o nível 10',                      '⭐', 'rare',     150,   75, 'level',            10),
  ('level_20',        'Elite',               'Alcance o nível 20',                      '🏅', 'epic',     300,  150, 'level',            20),
  ('level_25',        'Mestre Supremo',      'Alcance o nível 25',                      '🔮', 'legendary', 500, 250, 'level',            25),
  ('xp_1000',         'Primeiros Passos',    'Acumule 1.000 XP',                        '✨', 'common',    50,   25, 'xp_total',       1000),
  ('xp_10000',        'Prodígio',            'Acumule 10.000 XP',                       '💎', 'epic',     200,  100, 'xp_total',      10000);

-- =========== User Badges ===========
CREATE TABLE public.user_badges (
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id  UUID        NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_own"        ON public.user_badges FOR ALL    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_badges_select_all" ON public.user_badges FOR SELECT TO authenticated USING (true);

-- =========== Avatar Items (catalogue) ===========
CREATE TABLE public.avatar_items (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT    UNIQUE NOT NULL,
  name         TEXT    NOT NULL,
  category     TEXT    NOT NULL,    -- face | accessory | pet
  icon         TEXT    NOT NULL DEFAULT '✨',
  unlock_level INT     NOT NULL DEFAULT 1,
  price_coins  INT     NOT NULL DEFAULT 0,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  rarity       TEXT    NOT NULL DEFAULT 'common'
);
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avatar_items_select_all" ON public.avatar_items FOR SELECT TO authenticated USING (true);

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity) VALUES
  -- Faces (default free)
  ('face_default',  'Profissional',   'face', '🧑', 1,  0,   true,  'common'),
  ('face_woman',    'Profissional F', 'face', '👩', 1,  0,   true,  'common'),
  ('face_young',    'Jovem Talento',  'face', '👦', 1,  0,   true,  'common'),
  ('face_senior',   'Executivo',      'face', '👨‍💼',1, 0,   true,  'common'),
  ('face_hero',     'Super Analista', 'face', '🦸', 5,  0,   false, 'rare'),
  ('face_wizard',   'Mago do Código', 'face', '🧙', 8,  50,  false, 'rare'),
  ('face_elf',      'Arquiteto',      'face', '🧝', 12, 100, false, 'epic'),
  ('face_robot',    'Cyborg Corp',    'face', '🤖', 15, 200, false, 'epic'),
  ('face_unicorn',  'Lendário',       'face', '🦄', 20, 500, false, 'legendary'),
  -- Accessories
  ('acc_glasses',   'Óculos de Sol',  'accessory', '🕶️', 1,  25,  false, 'common'),
  ('acc_headset',   'Headset Pro',    'accessory', '🎧', 1,  50,  false, 'common'),
  ('acc_briefcase', 'Maleta',         'accessory', '💼', 1,  25,  false, 'common'),
  ('acc_hat',       'Cartola',        'accessory', '🎩', 5,  75,  false, 'rare'),
  ('acc_crown',     'Coroa',          'accessory', '👑', 15, 200, false, 'epic'),
  ('acc_lightning', 'Energia',        'accessory', '⚡', 10, 150, false, 'rare'),
  -- Pets
  ('pet_cat',    'Gatinho',     'pet', '🐱', 1,  50,  false, 'common'),
  ('pet_dog',    'Cachorrinho', 'pet', '🐶', 1,  50,  false, 'common'),
  ('pet_hamster','Hamster',     'pet', '🐹', 1,  30,  false, 'common'),
  ('pet_fish',   'Peixinho',    'pet', '🐠', 1,  40,  false, 'common'),
  ('pet_fox',    'Raposa',      'pet', '🦊', 5,  100, false, 'rare'),
  ('pet_robot',  'Robot Pet',   'pet', '🤖', 12, 200, false, 'epic'),
  ('pet_dragon', 'Dragão',      'pet', '🐲', 20, 500, false, 'legendary');

-- =========== User Inventory ===========
CREATE TABLE public.user_inventory (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id      UUID        NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_inventory_own" ON public.user_inventory FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========== User Avatar ===========
CREATE TABLE public.user_avatar (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  face_emoji       TEXT NOT NULL DEFAULT '🧑',
  bg_color         TEXT NOT NULL DEFAULT '#6366f1',
  accessory_emoji  TEXT,
  pet_emoji        TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_avatar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_avatar_own"        ON public.user_avatar FOR ALL    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_avatar_select_all" ON public.user_avatar FOR SELECT TO authenticated USING (true);

-- =========== Leaderboard RPC ===========
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(id UUID, full_name TEXT, avatar_url TEXT, xp INT, coins INT, streak_days INT, face_emoji TEXT, bg_color TEXT)
LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.xp, p.coins, p.streak_days,
         COALESCE(ua.face_emoji, '🧑'), COALESCE(ua.bg_color, '#6366f1')
  FROM public.profiles p
  LEFT JOIN public.user_avatar ua ON ua.user_id = p.id
  ORDER BY p.xp DESC
  LIMIT 50;
$$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

-- =========== XP Trigger: task marked done ===========
CREATE OR REPLACE FUNCTION public.award_task_xp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_xp    INT := 50;
  v_coins INT := 10;
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    -- Early delivery bonus
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
        WHEN last_active_date = CURRENT_DATE             THEN streak_days
        WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
        ELSE 1
      END
    WHERE id = NEW.owner_id;

  ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
    -- Undo: roll back XP
    UPDATE public.profiles
    SET xp = GREATEST(0, xp - 50), coins = GREATEST(0, coins - 10)
    WHERE id = NEW.owner_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_award_xp
AFTER UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.award_task_xp();

-- =========== XP Trigger: pomodoro focus session ===========
CREATE OR REPLACE FUNCTION public.award_pomodoro_xp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.kind = 'focus' THEN
    INSERT INTO public.xp_events (user_id, amount, reason)
      VALUES (NEW.user_id, 10, 'pomodoro_session');

    UPDATE public.profiles
    SET
      xp          = xp + 10,
      coins       = coins + 2,
      last_active_date = CURRENT_DATE,
      streak_days = CASE
        WHEN last_active_date = CURRENT_DATE             THEN streak_days
        WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
        ELSE 1
      END
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER pomodoro_award_xp
AFTER INSERT ON public.pomodoro_sessions
FOR EACH ROW EXECUTE FUNCTION public.award_pomodoro_xp();

-- =========== Update handle_new_user to setup gamification ===========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_project_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.projects (owner_id, name, color, icon, position)
  VALUES (new.id, 'Pessoal', '#6366f1', 'sparkles', 0)
  RETURNING id INTO new_project_id;

  INSERT INTO public.board_columns (project_id, name, position, color, default_status) VALUES
    (new_project_id, 'Backlog',      0, '#94a3b8', 'backlog'),
    (new_project_id, 'A Fazer',      1, '#3b82f6', 'todo'),
    (new_project_id, 'Em Andamento', 2, '#f59e0b', 'in_progress'),
    (new_project_id, 'Em Revisão',   3, '#a855f7', 'in_review'),
    (new_project_id, 'Concluído',    4, '#10b981', 'done');

  -- Default avatar
  INSERT INTO public.user_avatar (user_id) VALUES (new.id);

  -- Add default items to inventory
  INSERT INTO public.user_inventory (user_id, item_id)
  SELECT new.id, id FROM public.avatar_items WHERE is_default = true;

  RETURN new;
END;
$$;

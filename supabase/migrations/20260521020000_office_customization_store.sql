-- =========================================================
-- Customizable office: layout table + store furniture catalog
-- =========================================================

CREATE TABLE IF NOT EXISTS public.office_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id   UUID NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  grid_x    INT  NOT NULL,
  grid_y    INT  NOT NULL,
  rotation  INT  NOT NULL DEFAULT 0,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'office_items'
      AND policyname = 'office_items_own'
  ) THEN
    CREATE POLICY "office_items_own" ON public.office_items
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS office_items_user_idx ON public.office_items(user_id);

ALTER TABLE public.avatar_items
  ADD COLUMN IF NOT EXISTS grid_w      INT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS grid_h      INT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS color_hint  TEXT NOT NULL DEFAULT '#94a3b8';

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, grid_w, grid_h, description, color_hint) VALUES
  ('office_desk',         'Mesa Básica',          'office_item', '🪑',  1,   0, true,  'common',    2, 2, 'Mesa de trabalho essencial',            '#92400e'),
  ('office_plant',        'Planta',               'office_item', '🪴',  1,  20, false, 'common',    1, 1, 'Planta que traz vida ao ambiente',      '#16a34a'),
  ('office_monitor',      'Monitor',              'office_item', '🖥️', 2,  30, false, 'common',    1, 1, 'Monitor de alta resolução',             '#1d4ed8'),
  ('office_laptop',       'Notebook',             'office_item', '💻',  3,  50, false, 'common',    1, 1, 'Notebook ultrafino',                    '#475569'),
  ('office_coffee',       'Cafeteira',            'office_item', '☕',  1,  40, false, 'common',    1, 1, 'Cafeteira para manter o foco',          '#92400e'),
  ('office_board',        'Quadro Branco',        'office_item', '📋',  5,  75, false, 'rare',      2, 1, 'Quadro branco para planejamento',       '#e5e7eb'),
  ('office_trophy',       'Estante de Troféus',   'office_item', '🏆',  8, 100, false, 'rare',      1, 2, 'Estante cheia de conquistas',           '#b45309'),
  ('office_gaming',       'Setup Gamer',          'office_item', '🎮', 12, 200, false, 'epic',      2, 2, 'Setup gamer completo',                 '#7c3aed'),
  ('office_rocket',       'Foguete Decorativo',   'office_item', '🚀', 15, 300, false, 'epic',      1, 1, 'Foguete decorativo motivacional',      '#dc2626'),
  ('office_diamond',      'Diamante Corporativo', 'office_item', '💎', 20, 500, false, 'legendary', 1, 1, 'Diamante corporativo lendário',        '#0284c7'),
  ('office_sofa',         'Sofá Executivo',       'office_item', '🛋️', 6, 120, false, 'rare',      3, 1, 'Sofá confortável para reuniões',       '#7c3aed'),
  ('office_bookshelf',    'Estante de Livros',    'office_item', '📚',  4,  80, false, 'common',    1, 2, 'Estante com livros técnicos',          '#b45309'),
  ('office_whiteboard',   'Lousa Inteligente',    'office_item', '🖊️', 7, 150, false, 'rare',      2, 2, 'Lousa digital interativa',             '#1d4ed8'),
  ('office_chandelier',   'Luminária Design',     'office_item', '💡',  3,  60, false, 'common',    1, 1, 'Luminária de design moderno',          '#f59e0b'),
  ('office_painting',     'Quadro Motivacional',  'office_item', '🖼️', 2,  40, false, 'common',    1, 1, 'Quadro com frase inspiradora',         '#9333ea'),
  ('office_arcade',       'Arcade Retrô',         'office_item', '🕹️',18, 400, false, 'epic',      1, 2, 'Arcade para pausas produtivas',        '#ef4444'),
  ('office_minibar',      'Minibar Corporativo',  'office_item', '🍹', 10, 200, false, 'rare',      1, 1, 'Minibar para reuniões',                '#0284c7'),
  ('office_rug',          'Tapete Persa',         'office_item', '🏠',  2,  50, false, 'common',    2, 2, 'Tapete premium que decora o piso',     '#b45309'),
  ('office_robot_helper', 'Assistente Robô',      'office_item', '🤖', 22, 600, false, 'legendary', 1, 1, 'Robô assistente pessoal',              '#06b6d4'),
  ('office_hologram',     'Mesa Holográfica',     'office_item', '🔮', 25, 800, false, 'mythic',    2, 2, 'Mesa com display holográfico',         '#a855f7')
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

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  ('office_theme_classic', 'Clássico Produtivo',  'office_theme', '🏢', 1,   0, true,  'common',    'Visual padrão com parede azul e piso de madeira', '#2563eb'),
  ('office_theme_minimal', 'Minimalista Branco',  'office_theme', '⚪', 2,  90, false, 'common',    'Escritório claro, limpo e moderno',              '#64748b'),
  ('office_theme_neon',    'Neon Gamer',          'office_theme', '🌌', 8, 220, false, 'rare',      'Ambiente escuro com luzes neon',                 '#22d3ee'),
  ('office_theme_nature',  'Natureza Zen',        'office_theme', '🌿', 5, 160, false, 'rare',      'Visual verde, calmo e orgânico',                 '#16a34a'),
  ('office_theme_luxury',  'Executivo Luxo',      'office_theme', '🥇', 14, 420, false, 'epic',     'Parede amadeirada com detalhes dourados',        '#f59e0b'),
  ('office_theme_space',   'Espacial Cósmico',    'office_theme', '🪐', 24, 750, false, 'mythic',    'Escritório cósmico com brilho futurista',        '#8b5cf6'),
  ('office_theme_industrial', 'Café Industrial',   'office_theme', '☕', 6, 180, false, 'rare',      'Visual escuro com tons de café e metal',         '#f97316'),
  ('office_theme_ocean',   'Oceano Profundo',     'office_theme', '🌊', 10, 260, false, 'rare',      'Ambiente azul profundo com brilho aquático',     '#06b6d4'),
  ('office_theme_aurora',  'Aurora Criativa',     'office_theme', '🎨', 16, 480, false, 'epic',      'Visual colorido com luzes de aurora',            '#ec4899'),
  ('office_theme_cyber_exec', 'Cyberpunk Executivo', 'office_theme', '🧬', 28, 900, false, 'mythic',  'Escritório futurista com neon corporativo',      '#22d3ee')
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

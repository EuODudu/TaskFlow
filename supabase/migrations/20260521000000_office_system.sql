-- =========================================================
-- Office System + Extended Avatar (2D visual upgrade)
-- =========================================================

-- Extend user_avatar with new 2D fields
ALTER TABLE public.user_avatar
  ADD COLUMN IF NOT EXISTS hair_style   TEXT NOT NULL DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS hair_color   TEXT NOT NULL DEFAULT '#5D3A1A',
  ADD COLUMN IF NOT EXISTS skin_tone    TEXT NOT NULL DEFAULT '#FDBCB4',
  ADD COLUMN IF NOT EXISTS clothes_color TEXT NOT NULL DEFAULT '#3b82f6';

-- =========== Office Layout ===========
CREATE TABLE IF NOT EXISTS public.office_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id     UUID        NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  grid_x      INT         NOT NULL,
  grid_y      INT         NOT NULL,
  rotation    INT         NOT NULL DEFAULT 0,
  placed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.office_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_items_own" ON public.office_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX office_items_user_idx ON public.office_items(user_id);

-- Extend avatar_items with visual metadata
ALTER TABLE public.avatar_items
  ADD COLUMN IF NOT EXISTS grid_w      INT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS grid_h      INT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS color_hint  TEXT NOT NULL DEFAULT '#94a3b8';

-- Update office items with proper grid sizes and colors
UPDATE public.avatar_items SET grid_w=2, grid_h=2, description='Mesa de trabalho essencial', color_hint='#92400e' WHERE slug='office_desk';
UPDATE public.avatar_items SET grid_w=1, grid_h=1, description='Planta que traz vida ao ambiente', color_hint='#16a34a' WHERE slug='office_plant';
UPDATE public.avatar_items SET grid_w=1, grid_h=1, description='Monitor de alta resolução', color_hint='#1d4ed8' WHERE slug='office_monitor';
UPDATE public.avatar_items SET grid_w=1, grid_h=1, description='Notebook ultrafino', color_hint='#475569' WHERE slug='office_laptop';
UPDATE public.avatar_items SET grid_w=1, grid_h=1, description='Cafeteira para manter o foco', color_hint='#92400e' WHERE slug='office_coffee';
UPDATE public.avatar_items SET grid_w=2, grid_h=1, description='Quadro branco para planejamento', color_hint='#e5e7eb' WHERE slug='office_board';
UPDATE public.avatar_items SET grid_w=1, grid_h=2, description='Estante cheia de conquistas', color_hint='#b45309' WHERE slug='office_trophy';
UPDATE public.avatar_items SET grid_w=2, grid_h=2, description='Setup gamer completo', color_hint='#7c3aed' WHERE slug='office_gaming';
UPDATE public.avatar_items SET grid_w=1, grid_h=1, description='Foguete decorativo motivacional', color_hint='#dc2626' WHERE slug='office_rocket';
UPDATE public.avatar_items SET grid_w=1, grid_h=1, description='Diamante corporativo lendário', color_hint='#0284c7' WHERE slug='office_diamond';

-- Update non-office items with descriptions
UPDATE public.avatar_items SET description='Personagem profissional padrão' WHERE slug='face_default';
UPDATE public.avatar_items SET description='Personagem feminino profissional' WHERE slug='face_woman';
UPDATE public.avatar_items SET description='Jovem talento da empresa' WHERE slug='face_young';
UPDATE public.avatar_items SET description='Executivo experiente' WHERE slug='face_senior';
UPDATE public.avatar_items SET description='Super analista heroico' WHERE slug='face_hero';
UPDATE public.avatar_items SET description='Mago do código e das planilhas' WHERE slug='face_wizard';
UPDATE public.avatar_items SET description='Arquiteto de soluções elegantes' WHERE slug='face_elf';
UPDATE public.avatar_items SET description='Cyborg corporativo do futuro' WHERE slug='face_robot';
UPDATE public.avatar_items SET description='Ser lendário de produtividade máxima' WHERE slug='face_unicorn';

-- Add a few more office items (furniture)
INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, rarity, grid_w, grid_h, description, color_hint) VALUES
  ('office_sofa',        'Sofá Executivo',     'office_item', '🛋️', 6,  120, 'rare',      3, 1, 'Sofá confortável para reuniões', '#7c3aed'),
  ('office_bookshelf',   'Estante de Livros',  'office_item', '📚', 4,  80,  'common',    1, 2, 'Estante com livros técnicos',    '#b45309'),
  ('office_whiteboard',  'Lousa Inteligente',  'office_item', '🖊️', 7,  150, 'rare',      2, 2, 'Lousa digital interativa',       '#1d4ed8'),
  ('office_chandelier',  'Luminária Design',   'office_item', '💡', 3,  60,  'common',    1, 1, 'Luminária de design moderno',    '#f59e0b'),
  ('office_painting',    'Quadro Motivacional','office_item', '🖼️', 2,  40,  'common',    1, 1, 'Quadro com frase inspiradora',   '#9333ea'),
  ('office_arcade',      'Arcade Retrô',       'office_item', '🕹️', 18, 400, 'epic',      1, 2, 'Arcade para pausas produtivas',  '#ef4444'),
  ('office_minibar',     'Minibar Corporativo','office_item', '🍹', 10, 200, 'rare',      1, 1, 'Minibar para reuniões',          '#0284c7'),
  ('office_rug',         'Tapete Persa',        'office_item', '🏠', 2,  50,  'common',    2, 2, 'Tapete premium que decora o piso','#b45309'),
  ('office_robot_helper','Assistente Robô',     'office_item', '🤖', 22, 600, 'legendary', 1, 1, 'Robô assistente pessoal',        '#06b6d4'),
  ('office_hologram',    'Mesa Holográfica',   'office_item', '🔮', 25, 800, 'mythic',    2, 2, 'Mesa com display holográfico',   '#a855f7')
ON CONFLICT (slug) DO NOTHING;

-- Add mythic rarity to avatar_items rarity check (no constraint to modify, just data)
-- Insert mythic face
INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, rarity, description) VALUES
  ('face_mythic', 'Ser Cósmico', 'face', '🌌', 30, 1000, 'mythic', 'Entidade além da compreensão')
ON CONFLICT (slug) DO NOTHING;

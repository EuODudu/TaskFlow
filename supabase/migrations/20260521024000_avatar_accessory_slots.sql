-- Slots de acessório, aura e pose do personagem 2D

ALTER TABLE public.user_avatar
  ADD COLUMN IF NOT EXISTS accessory_head  TEXT,
  ADD COLUMN IF NOT EXISTS accessory_face  TEXT,
  ADD COLUMN IF NOT EXISTS accessory_back  TEXT,
  ADD COLUMN IF NOT EXISTS accessory_hand  TEXT,
  ADD COLUMN IF NOT EXISTS accessory_chest TEXT,
  ADD COLUMN IF NOT EXISTS aura_emoji      TEXT,
  ADD COLUMN IF NOT EXISTS pose            TEXT NOT NULL DEFAULT 'idle';

-- Auras
INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  ('aura_none',    'Sem aura',             'aura', '✨', 1,  0,   true,  'common',    'Remove qualquer efeito ao redor do personagem.', '#94a3b8'),
  ('aura_sparkle', 'Aura de foco',         'aura', '✨', 4,  120, false, 'common',    'Partículas douradas leves para um visual concentrado.', '#facc15'),
  ('aura_fire',    'Aura flamejante',      'aura', '🔥', 9,  200, false, 'rare',      'Chamas suaves com energia de alta produtividade.', '#f97316'),
  ('aura_frost',   'Aura glacial',         'aura', '❄️', 12, 280, false, 'rare',      'Cristais frios e brilho limpo ao redor do personagem.', '#38bdf8'),
  ('aura_cosmic',  'Aura cósmica',         'aura', '💫', 18, 450, false, 'epic',      'Órbitas e estrelas para um efeito espacial premium.', '#8b5cf6'),
  ('aura_neon',    'Aura neon cyber',      'aura', '🌀', 22, 620, false, 'legendary', 'Espiral tecnológica com brilho cibernético.', '#22d3ee'),
  ('aura_rainbow', 'Aura arco-íris',       'aura', '🌈', 26, 880, false, 'mythic',    'Arcos coloridos com acabamento lendário.', '#ec4899')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  unlock_level = EXCLUDED.unlock_level,
  price_coins = EXCLUDED.price_coins,
  rarity = EXCLUDED.rarity,
  description = EXCLUDED.description,
  color_hint = EXCLUDED.color_hint;

-- Acessórios com slots explícitos + SVG novos
INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  ('acc_wings',  'Asas angelicais',      'accessory', '🪽', 13, 320, false, 'epic',      'Costas: asas grandes com penas luminosas.', '#f8fafc'),
  ('acc_halo',   'Auréola dourada',      'accessory', '⭕', 17, 420, false, 'epic',      'Cabeça: anel dourado com brilho suave.', '#facc15'),
  ('acc_cape',   'Capa de herói',        'accessory', '🦸', 7,  150, false, 'rare',      'Costas: capa ampla com movimento e presença.', '#dc2626'),
  ('acc_drone',  'Drone assistente',     'accessory', '🛸', 19, 500, false, 'legendary', 'Mão: drone flutuante com feixes de luz.', '#22d3ee')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  unlock_level = EXCLUDED.unlock_level,
  price_coins = EXCLUDED.price_coins,
  rarity = EXCLUDED.rarity,
  description = EXCLUDED.description,
  color_hint = EXCLUDED.color_hint;

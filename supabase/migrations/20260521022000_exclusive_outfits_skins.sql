-- =========================================================
-- Extravagant outfits and exclusive character skins
-- =========================================================

ALTER TABLE public.avatar_items
  ADD COLUMN IF NOT EXISTS grid_w      INT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS grid_h      INT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS color_hint  TEXT NOT NULL DEFAULT '#94a3b8';

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  ('face_dragon_exec',      'Executivo Dragão',        'face', '🐉', 18, 520, false, 'legendary', 'Skin lendária com energia dracônica e presença imponente', '#16a34a'),
  ('face_vampire_ceo',      'CEO Vampiro',             'face', '🧛', 14, 360, false, 'epic',      'Visual sombrio, elegante e extremamente exclusivo',         '#7f1d1d'),
  ('face_fairy_sprint',     'Fada do Sprint',          'face', '🧚', 11, 280, false, 'epic',      'Skin mágica para acelerar tarefas com leveza',              '#ec4899'),
  ('face_ice_overlord',     'Senhor do Gelo',          'face', '🧊', 16, 420, false, 'epic',      'Armadura gelada com brilho tecnológico',                    '#38bdf8'),
  ('face_wolf_operator',    'Lobo Operacional',        'face', '🐺', 12, 300, false, 'rare',      'Visual feroz para quem caça pendências',                    '#64748b'),
  ('face_eagle_director',   'Diretor Águia',           'face', '🦅', 13, 320, false, 'rare',      'Skin executiva com foco e visão estratégica',               '#b45309'),
  ('face_biohacker',        'Biohacker Corporativo',   'face', '🧬', 20, 620, false, 'legendary', 'Visual futurista com DNA, neon e produtividade extrema',    '#14b8a6'),
  ('face_shadow_agent',     'Agente das Sombras',      'face', '🕶️', 10, 260, false, 'rare',      'Skin misteriosa para produtividade silenciosa',             '#111827'),
  ('face_diamond_emperor',  'Imperador Diamante',      'face', '💎', 24, 850, false, 'mythic',    'Skin mítica com luxo cristalino e aura premium',            '#06b6d4'),
  ('face_saturn_guardian',  'Guardião de Saturno',     'face', '🪐', 28, 980, false, 'mythic',    'Guardião cósmico com energia interplanetária',              '#8b5cf6'),

  ('outfit_dragon_scale',     'Armadura Escamas de Dragão', 'outfit', '#14532d', 18, 380, false, 'legendary', 'Roupa lendária verde escura com energia dracônica',      '#14532d'),
  ('outfit_vampire_velvet',   'Veludo Vampírico',           'outfit', '#450a0a', 14, 260, false, 'epic',      'Traje escuro de veludo para presença dramática',          '#450a0a'),
  ('outfit_fairy_glow',       'Aura de Fada',               'outfit', '#f0abfc', 11, 230, false, 'epic',      'Roupa mágica rosa-lilás com brilho delicado',             '#f0abfc'),
  ('outfit_ice_armor',        'Armadura Glacial',           'outfit', '#7dd3fc', 16, 300, false, 'epic',      'Roupa azul cristalina inspirada em gelo futurista',       '#7dd3fc'),
  ('outfit_shadow_ops',       'Operações Sombra',           'outfit', '#020617', 10, 210, false, 'rare',      'Traje preto profundo para visual secreto',                '#020617'),
  ('outfit_galaxy_royal',     'Galáxia Real',               'outfit', '#581c87', 24, 700, false, 'mythic',    'Roupa mítica roxa com aura espacial',                     '#581c87'),
  ('outfit_diamond_luxury',   'Luxo Diamante',              'outfit', '#67e8f9', 22, 620, false, 'legendary', 'Roupa cristalina com brilho de diamante',                 '#67e8f9'),
  ('outfit_toxic_neon',       'Neon Tóxico',                'outfit', '#a3e635', 15, 280, false, 'epic',      'Traje extravagante verde neon para chamar atenção',       '#a3e635'),
  ('outfit_lava_king',        'Rei da Lava',                'outfit', '#ea580c', 19, 420, false, 'legendary', 'Roupa vulcânica laranja com impacto visual forte',        '#ea580c'),
  ('outfit_cyber_gold',       'Cyber Ouro',                 'outfit', '#facc15', 21, 520, false, 'legendary', 'Traje dourado futurista para elite produtiva',            '#facc15'),
  ('outfit_hologram_suit',    'Terno Holográfico',          'outfit', '#22d3ee', 26, 760, false, 'mythic',    'Terno holográfico com brilho de tecnologia avançada',     '#22d3ee'),
  ('outfit_crimson_royalty',  'Realeza Carmesim',           'outfit', '#be123c', 17, 340, false, 'epic',      'Roupa vermelha nobre e extravagante',                     '#be123c')
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

-- =========================================================
-- More avatar cosmetics: skins, outfits, and accessories
-- =========================================================

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  -- New character skins
  ('face_ninja',     'Ninja do Foco',       'face', '🥷',     10, 180, false, 'rare',      'Especialista silencioso em foco profundo', '#38bdf8'),
  ('face_astronaut', 'Astronauta das Metas','face', '🧑‍🚀',  14, 260, false, 'epic',      'Explorador de metas fora da órbita',       '#60a5fa'),
  ('face_scientist', 'Cientista Produtivo', 'face', '🧑‍🔬',   9, 150, false, 'rare',      'Testa hipóteses e otimiza rotinas',        '#14b8a6'),
  ('face_artist',    'Criativo Sprint',     'face', '🎨',      7, 120, false, 'rare',      'Transforma tarefas em ideias visuais',     '#f43f5e'),

  -- Outfit colors/themes. The icon stores the outfit color used by Avatar2D.
  ('outfit_focus_black',  'Roupa Foco Noturno',  'outfit', '#0f172a',  6,  90, false, 'common', 'Visual escuro para sessões de foco',       '#0f172a'),
  ('outfit_neon_blue',    'Roupa Neon Azul',     'outfit', '#22d3ee',  8, 130, false, 'rare',   'Roupa com energia cyber azul',             '#22d3ee'),
  ('outfit_royal_purple', 'Roupa Real Violeta',  'outfit', '#7e22ce', 12, 220, false, 'epic',   'Traje violeta para conquistas importantes','#7e22ce'),
  ('outfit_forest_green', 'Roupa Guardião Verde','outfit', '#166534',  5, 100, false, 'common', 'Tema calmo inspirado em natureza',         '#166534'),
  ('outfit_sunset_orange','Roupa Sprint Solar',  'outfit', '#f97316', 10, 180, false, 'rare',   'Roupa laranja para dias de execução',      '#f97316'),
  ('outfit_mythic_pink',  'Roupa Mítica Aurora', 'outfit', '#db2777', 24, 650, false, 'mythic', 'Visual raro com energia de aurora',        '#db2777'),

  -- New accessories
  ('acc_cap',       'Boné de Sprint',      'accessory', '🧢',  2,  45, false, 'common',    'Boné casual para rotinas leves',           '#2563eb'),
  ('acc_wand',      'Varinha de Automação','accessory', '🪄', 11, 180, false, 'rare',      'Para transformar tarefa repetida em magia','#facc15'),
  ('acc_moon',      'Broche Lunar',        'accessory', '🌙',  8, 140, false, 'rare',      'Acessório calmo para foco noturno',        '#fef3c7'),
  ('acc_gem',       'Cristal de XP',       'accessory', '💎', 16, 300, false, 'epic',      'Cristal brilhante para veteranos',         '#67e8f9'),
  ('acc_backpack',  'Mochila de Projeto',  'accessory', '🎒',  4,  80, false, 'common',    'Carrega tudo que um projeto precisa',      '#ef4444')
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

-- =========================================================
-- Even more avatar cosmetics: outfits and accessories
-- =========================================================

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  -- More outfit colors/themes. The icon stores the outfit color used by Avatar2D.
  ('outfit_crimson_exec',  'Roupa Executivo Carmim', 'outfit', '#b91c1c',  9,  160, false, 'rare',      'Traje carmim para decisões importantes',     '#b91c1c'),
  ('outfit_gold_elite',    'Roupa Elite Dourada',    'outfit', '#d97706', 18,  360, false, 'epic',      'Visual dourado para alta performance',       '#d97706'),
  ('outfit_ice_focus',     'Roupa Foco Ártico',      'outfit', '#38bdf8', 11,  190, false, 'rare',      'Tema gelado e limpo para concentração',      '#38bdf8'),
  ('outfit_lavender_calm', 'Roupa Lavanda Zen',      'outfit', '#a78bfa',  4,   85, false, 'common',    'Roupa suave para rotina tranquila',          '#a78bfa'),
  ('outfit_graphite_ops',  'Roupa Operações Grafite','outfit', '#374151',  7,  120, false, 'common',    'Tema sóbrio para organização diária',        '#374151'),
  ('outfit_mint_flow',     'Roupa Fluxo Menta',      'outfit', '#2dd4bf', 13,  240, false, 'rare',      'Visual fresco para entrar no fluxo',         '#2dd4bf'),
  ('outfit_ocean_deep',    'Roupa Oceano Profundo',  'outfit', '#1e3a8a', 15,  280, false, 'epic',      'Azul profundo para metas grandes',           '#1e3a8a'),
  ('outfit_rose_gold',     'Roupa Rose Gold',        'outfit', '#f472b6', 16,  320, false, 'epic',      'Tema premium com brilho rosado',             '#f472b6'),
  ('outfit_storm_mythic',  'Roupa Tempestade Mítica','outfit', '#312e81', 28,  900, false, 'mythic',    'Traje mítico com energia de tempestade',     '#312e81'),

  -- More accessories
  ('acc_scarf',   'Cachecol de Streak',      'accessory', '🧣',  6,  110, false, 'common',    'Cachecol para manter a sequência aquecida', '#dc2626'),
  ('acc_shield',  'Escudo Anti-Procrastinação','accessory','🛡️', 12,  230, false, 'rare',      'Proteção simbólica contra distrações',      '#2563eb'),
  ('acc_medal',   'Medalha de Produtividade','accessory', '🏅',  9,  170, false, 'rare',      'Medalha para quem entrega com consistência','#facc15'),
  ('acc_coffee',  'Café de Foco',            'accessory', '☕',  3,   65, false, 'common',    'Dose extra para começar uma tarefa',        '#92400e'),
  ('acc_flower',  'Flor Zen',                'accessory', '🌸',  5,   95, false, 'common',    'Detalhe calmo para o avatar',              '#f9a8d4'),
  ('acc_book',    'Manual de Hábitos',       'accessory', '📘',  8,  145, false, 'rare',      'Livro de rotinas e boas práticas',         '#2563eb'),
  ('acc_compass', 'Bússola de Metas',        'accessory', '🧭', 14,  260, false, 'epic',      'Aponta para a próxima grande meta',        '#ef4444'),
  ('acc_target',  'Alvo de Sprint',          'accessory', '🎯', 10,  190, false, 'rare',      'Marca visual de foco no objetivo',         '#ef4444')
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

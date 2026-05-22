-- =========================================================
-- Move former profile-only cosmetics into the store catalog
-- =========================================================

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  -- Former character presets from the profile editor
  ('face_default',  'Profissional',        'face', '🧑',    1,   0, true,  'common',    'Personagem masculino padrão',              '#3b82f6'),
  ('face_woman',    'Profissional F',      'face', '👩',    1,   0, true,  'common',    'Personagem feminino padrão',               '#ec4899'),
  ('face_young',    'Jovem Talento',       'face', '👦',    3,  70, false, 'common',    'Energia jovem para começar a jornada',     '#22c55e'),
  ('face_senior',   'Executivo',           'face', '👨‍💼',  4,  90, false, 'common',    'Visual executivo e estratégico',           '#0f172a'),
  ('face_hero',     'Super Analista',      'face', '🦸',    5, 120, false, 'rare',      'Herói das entregas difíceis',              '#2563eb'),
  ('face_wizard',   'Mago do Código',      'face', '🧙',    8, 150, false, 'rare',      'Domina automações e atalhos',              '#8b5cf6'),
  ('face_elf',      'Arquiteto',           'face', '🧝',   12, 240, false, 'epic',      'Planeja soluções elegantes',               '#10b981'),
  ('face_robot',    'Cyborg Corp',         'face', '🤖',   15, 320, false, 'epic',      'Produtividade com precisão robótica',      '#06b6d4'),
  ('face_unicorn',  'Lendário',            'face', '🦄',   20, 600, false, 'legendary', 'Mascote lendário de produtividade máxima', '#ec4899'),
  ('face_cosmic',   'Guardião Cósmico',    'face', '🌌',   26, 850, false, 'mythic',    'Explorador mítico das grandes metas',      '#a855f7'),

  -- Former free clothing colors from the profile editor
  ('outfit_default_indigo',  'Roupa Índigo Base',    'outfit', '#6366f1',  1,   0, true,  'common', 'Roupa inicial índigo',                    '#6366f1'),
  ('outfit_emerald_base',   'Roupa Esmeralda',      'outfit', '#10b981',  2,  45, false, 'common', 'Visual verde para rotina equilibrada',     '#10b981'),
  ('outfit_rose_base',      'Roupa Rosa',           'outfit', '#ec4899',  2,  45, false, 'common', 'Visual vibrante em rosa',                  '#ec4899'),
  ('outfit_amber_base',     'Roupa Âmbar',          'outfit', '#f59e0b',  3,  55, false, 'common', 'Tom quente para começar o dia',            '#f59e0b'),
  ('outfit_red_base',       'Roupa Vermelha',       'outfit', '#ef4444',  3,  55, false, 'common', 'Energia vermelha para execução',           '#ef4444'),
  ('outfit_cyan_base',      'Roupa Ciano',          'outfit', '#06b6d4',  4,  70, false, 'common', 'Visual claro e tecnológico',               '#06b6d4'),
  ('outfit_slate_base',     'Roupa Slate',          'outfit', '#64748b',  4,  70, false, 'common', 'Roupa neutra para organização diária',     '#64748b'),
  ('outfit_violet_base',    'Roupa Violeta',        'outfit', '#8b5cf6',  5,  90, false, 'rare',   'Violeta para metas ambiciosas',            '#8b5cf6'),
  ('outfit_lime_base',      'Roupa Lima',           'outfit', '#84cc16',  5,  90, false, 'rare',   'Visual vivo para manter o ritmo',          '#84cc16'),
  ('outfit_coral_base',     'Roupa Coral',          'outfit', '#fb7185',  6, 110, false, 'rare',   'Tema coral para sprints criativos',        '#fb7185'),

  -- Former profile accessories and pets
  ('acc_none',      'Sem Acessório',        'accessory', '🚫',  1,   0, true,  'common',    'Remove o acessório equipado',              '#94a3b8'),
  ('acc_glasses',   'Óculos de Sol',        'accessory', '🕶️', 1,  25, false, 'common',    'Óculos clássicos para o avatar',           '#111827'),
  ('acc_headset',   'Headset Pro',          'accessory', '🎧',  1,  50, false, 'common',    'Headset para foco e reuniões',             '#2563eb'),
  ('acc_briefcase', 'Maleta',               'accessory', '💼',  2,  60, false, 'common',    'Maleta de projetos importantes',           '#92400e'),
  ('acc_hat',       'Cartola',              'accessory', '🎩',  5,  90, false, 'rare',      'Cartola elegante para conquistas',         '#111827'),
  ('acc_crown',     'Coroa',                'accessory', '👑', 15, 240, false, 'epic',      'Coroa de liderança produtiva',             '#facc15'),
  ('acc_lightning', 'Energia',              'accessory', '⚡', 10, 170, false, 'rare',      'Faísca de energia para o avatar',          '#facc15'),
  ('pet_none',      'Sem Pet',              'pet',       '🚫',  1,   0, true,  'common',    'Remove o pet equipado',                    '#94a3b8'),
  ('pet_cat',       'Gatinho',              'pet',       '🐱',  1,  50, false, 'common',    'Companheiro calmo de produtividade',       '#f59e0b'),
  ('pet_dog',       'Cachorrinho',          'pet',       '🐶',  1,  50, false, 'common',    'Companheiro leal para as tarefas',         '#a16207'),
  ('pet_hamster',   'Hamster',              'pet',       '🐹',  2,  45, false, 'common',    'Pequeno parceiro de rotina',               '#fbbf24'),
  ('pet_fish',      'Peixinho',             'pet',       '🐠',  2,  45, false, 'common',    'Companheiro tranquilo de foco',            '#38bdf8'),
  ('pet_fox',       'Raposa',               'pet',       '🦊',  5, 110, false, 'rare',      'Raposa esperta para metas rápidas',        '#f97316'),
  ('pet_robot',     'Robot Pet',            'pet',       '🤖', 12, 240, false, 'epic',      'Pet robótico para automações',             '#06b6d4'),
  ('pet_dragon',    'Dragão',               'pet',       '🐲', 20, 650, false, 'legendary', 'Dragão lendário de grandes conquistas',    '#ef4444')
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

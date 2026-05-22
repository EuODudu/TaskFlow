-- =========================================================
-- Character skin visual pass: professional, classic faces, gossip
-- =========================================================

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  ('face_default',    'Profissional',          'face', '🧑',   1,   0, true,  'common', 'Profissional masculino base com visual corporativo', '#3b82f6'),
  ('face_woman',      'Profissional F',        'face', '👩',   1,   0, true,  'common', 'Profissional feminino base com visual corporativo',  '#ec4899'),
  ('face_smile',      'Sorriso',               'face', '😊',   1,  50, false, 'common', 'Personagem sempre positivo e motivado',             '#f59e0b'),
  ('face_cool',       'Estiloso',              'face', '😎',   3,  90, false, 'common', 'Visual confiante com atitude de quem entrega',      '#0ea5e9'),
  ('face_nerd',       'Nerd',                  'face', '🤓',   4, 110, false, 'common', 'Especialista em detalhes, dados e atalhos',         '#2563eb'),
  ('face_young',      'Jovem Talento',         'face', '👦',   3,  70, false, 'common', 'Energia jovem para começar a jornada',              '#22c55e'),
  ('face_fire',       'Em Chamas',             'face', '🔥',   8, 180, false, 'rare',   'Ritmo intenso para dias de alta performance',       '#f97316'),
  ('face_star',       'Estrelinha',            'face', '⭐',   9, 190, false, 'rare',   'Brilha nas entregas e metas importantes',           '#facc15'),
  ('face_crown',      'Realeza',               'face', '👑',  16, 360, false, 'epic',   'Presença majestosa para líderes produtivos',        '#d97706'),
  ('face_gossip',     'Fofoqueiro do Setor',   'face', '🗣️', 6, 140, false, 'rare',   'Sempre sabe qual tarefa mudou de status primeiro',  '#ec4899')
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

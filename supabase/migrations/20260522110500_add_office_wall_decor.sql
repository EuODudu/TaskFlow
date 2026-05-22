-- Decorações exclusivas de parede para o escritório.
INSERT INTO public.avatar_items
  (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, grid_w, grid_h, description, color_hint)
VALUES
  ('office_wall_window',      'Janela Panorâmica',    'office_item', '🪟', 1,  45, false, 'common', 2, 1, 'Janela decorativa exclusiva para a parede.',        '#60a5fa'),
  ('office_wall_clock',       'Relógio Premium',      'office_item', '🕒', 2,  35, false, 'common', 1, 1, 'Relógio minimalista para decorar a parede.',       '#2563eb'),
  ('office_wall_art_triptych','Trio de Quadros Aura', 'office_item', '🖼️', 5, 110, false, 'rare',   2, 1, 'Composição abstrata premium para a parede.',       '#ec4899'),
  ('office_wall_shelf',       'Prateleira Decorativa','office_item', '📚', 4,  90, false, 'rare',   2, 1, 'Prateleira suspensa com livros e planta.',          '#16a34a'),
  ('office_wall_neon_sign',   'Letreiro Neon Focus',  'office_item', '💡', 8, 180, false, 'epic',   2, 1, 'Letreiro neon com brilho discreto para a parede.', '#22d3ee')
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

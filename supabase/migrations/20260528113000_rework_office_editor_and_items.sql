-- Escritório v2: zonas de posicionamento e itens de superfície (mesa)

ALTER TABLE public.avatar_items
  ADD COLUMN IF NOT EXISTS placement_zone TEXT NOT NULL DEFAULT 'floor'
    CHECK (placement_zone IN ('floor', 'wall', 'surface', 'rug')),
  ADD COLUMN IF NOT EXISTS surface_only BOOLEAN NOT NULL DEFAULT false;

UPDATE public.avatar_items
SET placement_zone = CASE
  WHEN slug LIKE 'office_wall_%' THEN 'wall'
  WHEN slug IN ('office_board', 'office_whiteboard', 'office_chandelier', 'office_painting') THEN 'wall'
  WHEN slug = 'office_rug' THEN 'rug'
  WHEN slug IN (
    'office_monitor',
    'office_laptop',
    'office_coffee',
    'office_keyboard',
    'office_mousepad',
    'office_desk_lamp',
    'office_book_stack',
    'office_table_plant'
  ) THEN 'surface'
  ELSE 'floor'
END,
surface_only = CASE
  WHEN slug IN (
    'office_monitor',
    'office_laptop',
    'office_coffee',
    'office_keyboard',
    'office_mousepad',
    'office_desk_lamp',
    'office_book_stack',
    'office_table_plant'
  ) THEN true
  ELSE false
END
WHERE category = 'office_item';

INSERT INTO public.avatar_items
  (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, grid_w, grid_h, description, color_hint, placement_zone, surface_only)
VALUES
  ('office_keyboard',   'Teclado Mecânico',     'office_item', '⌨️',  3,  55, false, 'common', 1, 1, 'Teclado para setup de produtividade.', '#334155', 'surface', true),
  ('office_mousepad',   'Mousepad XL',          'office_item', '🖱️',  2,  35, false, 'common', 1, 1, 'Base para organizar mesa e mouse.',   '#1d4ed8', 'surface', true),
  ('office_desk_lamp',  'Luminária de Mesa',    'office_item', '💡',  4,  70, false, 'rare',   1, 1, 'Luz de tarefa para foco noturno.',     '#f59e0b', 'surface', true),
  ('office_book_stack', 'Pilha de Livros',      'office_item', '📚',  2,  30, false, 'common', 1, 1, 'Livros decorativos para bancada.',      '#16a34a', 'surface', true),
  ('office_table_plant','Planta de Mesa',       'office_item', '🌱',  2,  30, false, 'common', 1, 1, 'Planta pequena para mesa de trabalho.', '#22c55e', 'surface', true)
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
  color_hint = EXCLUDED.color_hint,
  placement_zone = EXCLUDED.placement_zone,
  surface_only = EXCLUDED.surface_only;

UPDATE public.avatar_items
SET
  grid_w = CASE
    WHEN slug IN ('office_desk', 'office_hologram') THEN 3
    WHEN slug IN ('office_sofa') THEN 3
    WHEN slug IN ('office_board', 'office_whiteboard', 'office_wall_window', 'office_wall_art_triptych', 'office_wall_shelf', 'office_wall_neon_sign') THEN 2
    ELSE grid_w
  END,
  grid_h = CASE
    WHEN slug IN ('office_desk', 'office_hologram') THEN 2
    WHEN slug IN ('office_wall_window', 'office_wall_art_triptych', 'office_wall_shelf', 'office_wall_neon_sign') THEN 1
    ELSE grid_h
  END
WHERE slug IN (
  'office_desk',
  'office_hologram',
  'office_sofa',
  'office_board',
  'office_whiteboard',
  'office_wall_window',
  'office_wall_art_triptych',
  'office_wall_shelf',
  'office_wall_neon_sign'
);

-- Dream Setup: sala maior, estilos de decoração e novos itens

ALTER TABLE public.avatar_items
  DROP CONSTRAINT IF EXISTS avatar_items_placement_zone_check;

ALTER TABLE public.avatar_items
  ADD CONSTRAINT avatar_items_placement_zone_check
    CHECK (placement_zone IN ('floor', 'wall', 'surface', 'rug', 'flooring', 'wallpaper', 'lighting'));

ALTER TABLE public.avatar_items
  ADD COLUMN IF NOT EXISTS decor_style TEXT
    CHECK (decor_style IS NULL OR decor_style IN ('minimal', 'gamer', 'cozy', 'tech', 'nature'));

-- Reclassificar itens existentes por estilo
UPDATE public.avatar_items SET decor_style = 'gamer' WHERE slug IN ('office_gaming', 'office_arcade', 'office_wall_neon_sign', 'office_rgb_strip');
UPDATE public.avatar_items SET decor_style = 'cozy' WHERE slug IN ('office_sofa', 'office_rug', 'office_minibar', 'office_flooring_carpet');
UPDATE public.avatar_items SET decor_style = 'nature' WHERE slug IN ('office_plant', 'office_table_plant', 'office_nature_bonsai', 'office_wallpaper_plants');
UPDATE public.avatar_items SET decor_style = 'tech' WHERE slug IN ('office_monitor', 'office_laptop', 'office_keyboard', 'office_hologram', 'office_robot_helper', 'office_tech_speaker');
UPDATE public.avatar_items SET decor_style = 'minimal' WHERE slug IN ('office_desk', 'office_whiteboard', 'office_flooring_marble', 'office_wall_sconce');

INSERT INTO public.avatar_items
  (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, grid_w, grid_h, description, color_hint, placement_zone, surface_only, decor_style)
VALUES
  ('office_chair_gamer',      'Cadeira Gamer',         'office_item', '🪑',  4,  95,  false, 'rare',   1, 1, 'Cadeira ergonômica RGB.',              '#7c3aed', 'floor',     false, 'gamer'),
  ('office_bed_loft',         'Cama Loft',             'office_item', '🛏️',  9, 220,  false, 'epic',   3, 2, 'Cama loft para canto aconchegante.',     '#a855f7', 'floor',     false, 'cozy'),
  ('office_bookshelf_tall',   'Estante Alta',          'office_item', '📚',  5, 110,  false, 'rare',   1, 3, 'Estante vertical com livros.',          '#b45309', 'floor',     false, 'minimal'),
  ('office_rgb_strip',        'Fita LED RGB',          'office_item', '💡',  6, 140,  false, 'rare',   2, 1, 'Iluminação ambiente gamer.',            '#22d3ee', 'lighting',  false, 'gamer'),
  ('office_floor_lamp',       'Luminária de Piso',     'office_item', '🪔',  3,  75,  false, 'common', 1, 1, 'Luz quente para ambiente cozy.',        '#f59e0b', 'lighting',  false, 'cozy'),
  ('office_wall_sconce',      'Arandela Minimal',      'office_item', '🔆',  4,  65,  false, 'common', 1, 1, 'Luz de parede clean.',                  '#94a3b8', 'lighting',  false, 'minimal'),
  ('office_flooring_wood',    'Piso Madeira Clara',    'office_item', '🪵',  2,  55,  false, 'common', 4, 2, 'Revestimento de madeira para o piso.',  '#b45309', 'flooring',  false, 'cozy'),
  ('office_flooring_marble',  'Piso Mármore',          'office_item', '⬜',  5, 120,  false, 'rare',   4, 2, 'Piso mármore minimalista.',             '#e2e8f0', 'flooring',  false, 'minimal'),
  ('office_flooring_carpet',  'Carpete Macio',         'office_item', '🟫',  3,  70,  false, 'common', 4, 2, 'Carpete aconchegante.',                 '#92400e', 'flooring',  false, 'cozy'),
  ('office_wallpaper_brick',  'Parede Tijolo',         'office_item', '🧱',  2,  50,  false, 'common', 4, 1, 'Painel de tijolo na parede.',           '#b91c1c', 'wallpaper', false, 'cozy'),
  ('office_wallpaper_neon',   'Parede Neon Grid',      'office_item', '🌐',  7, 160,  false, 'epic',   4, 1, 'Padrão neon futurista.',                '#22d3ee', 'wallpaper', false, 'gamer'),
  ('office_wallpaper_plants', 'Parede Verde',          'office_item', '🌿',  4,  85,  false, 'rare',   4, 1, 'Painel com folhagem.',                  '#16a34a', 'wallpaper', false, 'nature'),
  ('office_tech_speaker',     'Caixa de Som',          'office_item', '🔊',  3,  45,  false, 'common', 1, 1, 'Speaker para mesa de trabalho.',        '#334155', 'surface',   true,  'tech'),
  ('office_gamer_headset',    'Headset Gamer',         'office_item', '🎧',  4,  60,  false, 'common', 1, 1, 'Headset para setup gamer.',             '#a855f7', 'surface',   true,  'gamer'),
  ('office_cozy_blanket',     'Manta no Sofá',         'office_item', '🧣',  2,  35,  false, 'common', 2, 1, 'Manta decorativa.',                     '#f472b6', 'floor',     false, 'cozy'),
  ('office_nature_bonsai',    'Bonsai',                'office_item', '🌳',  3,  50,  false, 'common', 1, 1, 'Bonsai para canto zen.',                '#15803d', 'floor',     false, 'nature')
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
  surface_only = EXCLUDED.surface_only,
  decor_style = EXCLUDED.decor_style;

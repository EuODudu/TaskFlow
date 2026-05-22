-- =========================================================
-- Mythic racer-inspired productivity skin
-- =========================================================

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  ('face_productivity_enthusiast', 'Entusiasta da Produtividade', 'face', '🏁', 30, 1200, false, 'mythic', 'Piloto mítico de alta performance, foco e velocidade nas entregas', '#f97316')
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

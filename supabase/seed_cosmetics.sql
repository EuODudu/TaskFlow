-- Cole no SQL Editor do Supabase e execute (Run).
-- Projeto: tjnymhgzvqttophpfghu
-- Compatível com o schema atual (sem color_hint / description).

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity) VALUES
  ('face_default', 'Profissional', 'face', '🧑', 1, 0, true, 'common'),
  ('face_woman', 'Profissional F', 'face', '👩', 1, 0, true, 'common'),
  ('face_smile', 'Sorriso', 'face', '😊', 1, 50, false, 'common'),
  ('face_cool', 'Estiloso', 'face', '😎', 3, 90, false, 'common'),
  ('face_nerd', 'Nerd', 'face', '🤓', 4, 110, false, 'common'),
  ('face_young', 'Jovem Talento', 'face', '👦', 3, 70, false, 'common'),
  ('face_fire', 'Em Chamas', 'face', '🔥', 8, 180, false, 'rare'),
  ('face_star', 'Estrelinha', 'face', '⭐', 9, 190, false, 'rare'),
  ('face_senior', 'Executivo', 'face', '👨‍💼', 4, 90, false, 'common'),
  ('face_crown', 'Realeza', 'face', '👑', 16, 360, false, 'epic'),
  ('face_gossip', 'Fofoqueiro do Setor', 'face', '🗣️', 6, 140, false, 'rare'),
  ('face_hero', 'Super Analista', 'face', '🦸', 5, 120, false, 'rare'),
  ('face_wizard', 'Mago do Código', 'face', '🧙', 8, 150, false, 'rare'),
  ('face_elf', 'Arquiteto', 'face', '🧝', 12, 240, false, 'epic'),
  ('face_robot', 'Cyborg Corp', 'face', '🤖', 15, 320, false, 'epic'),
  ('face_alien', 'Alienígena', 'face', '👽', 18, 420, false, 'epic'),
  ('face_unicorn', 'Lendário', 'face', '🦄', 20, 600, false, 'legendary'),
  ('face_cosmic', 'Guardião Cósmico', 'face', '🌌', 26, 850, false, 'mythic'),
  ('face_ninja', 'Ninja do Foco', 'face', '🥷', 10, 180, false, 'rare'),
  ('face_astronaut', 'Astronauta das Metas', 'face', '🧑‍🚀', 14, 260, false, 'epic'),
  ('face_scientist', 'Cientista Produtivo', 'face', '🧑‍🔬', 9, 150, false, 'rare'),
  ('face_artist', 'Criativo Sprint', 'face', '🎨', 7, 120, false, 'rare'),
  ('face_productivity_enthusiast', 'Entusiasta da Produtividade', 'face', '🏁', 30, 1200, false, 'mythic'),

  ('outfit_default_indigo', 'Roupa Índigo Base', 'outfit', '#6366f1', 1, 0, true, 'common'),
  ('outfit_emerald_base', 'Roupa Esmeralda', 'outfit', '#10b981', 2, 45, false, 'common'),
  ('outfit_rose_base', 'Roupa Rosa', 'outfit', '#ec4899', 2, 45, false, 'common'),
  ('outfit_amber_base', 'Roupa Âmbar', 'outfit', '#f59e0b', 3, 55, false, 'common'),
  ('outfit_red_base', 'Roupa Vermelha', 'outfit', '#ef4444', 3, 55, false, 'common'),
  ('outfit_cyan_base', 'Roupa Ciano', 'outfit', '#06b6d4', 4, 70, false, 'common'),
  ('outfit_slate_base', 'Roupa Slate', 'outfit', '#64748b', 4, 70, false, 'common'),
  ('outfit_violet_base', 'Roupa Violeta', 'outfit', '#8b5cf6', 5, 90, false, 'rare'),
  ('outfit_lime_base', 'Roupa Lima', 'outfit', '#84cc16', 5, 90, false, 'rare'),
  ('outfit_coral_base', 'Roupa Coral', 'outfit', '#fb7185', 6, 110, false, 'rare'),
  ('outfit_focus_black', 'Roupa Foco Noturno', 'outfit', '#0f172a', 6, 90, false, 'common'),
  ('outfit_neon_blue', 'Roupa Neon Azul', 'outfit', '#22d3ee', 8, 130, false, 'rare'),
  ('outfit_royal_purple', 'Roupa Real Violeta', 'outfit', '#7e22ce', 12, 220, false, 'epic'),
  ('outfit_forest_green', 'Roupa Guardião Verde', 'outfit', '#166534', 5, 100, false, 'common'),
  ('outfit_sunset_orange', 'Roupa Sprint Solar', 'outfit', '#f97316', 10, 180, false, 'rare'),
  ('outfit_mythic_pink', 'Roupa Mítica Aurora', 'outfit', '#db2777', 24, 650, false, 'mythic'),
  ('outfit_crimson_exec', 'Roupa Executivo Carmim', 'outfit', '#b91c1c', 9, 160, false, 'rare'),
  ('outfit_gold_elite', 'Roupa Elite Dourada', 'outfit', '#d97706', 18, 360, false, 'epic'),
  ('outfit_ice_focus', 'Roupa Foco Ártico', 'outfit', '#38bdf8', 11, 190, false, 'rare'),
  ('outfit_lavender_calm', 'Roupa Lavanda Zen', 'outfit', '#a78bfa', 4, 85, false, 'common'),
  ('outfit_graphite_ops', 'Roupa Operações Grafite', 'outfit', '#374151', 7, 120, false, 'common'),
  ('outfit_mint_flow', 'Roupa Fluxo Menta', 'outfit', '#2dd4bf', 13, 240, false, 'rare'),
  ('outfit_ocean_deep', 'Roupa Oceano Profundo', 'outfit', '#1e3a8a', 15, 280, false, 'epic'),
  ('outfit_rose_gold', 'Roupa Rose Gold', 'outfit', '#f472b6', 16, 320, false, 'epic'),
  ('outfit_storm_mythic', 'Roupa Tempestade Mítica', 'outfit', '#312e81', 28, 900, false, 'mythic'),

  ('acc_none', 'Sem Acessório', 'accessory', '🚫', 1, 0, true, 'common'),
  ('acc_glasses', 'Óculos de Sol', 'accessory', '🕶️', 1, 25, false, 'common'),
  ('acc_headset', 'Headset Pro', 'accessory', '🎧', 1, 50, false, 'common'),
  ('acc_briefcase', 'Maleta', 'accessory', '💼', 2, 60, false, 'common'),
  ('acc_hat', 'Cartola', 'accessory', '🎩', 5, 90, false, 'rare'),
  ('acc_crown', 'Coroa', 'accessory', '👑', 15, 240, false, 'epic'),
  ('acc_lightning', 'Energia', 'accessory', '⚡', 10, 170, false, 'rare'),
  ('acc_cap', 'Boné de Sprint', 'accessory', '🧢', 2, 45, false, 'common'),
  ('acc_wand', 'Varinha de Automação', 'accessory', '🪄', 11, 180, false, 'rare'),
  ('acc_moon', 'Broche Lunar', 'accessory', '🌙', 8, 140, false, 'rare'),
  ('acc_gem', 'Cristal de XP', 'accessory', '💎', 16, 300, false, 'epic'),
  ('acc_backpack', 'Mochila de Projeto', 'accessory', '🎒', 4, 80, false, 'common'),
  ('acc_scarf', 'Cachecol de Streak', 'accessory', '🧣', 6, 110, false, 'common'),
  ('acc_shield', 'Escudo Anti-Procrastinação', 'accessory', '🛡️', 12, 230, false, 'rare'),
  ('acc_medal', 'Medalha de Produtividade', 'accessory', '🏅', 9, 170, false, 'rare'),
  ('acc_coffee', 'Café de Foco', 'accessory', '☕', 3, 65, false, 'common'),
  ('acc_flower', 'Flor Zen', 'accessory', '🌸', 5, 95, false, 'common'),
  ('acc_book', 'Manual de Hábitos', 'accessory', '📘', 8, 145, false, 'rare'),
  ('acc_compass', 'Bússola de Metas', 'accessory', '🧭', 14, 260, false, 'epic'),
  ('acc_target', 'Alvo de Sprint', 'accessory', '🎯', 10, 190, false, 'rare'),

  ('pet_none', 'Sem Pet', 'pet', '🚫', 1, 0, true, 'common'),
  ('pet_cat', 'Gatinho', 'pet', '🐱', 1, 50, false, 'common'),
  ('pet_dog', 'Cachorrinho', 'pet', '🐶', 1, 50, false, 'common'),
  ('pet_hamster', 'Hamster', 'pet', '🐹', 2, 45, false, 'common'),
  ('pet_fish', 'Peixinho', 'pet', '🐠', 2, 45, false, 'common'),
  ('pet_fox', 'Raposa', 'pet', '🦊', 5, 110, false, 'rare'),
  ('pet_robot', 'Robot Pet', 'pet', '🤖', 12, 240, false, 'epic'),
  ('pet_dragon', 'Dragão', 'pet', '🐲', 20, 650, false, 'legendary')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  unlock_level = EXCLUDED.unlock_level,
  price_coins = EXCLUDED.price_coins,
  is_default = EXCLUDED.is_default,
  rarity = EXCLUDED.rarity;

-- =========================================================
-- Escritório personalizável + móveis da loja
-- =========================================================

CREATE TABLE IF NOT EXISTS public.office_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id   UUID NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  grid_x    INT  NOT NULL,
  grid_y    INT  NOT NULL,
  rotation  INT  NOT NULL DEFAULT 0,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'office_items'
      AND policyname = 'office_items_own'
  ) THEN
    CREATE POLICY "office_items_own" ON public.office_items
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS office_items_user_idx ON public.office_items(user_id);

ALTER TABLE public.avatar_items
  ADD COLUMN IF NOT EXISTS grid_w      INT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS grid_h      INT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS color_hint  TEXT NOT NULL DEFAULT '#94a3b8';

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, grid_w, grid_h, description, color_hint) VALUES
  ('office_desk', 'Mesa Básica', 'office_item', '🪑', 1, 0, true, 'common', 2, 2, 'Mesa de trabalho essencial', '#92400e'),
  ('office_plant', 'Planta', 'office_item', '🪴', 1, 20, false, 'common', 1, 1, 'Planta que traz vida ao ambiente', '#16a34a'),
  ('office_monitor', 'Monitor', 'office_item', '🖥️', 2, 30, false, 'common', 1, 1, 'Monitor de alta resolução', '#1d4ed8'),
  ('office_laptop', 'Notebook', 'office_item', '💻', 3, 50, false, 'common', 1, 1, 'Notebook ultrafino', '#475569'),
  ('office_coffee', 'Cafeteira', 'office_item', '☕', 1, 40, false, 'common', 1, 1, 'Cafeteira para manter o foco', '#92400e'),
  ('office_board', 'Quadro Branco', 'office_item', '📋', 5, 75, false, 'rare', 2, 1, 'Quadro branco para planejamento', '#e5e7eb'),
  ('office_trophy', 'Estante de Troféus', 'office_item', '🏆', 8, 100, false, 'rare', 1, 2, 'Estante cheia de conquistas', '#b45309'),
  ('office_gaming', 'Setup Gamer', 'office_item', '🎮', 12, 200, false, 'epic', 2, 2, 'Setup gamer completo', '#7c3aed'),
  ('office_rocket', 'Foguete Decorativo', 'office_item', '🚀', 15, 300, false, 'epic', 1, 1, 'Foguete decorativo motivacional', '#dc2626'),
  ('office_diamond', 'Diamante Corporativo', 'office_item', '💎', 20, 500, false, 'legendary', 1, 1, 'Diamante corporativo lendário', '#0284c7'),
  ('office_sofa', 'Sofá Executivo', 'office_item', '🛋️', 6, 120, false, 'rare', 3, 1, 'Sofá confortável para reuniões', '#7c3aed'),
  ('office_bookshelf', 'Estante de Livros', 'office_item', '📚', 4, 80, false, 'common', 1, 2, 'Estante com livros técnicos', '#b45309'),
  ('office_whiteboard', 'Lousa Inteligente', 'office_item', '🖊️', 7, 150, false, 'rare', 2, 2, 'Lousa digital interativa', '#1d4ed8'),
  ('office_chandelier', 'Luminária Design', 'office_item', '💡', 3, 60, false, 'common', 1, 1, 'Luminária de design moderno', '#f59e0b'),
  ('office_painting', 'Quadro Motivacional', 'office_item', '🖼️', 2, 40, false, 'common', 1, 1, 'Quadro com frase inspiradora', '#9333ea'),
  ('office_arcade', 'Arcade Retrô', 'office_item', '🕹️', 18, 400, false, 'epic', 1, 2, 'Arcade para pausas produtivas', '#ef4444'),
  ('office_minibar', 'Minibar Corporativo', 'office_item', '🍹', 10, 200, false, 'rare', 1, 1, 'Minibar para reuniões', '#0284c7'),
  ('office_rug', 'Tapete Persa', 'office_item', '🏠', 2, 50, false, 'common', 2, 2, 'Tapete premium que decora o piso', '#b45309'),
  ('office_robot_helper', 'Assistente Robô', 'office_item', '🤖', 22, 600, false, 'legendary', 1, 1, 'Robô assistente pessoal', '#06b6d4'),
  ('office_hologram', 'Mesa Holográfica', 'office_item', '🔮', 25, 800, false, 'mythic', 2, 2, 'Mesa com display holográfico', '#a855f7')
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

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  ('office_theme_classic', 'Clássico Produtivo', 'office_theme', '🏢', 1, 0, true, 'common', 'Visual padrão com parede azul e piso de madeira', '#2563eb'),
  ('office_theme_minimal', 'Minimalista Branco', 'office_theme', '⚪', 2, 90, false, 'common', 'Escritório claro, limpo e moderno', '#64748b'),
  ('office_theme_neon', 'Neon Gamer', 'office_theme', '🌌', 8, 220, false, 'rare', 'Ambiente escuro com luzes neon', '#22d3ee'),
  ('office_theme_nature', 'Natureza Zen', 'office_theme', '🌿', 5, 160, false, 'rare', 'Visual verde, calmo e orgânico', '#16a34a'),
  ('office_theme_luxury', 'Executivo Luxo', 'office_theme', '🥇', 14, 420, false, 'epic', 'Parede amadeirada com detalhes dourados', '#f59e0b'),
  ('office_theme_space', 'Espacial Cósmico', 'office_theme', '🪐', 24, 750, false, 'mythic', 'Escritório cósmico com brilho futurista', '#8b5cf6'),
  ('office_theme_industrial', 'Café Industrial', 'office_theme', '☕', 6, 180, false, 'rare', 'Visual escuro com tons de café e metal', '#f97316'),
  ('office_theme_ocean', 'Oceano Profundo', 'office_theme', '🌊', 10, 260, false, 'rare', 'Ambiente azul profundo com brilho aquático', '#06b6d4'),
  ('office_theme_aurora', 'Aurora Criativa', 'office_theme', '🎨', 16, 480, false, 'epic', 'Visual colorido com luzes de aurora', '#ec4899'),
  ('office_theme_cyber_exec', 'Cyberpunk Executivo', 'office_theme', '🧬', 28, 900, false, 'mythic', 'Escritório futurista com neon corporativo', '#22d3ee')
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

INSERT INTO public.avatar_items (slug, name, category, icon, unlock_level, price_coins, is_default, rarity, description, color_hint) VALUES
  ('face_dragon_exec', 'Executivo Dragão', 'face', '🐉', 18, 520, false, 'legendary', 'Skin lendária com energia dracônica e presença imponente', '#16a34a'),
  ('face_vampire_ceo', 'CEO Vampiro', 'face', '🧛', 14, 360, false, 'epic', 'Visual sombrio, elegante e extremamente exclusivo', '#7f1d1d'),
  ('face_fairy_sprint', 'Fada do Sprint', 'face', '🧚', 11, 280, false, 'epic', 'Skin mágica para acelerar tarefas com leveza', '#ec4899'),
  ('face_ice_overlord', 'Senhor do Gelo', 'face', '🧊', 16, 420, false, 'epic', 'Armadura gelada com brilho tecnológico', '#38bdf8'),
  ('face_wolf_operator', 'Lobo Operacional', 'face', '🐺', 12, 300, false, 'rare', 'Visual feroz para quem caça pendências', '#64748b'),
  ('face_eagle_director', 'Diretor Águia', 'face', '🦅', 13, 320, false, 'rare', 'Skin executiva com foco e visão estratégica', '#b45309'),
  ('face_biohacker', 'Biohacker Corporativo', 'face', '🧬', 20, 620, false, 'legendary', 'Visual futurista com DNA, neon e produtividade extrema', '#14b8a6'),
  ('face_shadow_agent', 'Agente das Sombras', 'face', '🕶️', 10, 260, false, 'rare', 'Skin misteriosa para produtividade silenciosa', '#111827'),
  ('face_diamond_emperor', 'Imperador Diamante', 'face', '💎', 24, 850, false, 'mythic', 'Skin mítica com luxo cristalino e aura premium', '#06b6d4'),
  ('face_saturn_guardian', 'Guardião de Saturno', 'face', '🪐', 28, 980, false, 'mythic', 'Guardião cósmico com energia interplanetária', '#8b5cf6'),
  ('outfit_dragon_scale', 'Armadura Escamas de Dragão', 'outfit', '#14532d', 18, 380, false, 'legendary', 'Roupa lendária verde escura com energia dracônica', '#14532d'),
  ('outfit_vampire_velvet', 'Veludo Vampírico', 'outfit', '#450a0a', 14, 260, false, 'epic', 'Traje escuro de veludo para presença dramática', '#450a0a'),
  ('outfit_fairy_glow', 'Aura de Fada', 'outfit', '#f0abfc', 11, 230, false, 'epic', 'Roupa mágica rosa-lilás com brilho delicado', '#f0abfc'),
  ('outfit_ice_armor', 'Armadura Glacial', 'outfit', '#7dd3fc', 16, 300, false, 'epic', 'Roupa azul cristalina inspirada em gelo futurista', '#7dd3fc'),
  ('outfit_shadow_ops', 'Operações Sombra', 'outfit', '#020617', 10, 210, false, 'rare', 'Traje preto profundo para visual secreto', '#020617'),
  ('outfit_galaxy_royal', 'Galáxia Real', 'outfit', '#581c87', 24, 700, false, 'mythic', 'Roupa mítica roxa com aura espacial', '#581c87'),
  ('outfit_diamond_luxury', 'Luxo Diamante', 'outfit', '#67e8f9', 22, 620, false, 'legendary', 'Roupa cristalina com brilho de diamante', '#67e8f9'),
  ('outfit_toxic_neon', 'Neon Tóxico', 'outfit', '#a3e635', 15, 280, false, 'epic', 'Traje extravagante verde neon para chamar atenção', '#a3e635'),
  ('outfit_lava_king', 'Rei da Lava', 'outfit', '#ea580c', 19, 420, false, 'legendary', 'Roupa vulcânica laranja com impacto visual forte', '#ea580c'),
  ('outfit_cyber_gold', 'Cyber Ouro', 'outfit', '#facc15', 21, 520, false, 'legendary', 'Traje dourado futurista para elite produtiva', '#facc15'),
  ('outfit_hologram_suit', 'Terno Holográfico', 'outfit', '#22d3ee', 26, 760, false, 'mythic', 'Terno holográfico com brilho de tecnologia avançada', '#22d3ee'),
  ('outfit_crimson_royalty', 'Realeza Carmesim', 'outfit', '#be123c', 17, 340, false, 'epic', 'Roupa vermelha nobre e extravagante', '#be123c')
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

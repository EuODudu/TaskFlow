-- =========================================================
-- Progression milestone badges up to level 100
-- =========================================================

INSERT INTO public.badges (slug, name, description, icon, rarity, xp_reward, coins_reward, condition_type, condition_value) VALUES
  ('level_35_legend',      'Lenda Operacional',       'Alcance o nível 35 e entre na progressão avançada', '💎', 'legendary', 600, 300, 'level', 35),
  ('level_50_architect',   'Arquiteto do Foco',       'Alcance o nível 50',                                '🔮', 'legendary', 800, 400, 'level', 50),
  ('level_75_titan',       'Titã da Execução',        'Alcance o nível 75',                                '🐉', 'mythic',    1200, 600, 'level', 75),
  ('level_100_icon',       'Ícone da Produtividade',  'Alcance o nível 100',                               '🌟', 'mythic',    2000, 1000, 'level', 100),
  ('tasks_250',            'Máquina de Entregas',     'Complete 250 tarefas',                              '🏭', 'legendary', 800, 400, 'tasks_completed', 250),
  ('tasks_500',            'Império de Produtividade','Complete 500 tarefas',                              '🏰', 'mythic',    1500, 750, 'tasks_completed', 500),
  ('pomodoro_250',         'Templo do Foco',          'Complete 250 sessões Pomodoro',                      '🛕', 'legendary', 800, 400, 'pomodoro_sessions', 250),
  ('pomodoro_500',         'Mestre Zen Supremo',      'Complete 500 sessões Pomodoro',                      '🧘', 'mythic',    1500, 750, 'pomodoro_sessions', 500),
  ('streak_60',            'Chama Eterna',            'Mantenha 60 dias seguidos de atividade',             '🔥', 'legendary', 900, 450, 'streak_days', 60),
  ('streak_100',           'Constância Imortal',      'Mantenha 100 dias seguidos de atividade',            '♾️', 'mythic',    1800, 900, 'streak_days', 100),
  ('xp_100000',            'Centelha Cósmica',        'Acumule 100.000 XP',                                 '✨', 'legendary', 1000, 500, 'xp_total', 100000),
  ('xp_485600',            'Domínio Total',           'Acumule XP suficiente para o nível 100',             '🌌', 'mythic',    2000, 1000, 'xp_total', 485600)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  rarity = EXCLUDED.rarity,
  xp_reward = EXCLUDED.xp_reward,
  coins_reward = EXCLUDED.coins_reward,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value;

-- Refina nomes e descrições de auras/acessórios já publicados.

UPDATE public.avatar_items
SET name = v.name,
    description = v.description,
    color_hint = v.color_hint
FROM (VALUES
  ('aura_none',    'Sem aura',          'Remove qualquer efeito ao redor do personagem.', '#94a3b8'),
  ('aura_sparkle', 'Aura de foco',      'Partículas douradas leves para um visual concentrado.', '#facc15'),
  ('aura_fire',    'Aura flamejante',   'Chamas suaves com energia de alta produtividade.', '#f97316'),
  ('aura_frost',   'Aura glacial',      'Cristais frios e brilho limpo ao redor do personagem.', '#38bdf8'),
  ('aura_cosmic',  'Aura cósmica',      'Órbitas e estrelas para um efeito espacial premium.', '#8b5cf6'),
  ('aura_neon',    'Aura neon cyber',   'Espiral tecnológica com brilho cibernético.', '#22d3ee'),
  ('aura_rainbow', 'Aura arco-íris',    'Arcos coloridos com acabamento lendário.', '#ec4899'),
  ('acc_wings',    'Asas angelicais',   'Costas: asas grandes com penas luminosas.', '#f8fafc'),
  ('acc_halo',     'Auréola dourada',   'Cabeça: anel dourado com brilho suave.', '#facc15'),
  ('acc_cape',     'Capa de herói',     'Costas: capa ampla com movimento e presença.', '#dc2626'),
  ('acc_drone',    'Drone assistente',  'Mão: drone flutuante com feixes de luz.', '#22d3ee')
) AS v(slug, name, description, color_hint)
WHERE public.avatar_items.slug = v.slug;

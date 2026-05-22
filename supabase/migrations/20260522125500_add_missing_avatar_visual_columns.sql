-- Garante que o editor de personagem consiga salvar o visual 2D no remoto.
ALTER TABLE public.user_avatar
  ADD COLUMN IF NOT EXISTS hair_style      TEXT NOT NULL DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS hair_color      TEXT NOT NULL DEFAULT '#5D3A1A',
  ADD COLUMN IF NOT EXISTS skin_tone       TEXT NOT NULL DEFAULT '#FDBCB4',
  ADD COLUMN IF NOT EXISTS clothes_color   TEXT NOT NULL DEFAULT '#3b82f6';

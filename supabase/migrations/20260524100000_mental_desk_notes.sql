-- Mesa Mental: notas gamificadas no dashboard

CREATE TABLE IF NOT EXISTS public.mental_notes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL DEFAULT 'Nova nota',
  content           TEXT,
  note_type         TEXT NOT NULL DEFAULT 'quick'
    CHECK (note_type IN ('priority', 'idea', 'quick', 'urgent', 'brain_dump')),
  priority          TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  x                 NUMERIC NOT NULL DEFAULT 0,
  y                 NUMERIC NOT NULL DEFAULT 0,
  rotation          NUMERIC NOT NULL DEFAULT 0,
  is_pinned         BOOLEAN NOT NULL DEFAULT false,
  is_completed      BOOLEAN NOT NULL DEFAULT false,
  completed_at      TIMESTAMPTZ,
  converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  archived_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mental_notes_user_active_idx
  ON public.mental_notes (user_id, archived_at, is_completed, updated_at DESC);

ALTER TABLE public.mental_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mental_notes_own" ON public.mental_notes;
CREATE POLICY "mental_notes_own" ON public.mental_notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.mental_notes_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mental_notes_updated_at ON public.mental_notes;
CREATE TRIGGER mental_notes_updated_at
  BEFORE UPDATE ON public.mental_notes
  FOR EACH ROW EXECUTE FUNCTION public.mental_notes_set_updated_at();

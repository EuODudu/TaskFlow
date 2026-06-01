-- Grafo de conhecimento (PKM): nós, arestas e badges

CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT,
  node_type   TEXT NOT NULL DEFAULT 'note'
    CHECK (node_type IN ('note', 'task', 'project', 'process', 'area', 'resource', 'daily', 'template')),
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  task_id     UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  project_id  UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS knowledge_nodes_user_active_idx
  ON public.knowledge_nodes (user_id, archived_at, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id  UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  target_id  UUID NOT NULL REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  edge_type  TEXT NOT NULL DEFAULT 'link'
    CHECK (edge_type IN ('link', 'parent', 'related')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, target_id, edge_type)
);

CREATE INDEX IF NOT EXISTS knowledge_edges_user_idx ON public.knowledge_edges (user_id);
CREATE INDEX IF NOT EXISTS knowledge_edges_source_idx ON public.knowledge_edges (source_id);
CREATE INDEX IF NOT EXISTS knowledge_edges_target_idx ON public.knowledge_edges (target_id);

ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knowledge_nodes_own" ON public.knowledge_nodes;
CREATE POLICY "knowledge_nodes_own" ON public.knowledge_nodes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "knowledge_edges_own" ON public.knowledge_edges;
CREATE POLICY "knowledge_edges_own" ON public.knowledge_edges
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.knowledge_nodes_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS knowledge_nodes_updated_at ON public.knowledge_nodes;
CREATE TRIGGER knowledge_nodes_updated_at
  BEFORE UPDATE ON public.knowledge_nodes
  FOR EACH ROW EXECUTE FUNCTION public.knowledge_nodes_set_updated_at();

INSERT INTO public.badges (slug, name, description, icon, rarity, xp_reward, coins_reward, condition_type, condition_value)
VALUES
  ('knowledge_notes_5',  'Arquivista',   'Crie 5 notas de conhecimento',        '📚', 'common',  40,  20, 'knowledge_notes',  5),
  ('knowledge_notes_25', 'Bibliotecário','Crie 25 notas de conhecimento',       '📖', 'rare',   120,  60, 'knowledge_notes', 25),
  ('knowledge_links_10', 'Conector',     'Estabeleça 10 links entre notas',     '🔗', 'common',  50,  25, 'knowledge_links', 10),
  ('knowledge_links_50', 'Tecelão',      'Estabeleça 50 links entre notas',     '🕸️', 'epic',   200, 100, 'knowledge_links', 50)
ON CONFLICT (slug) DO NOTHING;

-- Ranking global: posição real, desempate estável e inclusão do usuário atual fora do top 50.

DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  xp INT,
  coins INT,
  streak_days INT,
  tasks_completed INT,
  rank_position INT,
  total_users INT,
  face_emoji TEXT,
  bg_color TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH task_counts AS (
    SELECT
      t.owner_id,
      COUNT(*)::INT AS tasks_completed
    FROM public.tasks AS t
    WHERE t.status = 'done'
      AND t.archived_at IS NULL
    GROUP BY t.owner_id
  ),
  ranked AS (
    SELECT
      p.id,
      p.full_name,
      p.avatar_url,
      p.xp,
      p.coins,
      p.streak_days,
      COALESCE(tc.tasks_completed, 0)::INT AS tasks_completed,
      ROW_NUMBER() OVER (
        ORDER BY p.xp DESC, p.streak_days DESC, p.coins DESC, p.updated_at ASC, p.id ASC
      )::INT AS rank_position,
      COUNT(*) OVER ()::INT AS total_users,
      COALESCE(ua.face_emoji, '🧑') AS face_emoji,
      COALESCE(ua.bg_color, '#6366f1') AS bg_color
    FROM public.profiles AS p
    LEFT JOIN public.user_avatar AS ua ON ua.user_id = p.id
    LEFT JOIN task_counts AS tc ON tc.owner_id = p.id
  )
  SELECT
    r.id,
    r.full_name,
    r.avatar_url,
    r.xp,
    r.coins,
    r.streak_days,
    r.tasks_completed,
    r.rank_position,
    r.total_users,
    r.face_emoji,
    r.bg_color
  FROM ranked AS r
  WHERE r.rank_position <= 50
     OR r.id = auth.uid()
  ORDER BY r.rank_position ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

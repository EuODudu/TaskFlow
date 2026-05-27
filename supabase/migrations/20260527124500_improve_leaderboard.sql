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
  bg_color TEXT,
  accessory_emoji TEXT,
  pet_emoji TEXT,
  skin_tone TEXT,
  hair_color TEXT,
  hair_style TEXT,
  clothes_color TEXT,
  accessory_head TEXT,
  accessory_face TEXT,
  accessory_back TEXT,
  accessory_hand TEXT,
  accessory_chest TEXT,
  aura_emoji TEXT,
  pose TEXT
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
      COALESCE(ua.bg_color, '#6366f1') AS bg_color,
      ua.accessory_emoji,
      ua.pet_emoji,
      ua.skin_tone,
      ua.hair_color,
      ua.hair_style,
      ua.clothes_color,
      ua.accessory_head,
      ua.accessory_face,
      ua.accessory_back,
      ua.accessory_hand,
      ua.accessory_chest,
      ua.aura_emoji,
      COALESCE(ua.pose, 'idle') AS pose
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
    r.bg_color,
    r.accessory_emoji,
    r.pet_emoji,
    r.skin_tone,
    r.hair_color,
    r.hair_style,
    r.clothes_color,
    r.accessory_head,
    r.accessory_face,
    r.accessory_back,
    r.accessory_hand,
    r.accessory_chest,
    r.aura_emoji,
    r.pose
  FROM ranked AS r
  WHERE r.rank_position <= 50
     OR r.id = auth.uid()
  ORDER BY r.rank_position ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

-- Add default_status to board_columns so inferStatus reads from DB instead of column name
ALTER TABLE public.board_columns
  ADD COLUMN default_status public.task_status NOT NULL DEFAULT 'todo';

-- Backfill existing rows based on column name heuristics
UPDATE public.board_columns SET default_status =
  CASE
    WHEN lower(name) LIKE '%conclu%' OR lower(name) LIKE '%done%'       THEN 'done'::public.task_status
    WHEN lower(name) LIKE '%revis%'  OR lower(name) LIKE '%review%'     THEN 'in_review'::public.task_status
    WHEN lower(name) LIKE '%andamento%' OR lower(name) LIKE '%progress%'
      OR lower(name) LIKE '%doing%'                                       THEN 'in_progress'::public.task_status
    WHEN lower(name) LIKE '%backlog%'                                    THEN 'backlog'::public.task_status
    ELSE 'todo'::public.task_status
  END;

-- Update handle_new_user to set correct default_status for default columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_project_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.projects (owner_id, name, color, icon, position)
  VALUES (new.id, 'Pessoal', '#6366f1', 'sparkles', 0)
  RETURNING id INTO new_project_id;

  INSERT INTO public.board_columns (project_id, name, position, color, default_status) VALUES
    (new_project_id, 'Backlog',      0, '#94a3b8', 'backlog'),
    (new_project_id, 'A Fazer',      1, '#3b82f6', 'todo'),
    (new_project_id, 'Em Andamento', 2, '#f59e0b', 'in_progress'),
    (new_project_id, 'Em Revisão',   3, '#a855f7', 'in_review'),
    (new_project_id, 'Concluído',    4, '#10b981', 'done');

  RETURN new;
END;
$$;

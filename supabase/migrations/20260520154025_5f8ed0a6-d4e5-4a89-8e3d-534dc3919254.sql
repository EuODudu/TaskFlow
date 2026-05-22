-- =========== Enums ===========
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.task_status as enum ('todo', 'in_progress', 'in_review', 'done', 'backlog');
create type public.calendar_event_type as enum ('task', 'meeting', 'event', 'reminder');
create type public.pomodoro_kind as enum ('focus', 'short_break', 'long_break');

-- =========== Profiles ===========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  theme text not null default 'system',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- =========== Projects ===========
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  icon text not null default 'folder',
  is_favorite boolean not null default false,
  archived_at timestamptz,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "projects_all_own" on public.projects for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create index projects_owner_idx on public.projects(owner_id);

-- =========== Board columns ===========
create table public.board_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  position int not null default 0,
  color text not null default '#94a3b8',
  created_at timestamptz not null default now()
);
alter table public.board_columns enable row level security;
create policy "board_columns_all_own" on public.board_columns for all
  using (exists(select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists(select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create index board_columns_project_idx on public.board_columns(project_id);

-- =========== Tags ===========
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#64748b',
  created_at timestamptz not null default now(),
  unique(owner_id, name)
);
alter table public.tags enable row level security;
create policy "tags_all_own" on public.tags for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- =========== Tasks ===========
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  column_id uuid references public.board_columns(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'todo',
  due_date timestamptz,
  estimated_minutes int,
  position int not null default 0,
  is_favorite boolean not null default false,
  archived_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "tasks_all_own" on public.tasks for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create index tasks_owner_idx on public.tasks(owner_id);
create index tasks_project_idx on public.tasks(project_id);
create index tasks_column_idx on public.tasks(column_id);
create index tasks_parent_idx on public.tasks(parent_task_id);

-- =========== Task tags ===========
create table public.task_tags (
  task_id uuid not null references public.tasks(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (task_id, tag_id)
);
alter table public.task_tags enable row level security;
create policy "task_tags_all_own" on public.task_tags for all
  using (exists(select 1 from public.tasks t where t.id = task_id and t.owner_id = auth.uid()))
  with check (exists(select 1 from public.tasks t where t.id = task_id and t.owner_id = auth.uid()));

-- =========== Checklist items ===========
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  content text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.checklist_items enable row level security;
create policy "checklist_items_all_own" on public.checklist_items for all
  using (exists(select 1 from public.tasks t where t.id = task_id and t.owner_id = auth.uid()))
  with check (exists(select 1 from public.tasks t where t.id = task_id and t.owner_id = auth.uid()));
create index checklist_task_idx on public.checklist_items(task_id);

-- =========== Task activity ===========
create table public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.task_activity enable row level security;
create policy "task_activity_select_own" on public.task_activity for select
  using (exists(select 1 from public.tasks t where t.id = task_id and t.owner_id = auth.uid()));
create policy "task_activity_insert_own" on public.task_activity for insert
  with check (exists(select 1 from public.tasks t where t.id = task_id and t.owner_id = auth.uid()));
create index task_activity_task_idx on public.task_activity(task_id, created_at desc);

-- =========== Calendar events ===========
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type public.calendar_event_type not null default 'event',
  recurrence_rule text,
  location text,
  notes text,
  color text,
  all_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.calendar_events enable row level security;
create policy "calendar_events_all_own" on public.calendar_events for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create index calendar_events_owner_idx on public.calendar_events(owner_id, starts_at);

-- =========== Pomodoro sessions ===========
create table public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int not null default 0,
  kind public.pomodoro_kind not null default 'focus',
  created_at timestamptz not null default now()
);
alter table public.pomodoro_sessions enable row level security;
create policy "pomodoro_all_own" on public.pomodoro_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index pomodoro_user_idx on public.pomodoro_sessions(user_id, started_at desc);

-- =========== updated_at trigger ===========
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger calendar_events_set_updated_at before update on public.calendar_events for each row execute function public.set_updated_at();

-- =========== completed_at trigger on tasks ===========
create or replace function public.tasks_set_completed_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done') then
    new.completed_at = now();
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;
create trigger tasks_completed_at before update on public.tasks for each row execute function public.tasks_set_completed_at();

-- =========== handle_new_user: profile + default project + default columns ===========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_project_id uuid;
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url');

  insert into public.projects (owner_id, name, color, icon, position)
  values (new.id, 'Pessoal', '#6366f1', 'sparkles', 0)
  returning id into new_project_id;

  insert into public.board_columns (project_id, name, position, color) values
    (new_project_id, 'Backlog',      0, '#94a3b8'),
    (new_project_id, 'A Fazer',      1, '#3b82f6'),
    (new_project_id, 'Em Andamento', 2, '#f59e0b'),
    (new_project_id, 'Em Revisão',   3, '#a855f7'),
    (new_project_id, 'Concluído',    4, '#10b981');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
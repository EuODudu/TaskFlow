-- ============================================================
-- Orbit Productivity — Schema completo
-- Cole no SQL Editor do Supabase e execute
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
create type public.calendar_event_type as enum ('task','meeting','event','reminder');
create type public.pomodoro_kind       as enum ('focus','short_break','long_break');
create type public.task_priority       as enum ('low','medium','high','urgent');
create type public.task_status         as enum ('todo','in_progress','in_review','done','backlog');

-- ── profiles ─────────────────────────────────────────────────
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text,
  avatar_url       text,
  theme            text    not null default 'system',
  preferences      jsonb   not null default '{}',
  xp               integer not null default 0,
  coins            integer not null default 0,
  streak_days      integer not null default 0,
  last_active_date date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles: own row" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── user_avatar ───────────────────────────────────────────────
create table public.user_avatar (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  face_emoji       text        not null default '😊',
  bg_color         text        not null default '#6366f1',
  accessory_emoji  text,
  pet_emoji        text,
  updated_at       timestamptz not null default now()
);
alter table public.user_avatar enable row level security;
create policy "user_avatar: own row" on public.user_avatar
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── projects ─────────────────────────────────────────────────
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#6366f1',
  icon        text not null default '📁',
  position    integer not null default 0,
  is_favorite boolean not null default false,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "projects: own rows" on public.projects
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ── board_columns ─────────────────────────────────────────────
create table public.board_columns (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  name           text not null,
  color          text not null default '#6366f1',
  position       integer not null default 0,
  default_status public.task_status not null default 'todo',
  created_at     timestamptz not null default now()
);
alter table public.board_columns enable row level security;
create policy "board_columns: via project owner" on public.board_columns
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- ── tasks ─────────────────────────────────────────────────────
create table public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  owner_id           uuid not null references auth.users(id) on delete cascade,
  column_id          uuid references public.board_columns(id) on delete set null,
  parent_task_id     uuid references public.tasks(id) on delete cascade,
  title              text not null,
  description        text,
  status             public.task_status    not null default 'todo',
  priority           public.task_priority  not null default 'medium',
  position           integer not null default 0,
  due_date           date,
  estimated_minutes  integer,
  is_favorite        boolean not null default false,
  completed_at       timestamptz,
  archived_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "tasks: own rows" on public.tasks
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ── checklist_items ───────────────────────────────────────────
create table public.checklist_items (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  content    text not null,
  done       boolean not null default false,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.checklist_items enable row level security;
create policy "checklist_items: via task owner" on public.checklist_items
  using (exists (select 1 from public.tasks t where t.id = task_id and t.owner_id = auth.uid()));

-- ── task_activity ─────────────────────────────────────────────
create table public.task_activity (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  actor_id   uuid references auth.users(id) on delete set null,
  action     text not null,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.task_activity enable row level security;
create policy "task_activity: via task owner" on public.task_activity
  using (exists (select 1 from public.tasks t where t.id = task_id and t.owner_id = auth.uid()));

-- ── tags ──────────────────────────────────────────────────────
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#6366f1',
  created_at timestamptz not null default now()
);
alter table public.tags enable row level security;
create policy "tags: own rows" on public.tags
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ── task_tags ─────────────────────────────────────────────────
create table public.task_tags (
  task_id uuid not null references public.tasks(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (task_id, tag_id)
);
alter table public.task_tags enable row level security;
create policy "task_tags: via task owner" on public.task_tags
  using (exists (select 1 from public.tasks t where t.id = task_id and t.owner_id = auth.uid()));

-- ── calendar_events ───────────────────────────────────────────
create table public.calendar_events (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  task_id          uuid references public.tasks(id) on delete set null,
  title            text not null,
  type             public.calendar_event_type not null default 'event',
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  all_day          boolean not null default false,
  color            text,
  location         text,
  notes            text,
  recurrence_rule  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.calendar_events enable row level security;
create policy "calendar_events: own rows" on public.calendar_events
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ── pomodoro_sessions ─────────────────────────────────────────
create table public.pomodoro_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  task_id          uuid references public.tasks(id) on delete set null,
  kind             public.pomodoro_kind not null default 'focus',
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_seconds integer not null default 1500,
  created_at       timestamptz not null default now()
);
alter table public.pomodoro_sessions enable row level security;
create policy "pomodoro_sessions: own rows" on public.pomodoro_sessions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Gamificação ───────────────────────────────────────────────

-- xp_events
create table public.xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  task_id    uuid references public.tasks(id) on delete set null,
  amount     integer not null,
  reason     text not null,
  created_at timestamptz not null default now()
);
alter table public.xp_events enable row level security;
create policy "xp_events: own rows" on public.xp_events
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- badges
create table public.badges (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text not null,
  icon            text not null default '🏅',
  rarity          text not null default 'common',
  xp_reward       integer not null default 0,
  coins_reward    integer not null default 0,
  condition_type  text not null,
  condition_value integer not null default 1
);
alter table public.badges enable row level security;
create policy "badges: read all" on public.badges for select using (true);

-- user_badges
create table public.user_badges (
  user_id   uuid not null references auth.users(id) on delete cascade,
  badge_id  uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
alter table public.user_badges enable row level security;
create policy "user_badges: own rows" on public.user_badges
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- avatar_items
create table public.avatar_items (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  category     text not null,
  icon         text not null default '😊',
  bg_color     text,
  rarity       text not null default 'common',
  price_coins  integer not null default 0,
  unlock_level integer not null default 1,
  is_default   boolean not null default false
);
alter table public.avatar_items enable row level security;
create policy "avatar_items: read all" on public.avatar_items for select using (true);

-- user_inventory
create table public.user_inventory (
  user_id      uuid not null references auth.users(id) on delete cascade,
  item_id      uuid not null references public.avatar_items(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.user_inventory enable row level security;
create policy "user_inventory: own rows" on public.user_inventory
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Trigger: XP ao completar tarefa ──────────────────────────
create or replace function public.award_xp_on_task_done()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done') then
    -- XP base
    insert into public.xp_events (user_id, task_id, amount, reason)
    values (new.owner_id, new.id, 50, 'task_completed');
    update public.profiles set xp = xp + 50, coins = coins + 10, updated_at = now()
    where id = new.owner_id;
    -- Bônus antecipado
    if new.due_date is not null and new.due_date >= current_date then
      insert into public.xp_events (user_id, task_id, amount, reason)
      values (new.owner_id, new.id, 25, 'task_early');
      update public.profiles set xp = xp + 25, coins = coins + 5, updated_at = now()
      where id = new.owner_id;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_award_xp_task_done
  after update on public.tasks
  for each row execute procedure public.award_xp_on_task_done();

-- ── Trigger: XP ao registrar pomodoro ────────────────────────
create or replace function public.award_xp_on_pomodoro()
returns trigger language plpgsql security definer as $$
begin
  if new.kind = 'focus' then
    insert into public.xp_events (user_id, amount, reason)
    values (new.user_id, 10, 'pomodoro_session');
    update public.profiles set xp = xp + 10, coins = coins + 2, updated_at = now()
    where id = new.user_id;
  end if;
  return new;
end;
$$;
create trigger trg_award_xp_pomodoro
  after insert on public.pomodoro_sessions
  for each row execute procedure public.award_xp_on_pomodoro();

-- ── Seed: badges ──────────────────────────────────────────────
insert into public.badges (slug, name, description, icon, rarity, xp_reward, coins_reward, condition_type, condition_value) values
  ('first_task',        'Primeira Tarefa',        'Concluiu sua primeira tarefa',              '✅', 'common',    50,  10,  'tasks_done',      1),
  ('task_5',            '5 Tarefas',              'Concluiu 5 tarefas',                        '🎯', 'common',    100, 20,  'tasks_done',      5),
  ('task_25',           '25 Tarefas',             'Concluiu 25 tarefas',                       '💪', 'rare',      250, 50,  'tasks_done',      25),
  ('task_100',          '100 Tarefas',            'Concluiu 100 tarefas',                      '🏆', 'epic',      500, 100, 'tasks_done',      100),
  ('task_500',          '500 Tarefas',            'Concluiu 500 tarefas',                      '👑', 'legendary', 1000,200, 'tasks_done',      500),
  ('first_pomodoro',    'Primeiro Foco',          'Completou seu primeiro Pomodoro',           '🍅', 'common',    50,  10,  'pomodoros_done',  1),
  ('pomodoro_10',       '10 Pomodoros',           'Completou 10 sessões de foco',              '⏱️', 'common',    100, 20,  'pomodoros_done',  10),
  ('pomodoro_50',       '50 Pomodoros',           'Completou 50 sessões de foco',              '🔥', 'rare',      250, 50,  'pomodoros_done',  50),
  ('pomodoro_200',      '200 Pomodoros',          'Completou 200 sessões de foco',             '⚡', 'epic',      500, 100, 'pomodoros_done',  200),
  ('streak_3',          'Sequência de 3 dias',    'Usou o app 3 dias seguidos',                '📅', 'common',    75,  15,  'streak_days',     3),
  ('streak_7',          'Uma semana seguida',     'Usou o app 7 dias seguidos',                '🌟', 'rare',      200, 40,  'streak_days',     7),
  ('streak_30',         'Um mês seguido',         'Usou o app 30 dias seguidos',               '💎', 'epic',      500, 100, 'streak_days',     30),
  ('streak_100',        '100 dias seguidos',      'Usou o app 100 dias seguidos',              '🔮', 'legendary', 1000,200, 'streak_days',     100),
  ('level_5',           'Nível 5',                'Atingiu o nível 5',                         '🎖️', 'common',    100, 20,  'level_reached',   5),
  ('level_10',          'Nível 10',               'Atingiu o nível 10',                        '🏅', 'rare',      300, 60,  'level_reached',   10),
  ('level_20',          'Nível 20',               'Atingiu o nível 20',                        '🎗️', 'epic',      600, 120, 'level_reached',   20),
  ('level_30',          'Mestre Absoluto',        'Atingiu o nível máximo',                    '🌈', 'legendary', 2000,400, 'level_reached',   30),
  ('early_bird',        'Adiantado',              'Concluiu uma tarefa antes do prazo',        '🐦', 'common',    75,  15,  'tasks_early',     1);

-- ── Seed: avatar_items ────────────────────────────────────────
insert into public.avatar_items (slug, name, category, icon, rarity, price_coins, unlock_level, is_default) values
  ('face_smile',      'Sorriso',        'face',      '😊', 'common',    0,   1,  true),
  ('face_cool',       'Estiloso',       'face',      '😎', 'common',    50,  1,  false),
  ('face_nerd',       'Nerd',           'face',      '🤓', 'common',    50,  1,  false),
  ('face_star',       'Estrelinha',     'face',      '🤩', 'rare',      150, 5,  false),
  ('face_fire',       'Em chamas',      'face',      '🥵', 'rare',      150, 5,  false),
  ('face_robot',      'Robô',           'face',      '🤖', 'epic',      300, 10, false),
  ('face_alien',      'Alienígena',     'face',      '👽', 'epic',      300, 10, false),
  ('face_crown',      'Realeza',        'face',      '🫅', 'legendary', 600, 20, false),
  ('acc_glasses',     'Óculos',         'accessory', '👓', 'common',    80,  3,  false),
  ('acc_hat',         'Chapéu',         'accessory', '🎩', 'rare',      180, 7,  false),
  ('acc_crown',       'Coroa',          'accessory', '👑', 'epic',      350, 15, false),
  ('acc_halo',        'Halo',           'accessory', '😇', 'legendary', 700, 25, false),
  ('pet_cat',         'Gatinho',        'pet',       '🐱', 'common',    100, 2,  false),
  ('pet_dog',         'Cachorrinho',    'pet',       '🐶', 'common',    100, 2,  false),
  ('pet_dragon',      'Dragão',         'pet',       '🐲', 'rare',      250, 8,  false),
  ('pet_unicorn',     'Unicórnio',      'pet',       '🦄', 'epic',      400, 15, false),
  ('pet_phoenix',     'Fênix',          'pet',       '🦅', 'legendary', 800, 28, false);

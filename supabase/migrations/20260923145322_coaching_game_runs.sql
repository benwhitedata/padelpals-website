-- Feedback on the warm-up or mini game used in a session.
-- Effectiveness and popularity are shared with other coaches.
-- lesson_run_id ties a row to the lesson log that created it. Deleting the
-- lesson log keeps the game feedback, so the games library still has it.

create table coaching.game_runs (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references coaching.games (id) on delete cascade,
  coach_id uuid not null default auth.uid(),
  lesson_run_id uuid references coaching.lesson_runs (id) on delete set null,
  run_on date not null default current_date,
  group_label text,
  effectiveness smallint,
  popularity smallint,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_runs_effectiveness_check check (effectiveness is null or (effectiveness between 1 and 5)),
  constraint game_runs_popularity_check check (popularity is null or (popularity between 1 and 5)),
  constraint game_runs_comment_len check (comment is null or char_length(comment) <= 1000),
  constraint game_runs_group_len check (group_label is null or char_length(group_label) <= 80),
  constraint game_runs_has_feedback check (
    effectiveness is not null or popularity is not null or comment is not null
  )
);

comment on table coaching.game_runs is
  'One row each time a coach rates a warm-up or mini game. Readable by every coach.';
comment on column coaching.game_runs.effectiveness is 'Optional 1 to 5: did the game do its job.';
comment on column coaching.game_runs.popularity is 'Optional 1 to 5: how much the players enjoyed it.';
comment on column coaching.game_runs.lesson_run_id is
  'Set when the rating was saved from a lesson log. Null when logged on the game page.';

create unique index game_runs_once_per_day
  on coaching.game_runs (game_id, coach_id, run_on, (coalesce(group_label, '')));

create index game_runs_by_game on coaching.game_runs (game_id);

create trigger game_runs_touch
  before update on coaching.game_runs
  for each row
  execute function coaching.touch_lesson_run();

alter table coaching.game_runs enable row level security;

create policy coaches_read_game_runs
  on coaching.game_runs
  for select
  to authenticated
  using (coaching.is_coach());

create policy coaches_insert_own_game_runs
  on coaching.game_runs
  for insert
  to authenticated
  with check (coaching.is_coach() and coach_id = auth.uid());

create policy coaches_update_own_game_runs
  on coaching.game_runs
  for update
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid() and coaching.is_coach());

create policy coaches_delete_own_game_runs
  on coaching.game_runs
  for delete
  to authenticated
  using (coach_id = auth.uid());

grant select, insert, update, delete on table coaching.game_runs to authenticated;
grant all on table coaching.game_runs to postgres, service_role;

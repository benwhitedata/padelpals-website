-- Coaches log each time they run a lesson. Scores and comments are shared
-- with other coaches. Private notes live in their own table so row-level
-- security can hide them: Postgres cannot hide a single column.

create or replace function coaching.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_coach from public.user_profiles where id = auth.uid()),
    false
  );
$$;

comment on function coaching.is_coach() is
  'True when the signed-in account has user_profiles.is_coach. Used by lesson run policies.';

revoke all on function coaching.is_coach() from public;
grant execute on function coaching.is_coach() to authenticated;

create table coaching.lesson_runs (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references coaching.lessons (id) on delete cascade,
  coach_id uuid not null default auth.uid(),
  run_on date not null default current_date,
  mode text not null default 'drill',
  group_label text,
  rating smallint,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_runs_mode_check check (mode in ('drill', 'coaching')),
  constraint lesson_runs_rating_check check (rating is null or (rating between 1 and 5)),
  constraint lesson_runs_comment_len check (comment is null or char_length(comment) <= 1000),
  constraint lesson_runs_group_len check (group_label is null or char_length(group_label) <= 80)
);

comment on table coaching.lesson_runs is
  'One row each time a coach runs a published lesson. Readable by every coach.';
comment on column coaching.lesson_runs.mode is 'drill or coaching, matching the page the coach was on.';
comment on column coaching.lesson_runs.group_label is 'The group the coach ran it with, e.g. Beginner / Improver.';
comment on column coaching.lesson_runs.rating is 'Optional 1 to 5: how well the session landed.';
comment on column coaching.lesson_runs.comment is 'Optional feedback other coaches can read. Max 1000 characters.';

create unique index lesson_runs_once_per_day
  on coaching.lesson_runs (lesson_id, coach_id, run_on, (coalesce(group_label, '')));

create table coaching.lesson_run_notes (
  run_id uuid primary key references coaching.lesson_runs (id) on delete cascade,
  coach_id uuid not null default auth.uid(),
  note text not null,
  constraint lesson_run_notes_len check (char_length(note) between 1 and 1000)
);

comment on table coaching.lesson_run_notes is
  'Private note for a run. Separate table so other coaches cannot read it.';

create or replace function coaching.touch_lesson_run()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lesson_runs_touch
  before update on coaching.lesson_runs
  for each row
  execute function coaching.touch_lesson_run();

alter table coaching.lesson_runs enable row level security;
alter table coaching.lesson_run_notes enable row level security;

create policy coaches_read_lesson_runs
  on coaching.lesson_runs
  for select
  to authenticated
  using (coaching.is_coach());

create policy coaches_insert_own_lesson_runs
  on coaching.lesson_runs
  for insert
  to authenticated
  with check (coaching.is_coach() and coach_id = auth.uid());

create policy coaches_update_own_lesson_runs
  on coaching.lesson_runs
  for update
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid() and coaching.is_coach());

create policy coaches_delete_own_lesson_runs
  on coaching.lesson_runs
  for delete
  to authenticated
  using (coach_id = auth.uid());

create policy owner_read_lesson_run_notes
  on coaching.lesson_run_notes
  for select
  to authenticated
  using (coach_id = auth.uid());

create policy owner_insert_lesson_run_notes
  on coaching.lesson_run_notes
  for insert
  to authenticated
  with check (
    coach_id = auth.uid()
    and exists (
      select 1
      from coaching.lesson_runs r
      where r.id = lesson_run_notes.run_id
        and r.coach_id = auth.uid()
    )
  );

create policy owner_update_lesson_run_notes
  on coaching.lesson_run_notes
  for update
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy owner_delete_lesson_run_notes
  on coaching.lesson_run_notes
  for delete
  to authenticated
  using (coach_id = auth.uid());

grant select, insert, update, delete on table coaching.lesson_runs to authenticated;
grant select, insert, update, delete on table coaching.lesson_run_notes to authenticated;
grant all on table coaching.lesson_runs to postgres, service_role;
grant all on table coaching.lesson_run_notes to postgres, service_role;

-- Game feedback matches the lesson log: one score, a shared comment,
-- and a private note in its own table. It is not part of logging a lesson.

alter table coaching.game_runs
  drop constraint game_runs_has_feedback,
  drop constraint game_runs_effectiveness_check,
  drop constraint game_runs_popularity_check;

alter table coaching.game_runs
  drop column effectiveness,
  drop column popularity,
  drop column lesson_run_id,
  add column rating smallint,
  add constraint game_runs_rating_check check (rating is null or (rating between 1 and 5));

comment on table coaching.game_runs is
  'One row each time a coach logs a warm-up or mini game. Readable by every coach.';
comment on column coaching.game_runs.rating is 'Optional 1 to 5: how well the game landed.';

create table coaching.game_run_notes (
  run_id uuid primary key references coaching.game_runs (id) on delete cascade,
  coach_id uuid not null default auth.uid(),
  note text not null,
  constraint game_run_notes_len check (char_length(note) between 1 and 1000)
);

comment on table coaching.game_run_notes is
  'Private note for a game log. Separate table so other coaches cannot read it.';

alter table coaching.game_run_notes enable row level security;

create policy owner_read_game_run_notes
  on coaching.game_run_notes
  for select
  to authenticated
  using (coach_id = auth.uid());

create policy owner_insert_game_run_notes
  on coaching.game_run_notes
  for insert
  to authenticated
  with check (
    coach_id = auth.uid()
    and exists (
      select 1
      from coaching.game_runs r
      where r.id = game_run_notes.run_id
        and r.coach_id = auth.uid()
    )
  );

create policy owner_update_game_run_notes
  on coaching.game_run_notes
  for update
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy owner_delete_game_run_notes
  on coaching.game_run_notes
  for delete
  to authenticated
  using (coach_id = auth.uid());

grant select, insert, update, delete on table coaching.game_run_notes to authenticated;
grant all on table coaching.game_run_notes to postgres, service_role;

-- Shared 60-minute spines; weekly lessons are thin overlays (step_details).
-- Run-sheet merge happens in the website renderer. This view is documentation + join helper.

create table coaching.spines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  audience text,
  duration_min integer not null default 60,
  group_size_max integer not null default 8,
  steps jsonb not null,
  created_at timestamptz not null default now(),
  constraint spines_steps_is_array check (jsonb_typeof(steps) = 'array')
);

comment on table coaching.spines is
  'Shared timed hour. A handful of rows (sunday-drill, intro-padel). Weekly copy lives on coaching.lessons.';

insert into coaching.spines (slug, title, audience, duration_min, group_size_max, steps)
values
(
  'sunday-drill',
  'Sunday drill hour',
  null,
  60,
  8,
  $json$[
    {"from":"0","to":"5","label":"Name the focus","default_detail":"One sentence, out loud, twice."},
    {"from":"5","to":"12","label":"Warm up with a ball","default_detail":"Moving, cooperative rally, group target. No standing still."},
    {"from":"12","to":"17","label":"Demo","default_detail":"One point. Show and tell. Hit three. Check they got it."},
    {"from":"17","to":"32","label":"Closed","default_detail":"Fed and predictable. High volume. Nobody waits over 30 seconds."},
    {"from":"32","to":"48","label":"Open","default_detail":"Live ball, same focus. STEP to differentiate, do not split them."},
    {"from":"48","to":"58","label":"Conditioned game","default_detail":"Points only score if the focus was used."},
    {"from":"58","to":"60","label":"Close","default_detail":"Restate the focus. Next week. One paid session and where to book."}
  ]$json$::jsonb
),
(
  'intro-padel',
  'Intro to Padel hour',
  'Intro to Padel',
  60,
  8,
  $json$[
    {"from":"0","to":"5","label":"Name the focus","default_detail":"One sentence, out loud, twice."},
    {"from":"5","to":"12","label":"Warm up with a ball","default_detail":"Moving warm-up with a ball. No standing still."},
    {"from":"12","to":"17","label":"Demo","default_detail":"One point. Show and tell. Hit three. Check they got it."},
    {"from":"17","to":"25","label":"Flavour","default_detail":"This week's extra flavour. One shot or one situation, then back to the spine."},
    {"from":"25","to":"38","label":"Closed","default_detail":"Fed and predictable. High volume. Nobody waits over 30 seconds."},
    {"from":"38","to":"50","label":"Open","default_detail":"Live ball, same focus. STEP to differentiate, do not split them."},
    {"from":"50","to":"58","label":"Conditioned game","default_detail":"Points only score if the focus was used."},
    {"from":"58","to":"60","label":"Close","default_detail":"Restate the focus. One paid session and where to book."}
  ]$json$::jsonb
);

alter table coaching.lessons
  add column spine_id uuid references coaching.spines (id),
  add column step_details jsonb;

comment on column coaching.lessons.spine_id is 'Required spine. Times and labels come from coaching.spines, not a copied run_sheet.';
comment on column coaching.lessons.step_details is
  'Optional overlay keyed by step label (Demo, Closed, Conditioned game, Close, Flavour). Only lines that differ from the spine.';
comment on column coaching.lessons.run_sheet is
  'Deprecated. Prefer spine + step_details. Nullable; website composes the hour in JS.';

alter table coaching.lessons
  alter column run_sheet drop not null;

update coaching.lessons l
set
  spine_id = (select s.id from coaching.spines s where s.slug = 'sunday-drill'),
  step_details = (
    select jsonb_object_agg(step->>'label', step->>'detail')
    from jsonb_array_elements(coalesce(l.run_sheet, '[]'::jsonb)) as step
    where coalesce(step->>'detail', '') <> ''
  ),
  run_sheet = null
where l.spine_id is null;

alter table coaching.lessons
  alter column spine_id set not null;

create or replace view coaching.lessons_with_spine
with (security_invoker = true) as
select
  l.*,
  s.slug as spine_slug,
  s.steps as spine_steps
from coaching.lessons l
join coaching.spines s on s.id = l.spine_id;

comment on view coaching.lessons_with_spine is
  'Lesson overlay joined to its spine. The website composes run_sheet in JS (objective, STEP, next-week Close). Do not treat this view as the printable hour.';

alter table coaching.spines enable row level security;

create policy signed_in_read_spines
  on coaching.spines
  for select
  to authenticated
  using (auth.uid() is not null);

grant select on table coaching.spines to authenticated;
grant all on table coaching.spines to postgres, service_role;
grant select on table coaching.lessons_with_spine to authenticated;
grant all on table coaching.lessons_with_spine to postgres, service_role;

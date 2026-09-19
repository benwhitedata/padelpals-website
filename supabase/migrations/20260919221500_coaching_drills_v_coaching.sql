-- Weekly planned sessions are drills. Coaching is the full lesson-structure hour for 3–4.
-- Copy is Ben's 01 Drills v Coaching wording, stored here rather than in the website repo.

alter table coaching.lessons
  add column if not exists session_kind text not null default 'drill';

do $$ begin
  alter table coaching.lessons drop constraint if exists lessons_session_kind_check;
  alter table coaching.lessons
    add constraint lessons_session_kind_check check (session_kind in ('drill', 'coaching'));
end $$;

comment on column coaching.lessons.session_kind is
  'drill = themed volume session in closed and progressing. coaching = full funnel for 3–4 in a tight band.';

update coaching.lessons
set session_kind = 'drill'
where session_kind is distinct from 'drill';

create table if not exists coaching.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table coaching.guides is
  'Short Coach Planner explainers. Not lesson plans. Signed-in published read.';

alter table coaching.guides enable row level security;

drop policy if exists signed_in_read_published_guides on coaching.guides;
create policy signed_in_read_published_guides
  on coaching.guides
  for select
  to authenticated
  using ((published_at is not null) and (auth.uid() is not null));

grant select on table coaching.guides to authenticated;
grant all on table coaching.guides to postgres, service_role;

insert into coaching.guides (slug, title, body, published_at)
values (
  'drills-v-coaching',
  'Which session is which, and what you get out of each',
  jsonb_build_object(
    'lead', 'Every session is one of two things. They cover the same material and from the side of the court they can look alike, so here is what each one actually is.',
    'drill', jsonb_build_object(
      'kicker', 'What a drill is',
      'title', 'Repetition of something you can already do',
      'body', 'I set it up and I feed. One focus for the hour, announced at the start, then volume. Balls in, tight rotations, corrections called out to the group. I am not stopping to rebuild anyone''s technique, I am keeping you hitting.',
      'bullets', jsonb_build_array(
        'Works with mixed ability and whatever numbers turn up',
        'You leave having hit a lot of balls and worked on one thing',
        'Sits in the closed and progressing part of the lesson structure',
        'Up to 8 players. These are the weekly sessions'
      )
    ),
    'coaching', jsonb_build_object(
      'kicker', 'What coaching is',
      'title', 'A change you can name afterwards',
      'body', 'I watch you play before I teach anything, demo one point, teach it fed and predictable, open it up, then finish in the game with feedback on what you personally need to change.',
      'bullets', jsonb_build_array(
        '3 or 4 players in a tight rating band',
        'You leave able to say what you are now doing differently',
        'Uses the whole funnel, the watching at the top and the game at the bottom',
        'The hour is spent on you rather than on the group'
      )
    ),
    'funnel', jsonb_build_object(
      'title', 'Where each one sits in the lesson structure',
      'intro', 'This is the structure I was trained to coach to, and it funnels from wide to narrow. A drill session sits in the middle of it. The top and the bottom — watching you first and coaching you inside the game — are what the smaller paid sessions add.',
      'bands', jsonb_build_array(
        jsonb_build_object('label', 'Observation and analysis', 'tag', 'Coached only', 'seat', 'coaching'),
        jsonb_build_object('label', 'Demo — one point, hit three balls', 'tag', null, 'seat', 'shared'),
        jsonb_build_object('label', 'Teaching, closed — fed, predictable', 'tag', 'A drill session sits here', 'seat', 'drill'),
        jsonb_build_object('label', 'Progressing, open — live, unpredictable', 'tag', 'A drill session sits here', 'seat', 'drill'),
        jsonb_build_object('label', 'Game', 'tag', 'Coached only', 'seat', 'coaching')
      )
    )
  ),
  now()
)
on conflict (slug) do update
set title = excluded.title,
    body = excluded.body,
    published_at = excluded.published_at;

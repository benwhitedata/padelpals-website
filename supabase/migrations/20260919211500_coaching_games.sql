-- Reusable warm-up and mini games. Weeks point at these instead of pasting the same rules.
-- Copy is original courtside wording. LTA slide names (Dead Zone, Glass Galore, Goalkeeper)
-- are the games Ben already runs; do not dump Xpress lesson plans into this table.

create table coaching.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  kind text not null check (kind in ('warmup', 'mini')),
  blurb text not null,
  setup text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table coaching.games is
  'Warm-up and mini-game library. Lessons reference these from the 5–12 and 48–58 slots.';

insert into coaching.games (slug, title, kind, blurb, setup, published_at) values
(
  'cooperative-target-rally',
  'Cooperative target rally',
  'warmup',
  'Moving rally, one group target, nobody stands still.',
  'Get them hitting straight away. Cooperative rally on the move, one target on the fence or a cone on the glass. Count as a group. Rotate partners every minute. No queues, no static stretching.',
  now()
),
(
  'cooperative-volley',
  'Cooperative volley',
  'warmup',
  'Moving volley, short punch, group target.',
  'Hands already up. Cooperative volley on the move, one group target. Short punch, no swing. Rotate partners every minute. Same rule as the rest of the hour: nobody waits over 30 seconds.',
  now()
),
(
  'catch-the-glass',
  'Catch the glass',
  'warmup',
  'Throw so it bounces, hits the back glass, then catch. Then hit.',
  'Pairs. Throw so the ball bounces then hits the back glass. Partner waits, then catches. Five each side, then swap. Then the catcher uses the bat: wait, then lift. Teaches the pause the rest of the hour needs.',
  now()
),
(
  'dead-zone-padel',
  'Dead Zone Padel',
  'mini',
  'Recover into the strip after every shot.',
  'Tape a strip between the second post and the service line. After every shot, both players on that side must recover into the strip before the next ball. Play both sides. Stops people hanging at the net or getting stuck on the glass.',
  now()
),
(
  'glass-galore',
  'Glass Galore',
  'mini',
  'Past the service line, it has to come off the glass.',
  'If the ball lands past the service line, it must come off the glass. Volley or half-volley from the baseline loses the point. Doubles, rotate partners every few minutes.',
  now()
),
(
  'goalkeeper',
  'Goalkeeper',
  'mini',
  'The pair at the back cannot step in front of the line.',
  'Mark a line halfway from the back glass to the service line. The pair at the back cannot step in front of it. Forces them to wait for the bounce instead of crowding the ball.',
  now()
);

alter table coaching.lessons
  add column warmup_game_id uuid references coaching.games (id),
  add column conditioned_game_id uuid references coaching.games (id);

comment on column coaching.lessons.warmup_game_id is 'Warm-up game for minutes 5–12. Overrides the spine default when set.';
comment on column coaching.lessons.conditioned_game_id is 'Mini game for minutes 48–58. Overrides the spine default when set.';

update coaching.lessons
set
  warmup_game_id = (select id from coaching.games where slug = 'cooperative-target-rally'),
  conditioned_game_id = (select id from coaching.games where slug = 'glass-galore'),
  step_details = coalesce(step_details, '{}'::jsonb) - 'Warm up with a ball' - 'Conditioned game'
where slug = '2026-09-20-back-glass';

update coaching.lessons
set
  warmup_game_id = (select id from coaching.games where slug = 'cooperative-volley'),
  step_details = coalesce(step_details, '{}'::jsonb) - 'Warm up with a ball'
where slug = '2026-09-20-net-battle';

alter table coaching.games enable row level security;

create policy signed_in_read_published_games
  on coaching.games
  for select
  to authenticated
  using ((published_at is not null) and (auth.uid() is not null));

grant select on table coaching.games to authenticated;
grant all on table coaching.games to postgres, service_role;

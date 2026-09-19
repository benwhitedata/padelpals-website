-- Overhead teaching extras. Names match the LTA clip titles; wording is original
-- courtside notes, not a transcript of the videos.

alter table coaching.games
  drop constraint games_kind_check;

alter table coaching.games
  add constraint games_kind_check check (kind in ('warmup', 'mini', 'overhead'));

alter table coaching.games
  add column video_url text,
  add column sort_index integer not null default 100;

comment on column coaching.games.video_url is 'Optional clip for extra resources. Do not host the video in the website repo.';
comment on table coaching.games is
  'Warm-ups, mini games, and extra teaching resources (e.g. overhead games). Lessons may point at warmup/mini rows.';

insert into coaching.games (slug, title, kind, blurb, setup, video_url, sort_index, published_at) values
(
  'up-or-down',
  'Up or Down',
  'overhead',
  'Smash or leave it: decide at the top, not after the bounce.',
  'Teaching-phase extra for overheads. One problem only, nobody queues. Use this when they freeze under a high ball and cannot choose smash versus let it drop.',
  'https://vimeo.com/1097859490/5e8e22e0df',
  1,
  now()
),
(
  'jumper-off',
  'Jumper Off',
  'overhead',
  'Free the hitting arm so the smash can go up.',
  'Teaching-phase extra for overheads. One problem only, nobody queues. Use this when the smash is cramped because they will not get the jumper, bag or spare ball off the hitting side.',
  'https://vimeo.com/1097859458/7a3ed046ab',
  2,
  now()
),
(
  'elbow-push',
  'Elbow Push',
  'overhead',
  'High elbow, short take-back. No tennis serve loop.',
  'Teaching-phase extra for overheads. One problem only, nobody queues. Use this when the elbow drops and they wind up like a serve instead of punching the smash.',
  'https://vimeo.com/1097859429/492051fcf1',
  3,
  now()
),
(
  'hide-the-logo',
  'Hide the Logo',
  'overhead',
  'Turn so the chest is not facing the net.',
  'Teaching-phase extra for overheads. One problem only, nobody queues. Use this when they smash square-on and dump the ball into the net or the glass at their feet.',
  'https://vimeo.com/1097859552/82eba74a16',
  4,
  now()
),
(
  'momentum',
  'Momentum',
  'overhead',
  'Keep moving through the smash. Do not stop under it.',
  'Teaching-phase extra for overheads. One problem only, nobody queues. Use this when they plant, look up, and the smash dies because the body has already stopped.',
  'https://vimeo.com/1097859411/0409108dd9',
  5,
  now()
),
(
  'clocks',
  'Clocks',
  'overhead',
  'Smash to a clock-face. Direction is the point, not power.',
  'Teaching-phase extra for overheads. One problem only, nobody queues. Use this when every smash goes to the same place and they need to move the pair off the net.',
  'https://vimeo.com/1097859369/138bc0c10c',
  6,
  now()
),
(
  'open-racket',
  'Open Racket',
  'overhead',
  'Bat face stays open at contact. Height first, then pace.',
  'Teaching-phase extra for overheads. One problem only, nobody queues. Use this when they close the face and hammer the smash into the net. Keep the LTA name; on court it is still a bat.',
  'https://vimeo.com/1097859324/29c8709f0d',
  7,
  now()
),
(
  'scarf',
  'Scarf',
  'overhead',
  'Finish the smash on a path, not a poke.',
  'Teaching-phase extra for overheads. One problem only, nobody queues. Use this when contact is late and the swing has no finish over the shoulder.',
  'https://vimeo.com/1097859626/0c9c53bbc2',
  8,
  now()
),
(
  'beat-the-bounce',
  'Beat the Bounce',
  'overhead',
  'Take it before the bounce. Prepare on the way.',
  'Teaching-phase extra for overheads. One problem only, nobody queues. Use this when they wait for a second bounce or a sit-up and the smash never happens.',
  'https://vimeo.com/1097859524/5f27dadf1b',
  9,
  now()
);

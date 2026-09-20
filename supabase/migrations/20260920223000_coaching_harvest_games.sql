-- Original courtside games harvested from LTA-shaped warm-up / mini ideas.
-- Do not republish Xpress or Youth plans wholesale. Junior names stay out.

insert into coaching.games (slug, title, kind, blurb, setup, when_to_pick, skill_ids, sort_index, published_at) values
(
  'two-hand-catch',
  'Two-hand catch',
  'warmup',
  'Body and ball. Catch with two hands, throw to the partner, then pick the bat up.',
  'Pairs, one ball. Catch, throw, three each way, then the same rally with the bat. Keep them moving.',
  'New faces or a cold start. Skip if they already rally comfortably.',
  array['ready_and_movement','groundstroke_rally'],
  6,
  now()
),
(
  'split-on-bounce',
  'Split on the bounce',
  'warmup',
  'Split step when the ball bounces, then move. The warm-up is the feet, not the rally record.',
  'Cooperative rally. Call split on every bounce. If they freeze, feed slower.',
  'Feet are late or they stand and swing. Use before glass or net hours.',
  array['ready_and_movement','groundstroke_rally','transition_to_net'],
  7,
  now()
),
(
  'hands-then-bat',
  'Hands then bat',
  'warmup',
  'Volley with hands first so they feel a soft block, then pick the bat up on the same feed.',
  'One feeder, two at the net. Catch or tap with two hands, then the same ball with the bat. Rotate every six.',
  'Hands are swinging at the net. Skip if they cannot volley yet — use cooperative volley instead.',
  array['volley_placement','low_block_reset','net_battle'],
  8,
  now()
),
(
  'cross-court-scores',
  'Cross-court scores',
  'mini',
  'Live points. Only a cross-court ball can score. Down the line is play, not a point.',
  'Standard scoring to 7. Announce the rule twice. If they forget, freeze and reset.',
  'The hour is direction or keeping it in. Skip if they cannot rally yet.',
  array['groundstroke_rally','return_depth','volley_placement'],
  20,
  now()
),
(
  'height-wins',
  'Height wins',
  'mini',
  'The point only counts if your last ball was above the fence line. Low drives keep it alive but do not score.',
  'Play to 7. One teaching point: send it up. STEP: drop to cooperative if they panic.',
  'They are flattening everything. Use on lob, glass, or rally hours.',
  array['the_lob','back_glass_rally','groundstroke_rally'],
  21,
  now()
)
on conflict (slug) do nothing;

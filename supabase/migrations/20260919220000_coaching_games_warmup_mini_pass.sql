-- Extra warm-ups and mini games from Ben's block and adult-worthy named constraints.
-- Original courtside wording. Junior formats and Xpress lesson dumps stay out.

insert into coaching.games (slug, title, kind, blurb, setup, sort_index, published_at) values
(
  'catch-the-lob',
  'Catch the lob',
  'warmup',
  'Throw high, move back, catch before the bounce. Then they can smash.',
  'Pairs. One throws a high ball so the partner has to back-step and catch it before it bounces. Five each, then swap. Then the catcher uses the bat: same ball, contact above the head. Gets them moving backwards without a queue.',
  101,
  now()
),
(
  'box-volleyball',
  'Box volleyball',
  'warmup',
  'Keep it in the air, stay in the service boxes.',
  'Pairs in opposite service boxes. Volley it back and forth without letting it bounce. Count as a pair. If it drops, start again. Rotate partners every minute. Hands already up, nobody standing on the baseline.',
  102,
  now()
),
(
  'focus-scores',
  'Focus scores',
  'mini',
  'The point only counts if they used the focus.',
  'Doubles, short scoring. A winner only scores if the pair used this week''s focus. If they win without it, play on. Name the focus out loud before you start so they know what you are watching.',
  110,
  now()
),
(
  'mini-americano',
  'Mini Americano',
  'mini',
  'Rotating partners, short games, one table.',
  'Four or eight on court. Short doubles games, rotate partners after each game, keep a running score. Same idea as a social Americano, squeezed into the last block of the hour. Keep sit-outs moving. Intro week 6 lives here.',
  111,
  now()
),
(
  'third-ball-live',
  'Third ball live',
  'mini',
  'Serve and return cooperative, then it is on.',
  'Doubles or half-court pairs. Serve and first return are cooperative. On the third ball the point is live. Stops the panic first ball and still finishes under score.',
  112,
  now()
),
(
  'back-glass-is-out',
  'Back glass is out',
  'mini',
  'After the bounce, the back glass loses the point.',
  'Doubles, short scoring. If the ball touches the back glass after bouncing, it is out. Side glass is still in. They have to take it early or lift instead of waiting on the glass.',
  113,
  now()
),
(
  'winning-volley',
  'Winning volley',
  'mini',
  'A winning volley is worth two. Everything else is one.',
  'Doubles, short scoring. Winner by volley scores two. Any other winner scores one. Praise the deep volley into the back third, not the swing at head height.',
  114,
  now()
),
(
  'soft-overheads',
  'Soft overheads',
  'mini',
  'No smash winner. Put the overhead back in play and recover.',
  'Doubles, short scoring. Offensive smash is not allowed. The overhead has to be controlled, back into court, then they recover the net. Use this when they try to finish the first high ball.',
  115,
  now()
),
(
  'glass-serve',
  'Glass serve',
  'mini',
  'Serve into the side glass and the point is worth extra.',
  'Doubles, short scoring. If the server wins the point after a serve that used the side glass, they score two. A missed return still loses the point as normal. Makes them aim the serve instead of tapping it in.',
  116,
  now()
),
(
  'one-lob',
  'One lob',
  'mini',
  'One lob per point. Use it to take the net.',
  'Doubles, short scoring. Each pair may play one lob in the point. After that, a lob loses it. The lob has to be the tool that gets them in, not a panic ball from nowhere.',
  117,
  now()
),
(
  'claim-the-net',
  'Claim the net',
  'mini',
  'The point only scores if both of you finish at the net.',
  'Doubles, short scoring. A winner only counts if both players in the pair are at the net when the point ends. Two back and a winner does not score. Use this on positioning weeks.',
  118,
  now()
)
on conflict (slug) do nothing;

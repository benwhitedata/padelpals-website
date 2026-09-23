-- Warm-up library overhaul. Original courtside wording.
-- Every warm-up setup is Layout, How it runs, Build it, Watch for.
-- two-hand-catch is folded into box-catch and unpublished.

update coaching.games set
  blurb = 'Two diagonal rallies, one cone in the deep third, everyone hitting.',
  setup = 'Layout: four on court, two balls, one cone in the back third on each side. Both pairs start at the back and rally on the diagonal, so the two balls cross in the middle. How it runs: count, as a group, the balls that land past the service line. After 90 seconds one player from each pair steps in to the net, so it becomes back against net on each diagonal, still cooperative. A deep ball may come off the back glass. Build it: first minute cross-court only, then they may use the side glass. Watch for: standing still between shots, and hitting the ball before it bounces.',
  when_to_pick = 'Mixed group or new faces. Everyone can play.',
  skill_ids = array['groundstroke_rally','return_depth','back_glass_rally','the_lob','point_construction'],
  junior_note = 'One cone in the back third, everyone hitting, one group count. Younger players throw and catch before they use the bat.',
  sort_index = 4
where slug = 'cooperative-target-rally';

update coaching.games set
  blurb = 'Net against back on the diagonal. A short punch, aimed deep.',
  setup = 'Layout: one at the net and one at the back on each diagonal, two balls. The net player volleys. The back player lets it bounce. How it runs: the volley has to land in the back third. Count as a pair. Swap net and back every 90 seconds, then swap diagonals once. Build it: a gentle ball from the back first, then a live cooperative rally. Watch for: a backswing at the net. The bat face stays in front and the punch stays short.',
  when_to_pick = 'They can volley without a swing. Skip if hands are dropping.',
  skill_ids = array['volley_placement','serve_and_net','holding_the_net','net_battle','transition_to_net'],
  sort_index = 9
where slug = 'cooperative-volley';

update coaching.games set
  title = 'Split as they hit',
  blurb = 'The split lands as the other player hits, then they move. The warm-up is the feet.',
  setup = 'Layout: pairs, one ball, a cooperative rally from behind the service line. Both may use the back glass. How it runs: call split as the other player hits, so the feet land before the ball crosses the net, then move to the ball. Count the rallies where both of them split. Build it: easy balls first, then a little more pace once the split is on time. Watch for: splitting as the ball bounces, which is already late, and standing still to swing.',
  when_to_pick = 'Feet are late, or they stand and swing. Use it before a glass hour or a net hour.',
  skill_ids = array['ready_and_movement','groundstroke_rally','transition_to_net'],
  junior_note = 'Call split as the other player hits, then move. Keep the rally slow for the younger players.',
  sort_index = 6
where slug = 'split-on-bounce';

update coaching.games set
  blurb = 'Throw it high, turn and move back, catch before the bounce. Then a soft overhead.',
  setup = 'Layout: pairs, one ball, space behind the catcher. How it runs: one throws a high ball. The partner turns side-on, crosses over to get under it, and catches it before the bounce. Five each, then swap. Then the catcher uses the bat: same ball, contact above the head, at half pace, like a soft bandeja. Build it: once that is comfortable, let it bounce off the back glass and play it up. A full smash waits until the last minute, and only if the shoulder is warm. Watch for: running backwards, and swinging hard on the first ones.',
  when_to_pick = 'The hour is lobs or overheads. Shoulders stay easy until the end.',
  skill_ids = array['the_lob','bandeja','defending_the_corner','return_lob'],
  junior_note = 'Throw it high, turn, and catch it before it bounces. Younger players throw lower and catch after one bounce. Nobody smashes.',
  sort_index = 17
where slug = 'catch-the-lob';

update coaching.games set
  blurb = 'Throw so it bounces, hits the back glass, then catch. Then hit.',
  setup = 'Layout: pairs on one side. The thrower stands near the service line. The catcher stands a step off the back glass. How it runs: throw so the ball bounces, then hits the back glass. The partner waits, then catches. Five each, then swap. Then the catcher uses the bat: wait, then lift it back. Build it: the same throw into the side glass, then a ball that hits the side glass and then the back. Watch for: moving before the ball hits the glass. The pause is the point.',
  when_to_pick = 'They already rally the wall. Skip if new faces still volley the glass.',
  skill_ids = array['back_glass_rally','side_and_double_wall','defending_the_corner','bajada'],
  sort_index = 8
where slug = 'catch-the-glass';

update coaching.games set
  blurb = 'Keep it in the air, stay in the service boxes, and score every five.',
  setup = 'Layout: pairs in opposite service boxes, one ball, both at the net. How it runs: volley it back and forth with no bounce. A pair scores one for every five in a row. If it drops, start the five again. Rotate partners every minute. Build it: alternate a forehand volley and a backhand volley. Watch for: a swing, and anyone drifting back to the baseline. Hands stay up.',
  when_to_pick = 'Close hands at the net. Skip if they cannot volley yet.',
  skill_ids = array['net_battle','volley_placement','low_block_reset'],
  sort_index = 10
where slug = 'box-volleyball';

update coaching.games set
  blurb = 'Two in a service box. Catch, then throw, then the bat. Eyes on the bounce.',
  setup = 'Layout: two players, one ball, inside one service box. No queue. How it runs: one throws the ball up in the box, lets it bounce once, and catches it with two hands before the second bounce. Then the other player does the same. Vary where it lands. Build it: catch and throw three each way, then the same rally with the bat, then alternate forehand and backhand. Watch for: a one-hand catch, and stepping out of the box to make it easy.',
  when_to_pick = 'First hour, or a cold start before they pick the bat up. The eyes go to the bounce. Skip once they already rally.',
  skill_ids = array['groundstroke_rally','ready_and_movement','grip_and_contact'],
  junior_note = 'Catch with two hands before anyone picks up a bat. Younger players throw it lower and stay inside the box.',
  sort_index = 1
where slug = 'box-catch';

update coaching.games set
  blurb = 'A group at the net. Catch with two hands, then the same throw with the bat.',
  setup = 'Layout: three or four players. One thrower stands just beyond the net, ball in hand, no bat. The others are at the net: one hitting, the rest a step behind. How it runs: a short underarm throw. The hitter catches it with two hands. The next throw is the same ball with the bat, a soft block back to the thrower. After six throws the thrower joins the line and the next player throws, so nobody waits through more than six. Build it: two-hand catch only, then the bat, then they call forehand or backhand before the throw. Watch for: a swing. If they cannot block yet, skip this and use the cooperative volley.',
  when_to_pick = 'Hands are swinging at the net, with a group of three or four. Skip if they cannot volley yet.',
  skill_ids = array['volley_placement','low_block_reset','net_battle'],
  sort_index = 2
where slug = 'hands-then-bat';

update coaching.games set
  blurb = 'Both at the net. A short throw, volleyed back to the hands.',
  setup = 'Layout: one player each side, both at the net, one ball. This is one against one, not a queue. How it runs: a short underarm throw. The other player volleys it back to the thrower''s hands, who catches it. Then they swap who throws. Nobody feeds with the bat. A third player swaps in after six throws. Build it: throw to the forehand, then the backhand, then a lower ball they have to bend for. Watch for: the throw getting long, and the volley flying past the hands.',
  when_to_pick = 'Intro volley, one against one. The throw has to stay short.',
  skill_ids = array['volley_placement'],
  sort_index = 3
where slug = 'back-to-the-hands';

insert into coaching.games (slug, title, kind, blurb, setup, when_to_pick, skill_ids, junior_bands, junior_note, sort_index, published_at) values
(
  'knock-the-tube',
  'Knock the tube',
  'warmup',
  'A controlled rally. Knock the tube at the other pair''s feet to score.',
  'Layout: a pair each side, both behind the service line, one ball. A ball tube or a cone stands at each pair''s feet, a step in front of them. How it runs: a cooperative rally for a minute, letting deep balls come off the back glass. Then play points. Hitting the other pair''s tube ends the rally and scores two. Any other winner scores one. Play to 7 and swap ends. Build it: aim at the cone with a gentle ball first, before the points. Watch for: blasting at the tube from close range, and leaving the rally to guard the tube.',
  'A cold rally that needs a target. Skip if they cannot rally yet, and use box catch.',
  array['groundstroke_rally','return_depth','back_glass_rally'],
  array['8-11','11-14'],
  'A cone or a tube at their feet. Younger players throw at it before they use the bat.',
  5,
  now()
),
(
  'last-ball-live',
  'Last ball live',
  'warmup',
  'Two diagonal rallies at once. When one dies, the ball left is a live point.',
  'Layout: four players, two balls, one cooperative rally on each diagonal, both pairs starting at the back. How it runs: keep both rallies going. When one ball dies, that pair shouts live, and the ball still in play becomes a doubles point. Play the points to 7, then start the two rallies again. The glass is in. Build it: both rallies stay cross-court until someone calls live. Watch for: both balls dying together because nobody is talking, and smashing the live ball on the first hit.',
  'They can hold two rallies. Use it when the hour is competing, or building a point.',
  array['match_mentality','groundstroke_rally','back_glass_rally','point_construction'],
  array['11-14'],
  'Two rallies, then the last ball is the point. Leave it out for ages 8 to 11.',
  7,
  now()
),
(
  'padel-volleyball',
  'Padel volleyball',
  'warmup',
  'Two touches as a pair, then send it over. Stay in the service boxes.',
  'Layout: a pair in the service boxes each side, one ball, all four inside the boxes. How it runs: a pair must touch the ball twice, a pass to the partner, before sending it over. Keep it below head height. Count the passes that stay in, as a pair, for two minutes, then play points where a failed second touch loses the point. Rotate partners once. Build it: catch and throw the pass first, then both touches with the bat. Watch for: sending it over on the first touch, and leaving the box.',
  'The hour is playing as a pair, or hands at the net. Skip if they cannot volley yet.',
  array['pair_communication','net_battle','volley_placement','grip_and_contact'],
  array['8-11','11-14'],
  'Two touches, then over. Younger players catch the pass and throw it to their partner.',
  11,
  now()
),
(
  'two-ball-volleys',
  'Two-ball volleys',
  'warmup',
  'All four at the net, two balls in play, straight across.',
  'Layout: all four at the net, in the service boxes. Two balls, each going straight across, not on the diagonal, so the paths do not cross. How it runs: volley only, no bounce. Keep both balls going. If one drops, pick it up and start that ball again without stopping the other. Swap straight-across partners every minute. Build it: easy pace first, then a little more, still with a short punch. Watch for: looking only at their own ball, and a backswing. Call yours if the two balls get close.',
  'They can already volley. Hands and reactions before a net hour.',
  array['net_battle','low_block_reset'],
  array['11-14'],
  'Two balls at the net, straight across. Leave it out if they still swing.',
  12,
  now()
),
(
  'short-court-touch',
  'Short-court touch',
  'warmup',
  'All four in the service boxes. The ball drops in, and nothing goes above the shoulder.',
  'Layout: all four inside the service boxes, one ball. The court behind the service line is out. How it runs: cooperative for two minutes, keeping the ball soft and below shoulder height, so it drops in a box. Then play points to 7 with the same rule. A ball above the shoulder, or past the service line, loses the point. Rotate partners once. Build it: catch and throw if the bat is too firm, then the bat. Watch for: a drive, and stepping back to give themselves room.',
  'Chiquita or the short game. Skip if they cannot keep a soft ball in play.',
  array['chiquita','low_block_reset','grip_and_contact'],
  array['11-14'],
  'Stay in the service boxes and keep it below the shoulder. Leave it out for ages 8 to 11.',
  13,
  now()
),
(
  'one-bat-per-pair',
  'One bat per pair',
  'warmup',
  'Each pair shares one bat. Put it down, and the partner picks it up.',
  'Layout: four players, short court, everything inside the service boxes, one bat per pair on the ground between them. How it runs: play a cooperative rally, then short points. After each shot the player puts the bat down. They do not throw it. The partner picks it up for the next ball. The player without the bat moves to the ball so they are ready. First pair to 5, then swap partners. Build it: the rally is cooperative for the first minute, then the points are live. Watch for: a thrown bat, and the partner standing still while they wait.',
  'New pairs, or a communication hour. Use it once they can already rally a little.',
  array['pair_communication','pair_positioning','ready_and_movement'],
  array['8-11','11-14'],
  'One bat on the ground between them. Put it down. Do not throw it. Younger players stay inside one service box.',
  14,
  now()
),
(
  'on-a-rope',
  'On a rope',
  'warmup',
  'Partners move as if a rope holds them a few metres apart.',
  'Layout: a pair side by side, about three metres apart, no ball yet. Imagine a rope between them. How it runs: you call lob and they turn and retreat together, short and they close to the net together, wide and the pair shifts, middle and they recover. The gap stays the same. After a minute, feed one ball and they play it out, still moving together, then reset. Swap pairs. Build it: walking calls first, then a jog, then the feed. Watch for: one player moving and the partner staying, and both crowding the same ball.',
  'The hour is moving as a pair. Use it before positioning, or before coming in together.',
  array['pair_positioning','pair_communication','transition_to_net','ready_and_movement'],
  array['8-11','11-14'],
  'Call lob, short, wide or middle. Younger players walk it first, with no ball.',
  15,
  now()
),
(
  'serve-return-catch',
  'Serve, return, catch',
  'warmup',
  'A cooperative serve to the box. The return comes back to the server''s hands.',
  'Layout: server behind the baseline, returner behind the opposite service line, one ball, playing the diagonal. How it runs: an underarm serve that bounces in the diagonal box. The return is played back towards the server, who catches it. That is one. Five each, then the other pair on the other diagonal does the same, so four can work at once with two balls. Say the rule as they play: bounce in the box, contact below the waist, diagonal only. Build it: throw the serve if the hit is not in yet, then the bat, then the return has to land past the service line. Watch for: a serve with no bounce, and a return smashed back at the server.',
  'A serve hour or a rules hour. Keep the serve a throw if it is not in yet.',
  array['underarm_serve','serve_and_net','return_depth','rules_and_scoring'],
  array['8-11','11-14'],
  'Serve into the box and return it to the hands. Younger players throw the serve.',
  16,
  now()
),
(
  'build-the-overhead',
  'Build the overhead',
  'warmup',
  'Shoulders first, then a soft overhead, and no full smash until the last minute.',
  'Layout: pairs, one ball, the feeder at the back and the hitter around the service line. How it runs: start with no ball. Arm circles, then five shadow swings with the bat, contact above the head, half pace. Then the partner feeds a lob. The hitter turns side-on, crosses under it, and plays a soft overhead back into court. Five each, then swap. Build it: half pace, then a little more, then aim at a cone in the back third. A full smash is only for the last minute, and only if the shoulder is warm. Watch for: a tennis-serve wind-up, running backwards, and trying to finish the first one.',
  'Any overhead hour. Shoulders first. No full smash until the last minute.',
  array['smash_and_finish','vibora','kick_smash','gancho','bandeja','bajada'],
  array[]::text[],
  null,
  18,
  now()
)
on conflict (slug) do nothing;

update coaching.lessons set
  warmup_game_id = (select id from coaching.games where slug = 'build-the-overhead'),
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'build-the-overhead'),
    (select id from coaching.games where slug = 'catch-the-lob')
  ]
where slug in ('vibora', 'the-kick', 'the-late-overhead', 'smash-and-finish');

update coaching.lessons set
  warmup_game_id = (select id from coaching.games where slug = 'short-court-touch'),
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'short-court-touch'),
    (select id from coaching.games where slug = 'cooperative-volley')
  ]
where slug = 'chiquita';

update coaching.lessons set
  warmup_game_id = (select id from coaching.games where slug = 'serve-return-catch'),
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'serve-return-catch'),
    (select id from coaching.games where slug = 'cooperative-target-rally')
  ]
where slug = 'underarm-serve';

update coaching.lessons set
  warmup_game_id = (select id from coaching.games where slug = 'serve-return-catch'),
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'serve-return-catch'),
    (select id from coaching.games where slug = 'catch-the-glass')
  ]
where slug = 'rules-and-scoring';

update coaching.lessons set
  warmup_game_id = (select id from coaching.games where slug = 'on-a-rope'),
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'on-a-rope'),
    (select id from coaching.games where slug = 'cooperative-target-rally')
  ]
where slug in ('pair-positioning', 'intro-positioning');

update coaching.lessons set
  warmup_game_id = (select id from coaching.games where slug = 'one-bat-per-pair'),
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'one-bat-per-pair'),
    (select id from coaching.games where slug = 'padel-volleyball')
  ]
where slug = 'pair-communication';

update coaching.lessons set
  warmup_game_id = (select id from coaching.games where slug = 'last-ball-live'),
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'last-ball-live'),
    (select id from coaching.games where slug = 'split-on-bounce')
  ]
where slug = 'match-mentality';

update coaching.lessons set
  warmup_game_id = (select id from coaching.games where slug = 'box-catch'),
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'box-catch'),
    (select id from coaching.games where slug = 'hands-then-bat')
  ]
where slug = 'grip-and-contact';

update coaching.lessons set
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'cooperative-target-rally'),
    (select id from coaching.games where slug = 'split-on-bounce'),
    (select id from coaching.games where slug = 'box-catch')
  ]
where slug = 'groundstroke-rally';

update coaching.lessons set
  warmup_game_ids = array[
    (select id from coaching.games where slug = 'split-on-bounce'),
    (select id from coaching.games where slug = 'box-catch')
  ]
where slug = 'ready-and-movement';

update coaching.games
set published_at = null,
    sort_index = 99
where slug = 'two-hand-catch';

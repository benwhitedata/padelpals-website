-- Four square. One player in each service box. Original courtside wording.

update coaching.games
set sort_index = sort_index + 1
where kind = 'warmup'
  and published_at is not null
  and sort_index >= 14;

insert into coaching.games (slug, title, kind, blurb, setup, when_to_pick, skill_ids, junior_bands, junior_note, sort_index, published_at) values
(
  'four-square',
  'Four square',
  'warmup',
  'One player in each service box. Pop it up, it bounces in a box, and that player sends it on.',
  'Layout: one player in each service box, all close to the net, one ball. How it runs: the player with the ball holds it over the net and strikes the tape with the bat so the ball pops up. They play it up into a box. It has to bounce. The player in that box then plays it up into a different box. A miss, a second bounce, or a ball that never lands in a box is that player''s loss. Start again. Build it: catch and throw into a box first, then the bat. Watch for: a flat drive at a player, and hitting it before the bounce.',
  'Hands and reactions at the net, once they can pop the ball up. Skip if they still drive everything.',
  array['net_battle','low_block_reset','ready_and_movement','grip_and_contact'],
  array['8-11','11-14'],
  'Pop it up so it bounces in a box. Younger players catch after the bounce and throw it into another box.',
  14,
  now()
)
on conflict (slug) do nothing;

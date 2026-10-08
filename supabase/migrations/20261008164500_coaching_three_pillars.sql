-- Three pillars. A cone race along the side pillars. Original courtside wording.

insert into coaching.games (
  slug, title, kind, blurb, setup, when_to_pick, skill_ids, junior_bands, junior_note, sort_index, published_at
) values (
  'three-pillars',
  'Three pillars',
  'warmup',
  'Land it on the cone, move the cone back a pillar, and race the other team through all three.',
  'Layout: two teams on one court, one on each half, and the same on every court you have. Each team is one player each side of the net, one ball, and one cone on the court at the first pillar. How it runs: they hit the ball back and forth and try to land it on the cone. A hit moves that team''s cone back to the second pillar. Hit it there, and the cone goes to the third pillar. First team to hit the cone on all three pillars wins. If a cone is not getting hit, do not leave them there. After a couple of minutes call the whole court onto the second pillar, and later onto the third, so the race keeps moving and a miss does not stall anyone. Build it: a gentle rally at the first pillar before the race starts. Watch for: blasting at the cone from on top of it, and a team standing still once they miss.',
  'A cold start with a race in it. Everyone can play. Move the whole court on if the cone is not getting hit.',
  array['groundstroke_rally', 'return_depth'],
  array['8-11', '11-14'],
  'A cone at the pillar. Younger players throw at it before they use the bat. Move everyone on together if the cone is not getting hit.',
  20,
  now()
)
on conflict (slug) do nothing;

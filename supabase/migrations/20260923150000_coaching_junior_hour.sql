-- Junior Padel hour. LTA Youth shape, same lesson fields as the adult hours.
-- Unpublished programme: nothing shows in Coach Planner until published_at is set.

insert into coaching.spines (slug, title, audience, duration_min, group_size_max, steps)
values (
  'junior-hour',
  'Junior Padel hour',
  'Junior Padel',
  60,
  8,
  $json$[
    {"from":"0","to":"12","label":"Warm up with a ball","default_detail":"A game with a ball, not stretching. Everyone is moving. Nobody waits."},
    {"from":"12","to":"20","label":"Body and ball","default_detail":"Same focus, with hands first, or one player on a bat. Keep the words short."},
    {"from":"20","to":"23","label":"Demo","default_detail":"One point. Show and tell. Hit three. Check they got it."},
    {"from":"23","to":"42","label":"Bat and ball","default_detail":"Fed, then a live ball. Same focus. STEP by age, 8 to 11 against 11 to 14. No queues."},
    {"from":"42","to":"58","label":"Conditioned game","default_detail":"Team scoring. The point only counts if they used the focus. Every child gets a result."},
    {"from":"58","to":"60","label":"Close","default_detail":"They say the focus back."}
  ]$json$::jsonb
)
on conflict (slug) do update
set
  title = excluded.title,
  audience = excluded.audience,
  duration_min = excluded.duration_min,
  group_size_max = excluded.group_size_max,
  steps = excluded.steps;

insert into coaching.programmes (slug, title, audience, spine_id, published_at)
select
  'junior-padel',
  'Junior Padel',
  'Junior Padel',
  id,
  null
from coaching.spines
where slug = 'junior-hour'
on conflict (slug) do update
set
  title = excluded.title,
  audience = excluded.audience,
  spine_id = excluded.spine_id,
  published_at = null;

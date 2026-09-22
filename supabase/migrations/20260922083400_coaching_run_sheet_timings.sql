-- Retimed drill spines: the focus is one sentence inside the warm-up.
-- Coaching is a separate hour (watch, then teach, then a game), not a copied drill sheet.

update coaching.spines
set
  title = 'Sunday drill hour',
  duration_min = 60,
  group_size_max = 8,
  steps = $json$[
    {"from":"0","to":"8","label":"Warm up with a ball","default_detail":"Moving, cooperative rally, group target. No standing still."},
    {"from":"8","to":"12","label":"Demo","default_detail":"One point. Show and tell. Hit three. Check they got it."},
    {"from":"12","to":"31","label":"Closed","default_detail":"Fed and predictable. High volume. Nobody waits over 30 seconds."},
    {"from":"31","to":"47","label":"Open","default_detail":"Live ball, same focus. STEP to differentiate, do not split them."},
    {"from":"47","to":"58","label":"Conditioned game","default_detail":"Points only score if the focus was used."},
    {"from":"58","to":"60","label":"Close","default_detail":"Restate the focus."}
  ]$json$::jsonb
where slug = 'sunday-drill';

update coaching.spines
set
  title = 'Intro to Padel hour',
  duration_min = 60,
  group_size_max = 8,
  steps = $json$[
    {"from":"0","to":"7","label":"Warm up with a ball","default_detail":"Moving warm-up with a ball. No standing still."},
    {"from":"7","to":"11","label":"Demo","default_detail":"One point. Show and tell. Hit three. Check they got it."},
    {"from":"11","to":"18","label":"Flavour","default_detail":"This week's extra flavour. One shot or one situation, then back to the spine."},
    {"from":"18","to":"34","label":"Closed","default_detail":"Fed and predictable. High volume. Nobody waits over 30 seconds."},
    {"from":"34","to":"48","label":"Open","default_detail":"Live ball, same focus. STEP to differentiate, do not split them."},
    {"from":"48","to":"58","label":"Conditioned game","default_detail":"Points only score if the focus was used."},
    {"from":"58","to":"60","label":"Close","default_detail":"Restate the focus."}
  ]$json$::jsonb
where slug = 'intro-padel';

insert into coaching.spines (slug, title, audience, duration_min, group_size_max, steps)
values (
  'coaching-hour',
  'Coaching hour',
  null,
  60,
  4,
  $json$[
    {"from":"0","to":"6","label":"Warm up with a ball","default_detail":"Relevant to the planned theme. No lecture."},
    {"from":"6","to":"14","label":"Observe","default_detail":"Feed, shot, play the point out. Do not teach. Look for a pattern."},
    {"from":"14","to":"16","label":"Name what you saw","default_detail":"One teaching point from what you just saw. Do not read the planned theme out as the point."},
    {"from":"16","to":"20","label":"Demo","default_detail":"One point. Show and tell. Hit three. Check they got it."},
    {"from":"20","to":"32","label":"Closed","default_detail":"Fed and predictable. Work the teaching point."},
    {"from":"32","to":"42","label":"Open","default_detail":"Live ball, same teaching point. STEP to differentiate, do not split them."},
    {"from":"42","to":"58","label":"Game","default_detail":"Scored game. Feedback to each player on their change."},
    {"from":"58","to":"60","label":"Close","default_detail":"Each player names what they are now doing differently."}
  ]$json$::jsonb
)
on conflict (slug) do update
set
  title = excluded.title,
  audience = excluded.audience,
  duration_min = excluded.duration_min,
  group_size_max = excluded.group_size_max,
  steps = excluded.steps;

-- Game-Based Development Framework tags that the lesson row was missing:
-- ball characteristic (Height, Depth, Direction, Speed, Spin) and the coaching eye
-- (Prepare, Hit, Recover). Whole Court is not an LTA situation; it had leaked in
-- from the skill-group key. Each retag is from that lesson's objective.

alter table coaching.lessons
  add column ball_characteristic text,
  add column technical_focus text,
  add constraint lessons_ball_characteristic_check
    check (ball_characteristic is null or ball_characteristic in ('Height', 'Depth', 'Direction', 'Speed', 'Spin')),
  add constraint lessons_technical_focus_check
    check (technical_focus is null or technical_focus in ('Prepare', 'Hit', 'Recover'));

comment on column coaching.lessons.ball_characteristic is
  'LTA ball characteristic for the hour: Height, Depth, Direction, Speed, Spin.';
comment on column coaching.lessons.technical_focus is
  'Where the coaching eye goes: Prepare, Hit, or Recover.';

-- Ready and the score are taught inside short games from the back, not as a serve hour.
update coaching.lessons
set game_situation = 'Both Back'
where slug in ('ready-and-movement', 'rules-and-scoring')
  and game_situation = 'Whole Court';

-- Two in or two back starts at the back. The call that matters is the lob over that pair.
update coaching.lessons
set game_situation = 'Both Back'
where slug in ('pair-positioning', 'intro-positioning', 'pair-communication')
  and game_situation = 'Whole Court';

-- Time between points is not a court situation. The scored games in this hour start from the back.
update coaching.lessons
set game_situation = 'Both Back'
where slug = 'match-mentality'
  and game_situation = 'Whole Court';

-- Six-week block in padel-coaching-reference.md, section 6, where a week exists.
-- The rest are read off the objective and the default cue pack.
update coaching.lessons as l
set
  ball_characteristic = v.ball_characteristic,
  technical_focus = v.technical_focus
from (values
  ('back-glass-rally', 'Height', 'Prepare'),
  ('return-depth', 'Depth', 'Hit'),
  ('transition-to-net', 'Depth', 'Recover'),
  ('volley-placement', 'Direction', 'Prepare'),
  ('the-lob', 'Height', 'Hit'),
  ('point-construction-beginner', 'Depth', 'Recover'),
  ('serve-and-net', 'Depth', 'Recover'),
  ('bandeja', 'Spin', 'Hit'),
  ('defending-the-corner', 'Height', 'Recover'),
  ('chiquita', 'Direction', 'Hit'),
  ('net-battle', 'Speed', 'Prepare'),
  ('point-construction-improver', 'Depth', 'Recover'),
  ('groundstroke-rally', 'Depth', 'Prepare'),
  ('pair-positioning', 'Direction', 'Recover'),
  ('pair-communication', 'Height', 'Prepare'),
  ('underarm-serve', 'Direction', 'Hit'),
  ('holding-the-net', 'Height', 'Recover'),
  ('return-lob', 'Height', 'Hit'),
  ('side-and-double-wall', 'Height', 'Prepare'),
  ('bajada', 'Direction', 'Hit'),
  ('low-block-reset', 'Speed', 'Hit'),
  ('smash-and-finish', 'Speed', 'Hit'),
  ('grip-and-contact', 'Height', 'Hit'),
  ('intro-back-glass', 'Height', 'Prepare'),
  ('intro-volley', 'Direction', 'Prepare'),
  ('intro-lob', 'Height', 'Hit'),
  ('intro-positioning', 'Direction', 'Recover'),
  ('ready-and-movement', 'Direction', 'Prepare'),
  ('rules-and-scoring', 'Direction', 'Hit'),
  -- Between points. No ball characteristic; the eye is the reset before the next serve.
  ('match-mentality', null, 'Prepare')
) as v(slug, ball_characteristic, technical_focus)
where l.slug = v.slug;

-- l.* is frozen when the view is created, so new columns are not visible until this is rebuilt.
drop view coaching.lessons_with_spine;

create view coaching.lessons_with_spine
with (security_invoker = true) as
select
  l.*,
  s.slug as spine_slug,
  s.steps as spine_steps
from coaching.lessons l
join coaching.spines s on s.id = l.spine_id;

comment on view coaching.lessons_with_spine is
  'Lesson overlay joined to its spine. The website composes run_sheet in JS (objective, STEP, next-week Close). Do not treat this view as the printable hour.';

grant select on table coaching.lessons_with_spine to authenticated;
grant all on table coaching.lessons_with_spine to postgres, service_role;

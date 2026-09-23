-- Age bands for Junior Padel (8–11 and 11–14). Empty means adults only.
-- Notes are original courtside wording. LTA Youth game names stay out.

alter table coaching.games
  add column junior_bands text[] not null default '{}',
  add column junior_note text;

alter table coaching.games
  add constraint coaching_games_junior_bands_check
  check (junior_bands <@ array['8-11', '11-14']::text[]);

comment on column coaching.games.junior_bands is
  'Ages this game suits for Junior Padel. Empty means adults only.';

comment on column coaching.games.junior_note is
  'One line on how to run it with kids. Null when the game is adults only.';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'Catch and throw before anyone picks up a bat. Keep the throws short so the younger ones can reach.'
where slug = 'two-hand-catch';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'Stay inside one service box. Throw it up, one bounce, then catch. Younger players throw it lower.'
where slug = 'box-catch';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'Throw so it bounces, then hits the back glass. Wait, then catch. Younger players stand closer to the glass.'
where slug = 'catch-the-glass';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'Throw it high and catch it before it bounces. Younger players throw lower and catch after one bounce.'
where slug = 'catch-the-lob';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'Catch with two hands first, then the same throw with the bat. The thrower never uses the bat.'
where slug = 'hands-then-bat';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'A short throw at the net, volleyed back to the hands. Younger players catch it instead of volleying.'
where slug = 'back-to-the-hands';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'Call split when the ball bounces, then move. Feed it slower for the younger players.'
where slug = 'split-on-bounce';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'One target, everyone hitting, one group count. Younger players throw and catch before they use the bat.'
where slug = 'cooperative-target-rally';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'Keep it up inside the service boxes. Younger players may let it bounce once.'
where slug = 'box-volleyball';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'Short games, swap partners, one running score. First to 7. Keep the sit-outs moving.'
where slug = 'mini-americano';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'The point only counts if the last ball went up. For ages 8 to 11, any ball that clears the net high scores.'
where slug = 'height-wins';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'You feed from the baseline. A winning volley is worth two. Younger players catch the feed, then hit.'
where slug = 'baseline-start';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'The pair at the back stay behind the line and wait for the bounce. Younger players get a wider area behind the line.'
where slug = 'goalkeeper';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'A point only scores if they used the focus. For ages 8 to 11, the whole group scores together.'
where slug = 'focus-scores';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'A winning volley is worth two. For ages 8 to 11, play first to 10 and any volley that stays in scores.'
where slug = 'winning-volley';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'The serve and the return stay friendly, then the point is on. For ages 8 to 11, you feed the first two balls.'
where slug = 'third-ball-live';

update coaching.games set
  junior_bands = array['8-11', '11-14'],
  junior_note = 'A serve off the side glass is worth two. For ages 8 to 11, you feed a ball that has to touch the side glass.'
where slug = 'glass-serve';

update coaching.games set
  junior_bands = array['11-14'],
  junior_note = 'A moving volley, a short punch, one group target. Leave it out if they still swing at the ball.'
where slug = 'cooperative-volley';

update coaching.games set
  junior_bands = array['11-14'],
  junior_note = 'Only a cross-court ball scores. Down the line keeps the rally going.'
where slug = 'cross-court-scores';

update coaching.games set
  junior_bands = array['11-14'],
  junior_note = 'The point only scores if both of them finish at the net. Name the rule before they start.'
where slug = 'claim-the-net';

update coaching.games set
  junior_bands = array['11-14'],
  junior_note = 'Past the service line, the ball has to come off the glass. A volley from the back loses the point.'
where slug = 'glass-galore';

update coaching.games set
  junior_bands = array['11-14'],
  junior_note = 'One lob in the point, and it has to get them in. A second lob loses it.'
where slug = 'one-lob';

update coaching.games set
  junior_bands = array['11-14'],
  junior_note = 'No smash. The high ball goes back in, then they recover the net. Nobody smashes at a player standing at the net.'
where slug = 'soft-overheads';

update coaching.games set
  junior_bands = array['11-14'],
  junior_note = 'Each controlled overhead adds one to the pot. The pair that wins the rally takes it.'
where slug = 'overhead-pot';

update coaching.games set
  junior_bands = array['11-14'],
  junior_note = 'Turn so the chest faces away from the net. The logo on the shirt is the picture.'
where slug = 'hide-the-logo';

update coaching.games set
  junior_bands = array['11-14'],
  junior_note = 'Aim the overhead at a clock on the far side. Direction is the game, not how hard they hit.'
where slug = 'clocks';

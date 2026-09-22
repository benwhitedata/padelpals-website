/* Shared print HTML for Coach Planner. Do not put lesson copy in this file. */
(function (global) {
  'use strict';

  var AUDIENCE_ORDER = [
    'Intro to Padel',
    'Beginner / Improver',
    'Improver / Intermediate'
  ];

  var REMINDERS = [
    'Equal hitting time, equal attention',
    'Feed from where the ball comes from in a match',
    'One teaching point',
    'Rotate partners every round',
    'Bats down when you are talking'
  ];

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = (s === null || s === undefined) ? '' : String(s);
    return d.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function programmeLabel(lesson) {
    if (!lesson) return '';
    if (lesson.programme_index && lesson.programme_count) {
      return lesson.programme_index + ' of ' + lesson.programme_count;
    }
    return lesson.programme_title || '';
  }

  function sortLessons(lessons) {
    return (lessons || []).slice().sort(function (a, b) {
      var ia = AUDIENCE_ORDER.indexOf(a.audience);
      var ib = AUDIENCE_ORDER.indexOf(b.audience);
      if (ia === -1) ia = 99;
      if (ib === -1) ib = 99;
      if (ia !== ib) return ia - ib;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }

  function assetUrl(path) {
    try {
      return new URL(path, global.location.origin).href;
    } catch (e) {
      return path;
    }
  }

  function printCss() {
    return [
      ':root{--navy:#1A2238;--blue:#2A3990;--accent:#4A90E2;--ink:#333;--muted:#555;--line:#d0d5dd;--paper:#fff;--tint:#EEF0F7}',
      '*{box-sizing:border-box}',
      'html,body{margin:0;padding:0;background:#fff;color:var(--navy);font-family:Montserrat,Arial,Helvetica,sans-serif}',
      'body{font-size:11pt;line-height:1.45}',
      'h1,h2,h3{margin:0;color:var(--navy)}',
      '.brand{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:10px;border-bottom:3px solid var(--navy);margin-bottom:14px}',
      '.brand-left{display:flex;align-items:center;gap:10px}',
      '.brand img{width:36px;height:36px}',
      '.brand-name{font-weight:800;letter-spacing:.04em;text-transform:uppercase;font-size:11px}',
      '.brand-meta{text-align:right;font-size:10px;color:var(--muted);font-weight:600}',
      '.eyebrow{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:4px}',
      '.hero{background:linear-gradient(135deg,var(--navy) 0%,var(--blue) 100%);color:#fff;border-radius:12px;padding:18px 20px;margin-bottom:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.hero h1{color:#fff;font-size:22px;font-weight:800}',
      '.hero p{margin:6px 0 0;opacity:.92;font-size:11px}',
      '.pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
      '.pill{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);color:#fff;border-radius:999px;padding:3px 10px;font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}',
      '.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:0 0 14px}',
      '.card{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fff}',
      '.card h3{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);margin-bottom:6px}',
      '.card p{margin:0;color:var(--ink);font-size:10.5px}',
      '.run{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:14px}',
      '.run-row{display:grid;grid-template-columns:78px 1fr;gap:10px;padding:8px 12px;border-bottom:1px solid #eee}',
      '.run-row:nth-child(odd){background:var(--tint);-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.run-row:last-child{border-bottom:0}',
      '.run-time{font-weight:800;color:var(--blue);font-variant-numeric:tabular-nums;font-size:10px}',
      '.run-label{font-weight:700;font-size:11px}',
      '.run-detail{color:var(--muted);font-size:10px}',
      '.equip{display:flex;flex-wrap:wrap;gap:6px}',
      '.equip span{border:1px solid var(--line);background:var(--tint);border-radius:6px;padding:3px 8px;font-size:9px;font-weight:600}',
      '.note{border-left:4px solid var(--blue);background:var(--tint);padding:10px 14px;border-radius:0 10px 10px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.note h3{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);margin-bottom:4px}',
      '.note p{margin:0;font-size:10.5px}',
      '.foot{margin-top:12px;text-align:center;font-size:9px;color:#888}',
      '.sheet{height:277mm;display:flex;flex-direction:column}',
      '.half{flex:1;border:1.5px solid var(--navy);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;min-height:0}',
      '.half + .half{margin-top:8px}',
      '.half-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid var(--navy)}',
      '.half-head h2{font-size:15px;font-weight:800}',
      '.slot{font-weight:800;color:var(--blue);font-size:12px;font-variant-numeric:tabular-nums}',
      '.half-grid{display:grid;grid-template-columns:42% 1fr;gap:10px;flex:1;min-height:0}',
      '.spine-row{display:grid;grid-template-columns:52px 1fr;gap:6px;padding:3px 0;border-bottom:1px dotted #ccc;font-size:9.5px}',
      '.spine-row:last-child{border-bottom:0}',
      '.right h3{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);margin:8px 0 3px}',
      '.right h3:first-child{margin-top:0}',
      '.right p{margin:0;font-size:10px;color:var(--ink)}',
      '.good{font-weight:700}',
      '.reminders{margin-top:8px;display:flex;flex-wrap:wrap;gap:5px}',
      '.reminders span{font-size:8px;font-weight:600;background:var(--tint);border-radius:999px;padding:3px 8px;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '@page{size:A4;margin:10mm}',
      '@media print{html,body{height:auto} a{color:inherit;text-decoration:none}}'
    ].join('');
  }

  function docShell(title, bodyHtml) {
    return '<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8">' +
      '<title>' + esc(title) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">' +
      '<style>' + printCss() + '</style></head><body>' + bodyHtml +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},250);});<\/script></body></html>';
  }

  function spineOf(lesson) {
    if (!lesson) return null;
    var nested = lesson.spines;
    if (Array.isArray(nested)) return nested[0] || null;
    if (nested && typeof nested === 'object') return nested;
    if (Array.isArray(lesson.spine_steps)) {
      return { slug: lesson.spine_slug || null, steps: lesson.spine_steps };
    }
    return null;
  }

  function nextTitleFor(lesson, pool) {
    if (lesson && lesson.programme_next_title) return lesson.programme_next_title;
    if (lesson && lesson.programme_wrap_title) return lesson.programme_wrap_title;
    return null;
  }

  function defaultCuePack(lesson) {
    var packs = lesson && Array.isArray(lesson.cue_packs) ? lesson.cue_packs : [];
    var i;
    for (i = 0; i < packs.length; i++) {
      if (packs[i] && packs[i].is_default) return packs[i];
    }
    return packs[0] || null;
  }

  function applyCuePack(lesson, pack) {
    var copy = Object.assign({}, lesson);
    if (pack) {
      if (pack.objective) copy.objective = pack.objective;
      if (pack.success_check) copy.success_check = pack.success_check;
      if (Array.isArray(pack.cues) && pack.cues.length) {
        copy.step_details = Object.assign({}, copy.step_details || {}, { Cues: pack.cues.join('\n') });
      }
      copy._cuePack = pack;
    }
    return copy;
  }

  function nestedRow(value) {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
  }

  function gameLine(game) {
    if (!game) return '';
    var title = game.title || '';
    var body = game.setup || game.blurb || '';
    if (title && body) return title + '. ' + body;
    return title || body;
  }

  function gameShort(game) {
    if (!game) return '';
    var title = game.title || '';
    var body = game.blurb || '';
    if (title && body) return title + '. ' + body;
    return title || body;
  }

  function coachingHour(spine) {
    return !!(spine && spine.slug === 'coaching-hour');
  }

  function composeRunSheet(lesson, options) {
    options = options || {};
    var nextTitle = options.nextTitle || null;
    var spine = options.spine || spineOf(lesson);
    var coaching = coachingHour(spine);
    var details = lesson.step_details || {};
    var steps = spine && Array.isArray(spine.steps) ? spine.steps : [];
    if (steps.length) {
      return steps.map(function (step) {
        var label = step.label;
        var overlay = details[label];
        var detail;
        if (overlay != null && String(overlay).trim() !== '') {
          detail = overlay;
        } else if (label === 'Warm up with a ball') {
          var parts = [];
          if (coaching) {
            if (step.default_detail) parts.push(step.default_detail);
          } else if (lesson.objective) {
            parts.push('One sentence, then they hit: ' + lesson.objective);
          }
          if (lesson.warmup_game) parts.push(gameLine(lesson.warmup_game));
          else if (!coaching && step.default_detail) parts.push(step.default_detail);
          detail = parts.filter(Boolean).join(' ');
        } else if (label === 'Name what you saw') {
          detail = [step.default_detail, lesson.objective ? ('Planned theme, for you: ' + lesson.objective) : '']
            .filter(Boolean).join(' ');
        } else if (label === 'Name the focus' && lesson.objective) {
          detail = 'One sentence, then they hit: ' + lesson.objective;
        } else if (label === 'Open' && lesson.differentiation) {
          detail = [step.default_detail, lesson.differentiation].filter(Boolean).join(' ');
        } else if (label === 'Conditioned game' && lesson.conditioned_game) {
          detail = gameLine(lesson.conditioned_game);
        } else if (label === 'Close' && nextTitle) {
          if (coaching) {
            var named = step.default_detail || 'Each player names what they are now doing differently.';
            if (lesson.programme_wrap_title && nextTitle === lesson.programme_wrap_title) {
              detail = named + ' Back to the start of this programme: ' + nextTitle + '.';
            } else {
              detail = named + ' Next in this programme is ' + nextTitle + '.';
            }
          } else if (lesson.programme_wrap_title && nextTitle === lesson.programme_wrap_title) {
            detail = 'Restate the focus. Back to the start of this programme: ' + nextTitle + '.';
          } else {
            detail = 'Restate the focus. Next in this programme is ' + nextTitle + '.';
          }
        } else {
          detail = step.default_detail || '';
        }
        return { from: step.from, to: step.to, label: label, detail: detail };
      });
    }
    if (Array.isArray(lesson.run_sheet) && lesson.run_sheet.length) return lesson.run_sheet;
    return [];
  }

  function withComposedRunSheet(lesson, pool) {
    var copy = applyCuePack(lesson, lesson._cuePack || defaultCuePack(lesson));
    copy.warmup_game = nestedRow(copy.warmup_game);
    copy.conditioned_game = nestedRow(copy.conditioned_game);
    var coaching = copy._runMode === 'coaching' && copy._overrideSpine;
    var spine = coaching ? copy._overrideSpine : spineOf(copy);
    copy.run_sheet = composeRunSheet(copy, {
      spine: spine,
      nextTitle: nextTitleFor(copy, pool)
    });
    if (coaching) {
      copy.session_kind = 'coaching';
      if (spine.duration_min) copy.duration_min = spine.duration_min;
      if (spine.group_size_max) copy.group_size_max = spine.group_size_max;
    } else {
      if (!copy.duration_min && spine && spine.duration_min) copy.duration_min = spine.duration_min;
      if (!copy.group_size_max && spine && spine.group_size_max) copy.group_size_max = spine.group_size_max;
    }
    return copy;
  }

  function applyComposedRunSheets(lessons) {
    var list = lessons || [];
    return list.map(function (lesson) {
      return withComposedRunSheet(lesson, list);
    });
  }

  function pills(lesson) {
    var items = [
      lesson.audience,
      lesson.duration_min ? lesson.duration_min + ' min' : null,
      lesson.group_size_max ? 'Up to ' + lesson.group_size_max : null,
      lesson.game_situation,
      lesson.phase,
      lesson.tactic
    ].filter(Boolean);
    return items.map(function (t) { return '<span class="pill">' + esc(t) + '</span>'; }).join('');
  }

  function cueItems(lesson) {
    var pack = lesson._cuePack || defaultCuePack(lesson);
    if (pack && Array.isArray(pack.cues) && pack.cues.length) {
      return pack.cues.map(function (line) {
        return String(line).replace(/^[-•\u2022]\s*/, '').trim();
      }).filter(Boolean).slice(0, 3);
    }
    var raw = lesson.step_details && lesson.step_details.Cues;
    if (!raw) return [];
    return String(raw).split(/\n+/).map(function (line) {
      return line.replace(/^[-•\u2022]\s*/, '').trim();
    }).filter(Boolean).slice(0, 3);
  }

  function cuesBlock(lesson) {
    var items = cueItems(lesson);
    if (!items.length) return '';
    return '<h3>Cues</h3><ul style="margin:0 0 8px 16px;padding:0;font-size:11px">' +
      items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') +
      '</ul>';
  }

  function cuesCard(lesson) {
    var items = cueItems(lesson);
    if (!items.length) return '';
    return '<div class="card" style="margin-bottom:14px"><h3>Cues</h3><ul style="margin:0 0 0 18px;padding:0">' +
      items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') +
      '</ul></div>';
  }

  function overlayRows(lesson) {
    var want = { Flavour: true, Demo: true, Closed: true, 'Conditioned game': true };
    var details = lesson.step_details || {};
    return (Array.isArray(lesson.run_sheet) ? lesson.run_sheet : []).filter(function (step) {
      return want[step.label] && details[step.label];
    });
  }

  function runRows(lesson, withDetail) {
    var rows = Array.isArray(lesson.run_sheet) ? lesson.run_sheet : [];
    if (!rows.length) {
      return '<div class="run-row"><div></div><div>No run sheet on this plan yet.</div></div>';
    }
    return rows.map(function (step) {
      return '<div class="' + (withDetail ? 'run-row' : 'spine-row') + '">' +
        '<div class="run-time">' + esc(step.from) + '–' + esc(step.to) + '</div>' +
        '<div><div class="run-label">' + esc(step.label) + '</div>' +
        (withDetail && step.detail ? '<div class="run-detail">' + esc(step.detail) + '</div>' : '') +
        '</div></div>';
    }).join('');
  }

  function fullPlanHtml(lesson) {
    var logo = assetUrl('images/Icon.png');
    var dateLabel = programmeLabel(lesson);
    var equip = Array.isArray(lesson.equipment) ? lesson.equipment : [];
    var note = (lesson.coach_note || '').trim();
    var body =
      '<div class="brand"><div class="brand-left"><img src="' + esc(logo) + '" alt="">' +
      '<div><div class="brand-name">Padel Pals</div><div class="eyebrow" style="margin:0">Coach Planner</div></div></div>' +
      '<div class="brand-meta">' + esc(dateLabel) + '<br>padelpals.app</div></div>' +
      '<div class="hero"><h1>' + esc(lesson.title) + '</h1>' +
      (lesson.audience ? '<p>' + esc(lesson.audience) + (programmeLabel(lesson) ? ' · ' + esc(programmeLabel(lesson)) : '') + '</p>' : '') +
      '<div class="pills">' + pills(lesson) + '</div></div>' +
      '<div class="grid-3">' +
      '<div class="card"><h3>Objective</h3><p>' + esc(lesson.objective || '') + '</p></div>' +
      '<div class="card"><h3>What good looks like</h3><p>' + esc(lesson.success_check || '') + '</p></div>' +
      '<div class="card"><h3>Differentiation</h3><p>' + esc(lesson.differentiation || '') + '</p></div>' +
      '</div>' +
      cuesCard(lesson) +
      '<div class="card" style="margin-bottom:14px;padding:0"><div class="run" style="border:0;margin:0">' +
      runRows(lesson, true) + '</div></div>' +
      '<div class="card" style="margin-bottom:14px"><h3>Equipment</h3><div class="equip">' +
      (equip.length ? equip.map(function (e) { return '<span>' + esc(e) + '</span>'; }).join('') : '<span>Balls and cones</span>') +
      '</div></div>' +
      (note ? '<div class="note"><h3>Coach note</h3><p>' + esc(note) + '</p></div>' : '') +
      '<div class="foot">Padel Pals · padelpals.app · Print at 100%, not fit-to-page</div>';
    return docShell((lesson.title || 'Lesson') + ' · Coach Planner', body);
  }

  function halfHtml(lesson) {
    var warmup = gameShort(nestedRow(lesson.warmup_game));
    var conditioned = gameShort(nestedRow(lesson.conditioned_game));
    return '<section class="half">' +
      '<div class="half-head"><div><div class="eyebrow">Coach Planner</div>' +
      '<h2>' + esc(lesson.title) + '</h2>' +
      '<div style="font-size:10px;color:var(--muted);font-weight:600;margin-top:2px">' +
      esc(lesson.audience || '') +
      (lesson.group_size_max ? ' · max ' + esc(lesson.group_size_max) : '') +
      '</div></div><div class="slot">' + esc(programmeLabel(lesson)) + '</div></div>' +
      '<div class="half-grid"><div>' + runRows(lesson, false) + '</div>' +
      '<div class="right">' +
      '<h3>' + (lesson.session_kind === 'coaching' ? 'Planned theme' : 'Announce') + '</h3><p>' + esc(lesson.objective || '') + '</p>' +
      cuesBlock(lesson) +
      '<h3>Framework</h3><p>' +
      [lesson.game_situation, lesson.phase, lesson.tactic].filter(Boolean).map(esc).join(' · ') +
      '</p>' +
      '<h3>Good is</h3><p class="good">' + esc(lesson.success_check || '') + '</p>' +
      (lesson.differentiation ? '<h3>STEP</h3><p>' + esc(lesson.differentiation) + '</p>' : '') +
      (warmup ? '<h3>Warm up</h3><p>' + esc(warmup) + '</p>' : '') +
      overlayRows(lesson).map(function (step) {
        return '<h3>' + esc(step.label) + '</h3><p>' + esc(step.detail) + '</p>';
      }).join('') +
      (conditioned && lesson.session_kind !== 'coaching' ? '<h3>Conditioned game</h3><p>' + esc(conditioned) + '</p>' : '') +
      '</div></div></section>';
  }

  function courtSheetHtml(lessons) {
    var list = sortLessons(lessons).slice(0, 2);
    if (!list.length) return '';
    var logo = assetUrl('images/Icon.png');
    var dateLabel = programmeLabel(list[0]) || (list[0].audience || '');
    var title = list[0].title || 'Court sheet';
    var body =
      '<div class="sheet"><div class="brand"><div class="brand-left"><img src="' + esc(logo) + '" alt="">' +
      '<div><div class="brand-name">Padel Pals</div><div class="eyebrow" style="margin:0">Court sheet</div></div></div>' +
      '<div class="brand-meta">' + esc(dateLabel) + '<br>Print at 100%</div></div>' +
      list.map(halfHtml).join('') +
      '<div class="reminders">' + REMINDERS.map(function (r) { return '<span>' + esc(r) + '</span>'; }).join('') + '</div>' +
      '</div>';
    return docShell(title, body);
  }

  function openPrint(html) {
    var win = global.open('', '_blank');
    if (!win) {
      global.alert('Please allow pop-ups to print this plan.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  global.CoachPlannerPrint = {
    formatDate: formatDate,
    programmeLabel: programmeLabel,
    defaultCuePack: defaultCuePack,
    applyCuePack: applyCuePack,
    sortLessons: sortLessons,
    spineOf: spineOf,
    composeRunSheet: composeRunSheet,
    withComposedRunSheet: withComposedRunSheet,
    applyComposedRunSheets: applyComposedRunSheets,
    printFull: function (lesson, pool) {
      openPrint(fullPlanHtml(withComposedRunSheet(lesson, pool || [lesson])));
    },
    printCourtSheet: function (lessons) {
      openPrint(courtSheetHtml(applyComposedRunSheets(lessons)));
    }
  };
})(window);

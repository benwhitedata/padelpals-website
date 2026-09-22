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
      ':root{--navy:#1A2238;--blue:#2A3990;--gold:#F6C915;--ink:#333;--muted:#555;--line:#d0d5dd;--tint:#EEF0F7}',
      '*{box-sizing:border-box}',
      'html,body{margin:0;padding:0;background:#fff;color:var(--navy);font-family:Montserrat,Arial,Helvetica,sans-serif}',
      'body{font-size:10pt;line-height:1.28}',
      'h1,h2,h3{margin:0;color:var(--navy)}',
      '.head{display:flex;align-items:flex-start;justify-content:space-between;gap:10pt;padding-bottom:4pt;border-bottom:2px solid var(--navy)}',
      '.brand{display:flex;align-items:center;gap:6pt}',
      '.brand img{width:18pt;height:18pt}',
      '.brand-name{font-weight:800;letter-spacing:.04em;text-transform:uppercase;font-size:7.5pt;color:var(--blue)}',
      '.head h1{font-size:15pt;font-weight:800;line-height:1.1;margin-top:1pt}',
      '.meta{text-align:right;font-size:8.5pt;font-weight:600;color:var(--muted);line-height:1.25;max-width:46%}',
      '.say{margin:5pt 0 4pt;padding:4pt 8pt;background:var(--tint);border-left:3px solid var(--gold);-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.say span{display:block;font-size:7.5pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--blue)}',
      '.say strong{display:block;margin-top:1pt;font-size:12.5pt;font-weight:700;line-height:1.22}',
      '.cues{display:grid;gap:5pt;margin:4pt 0}',
      '.cue{border:1px solid var(--line);border-radius:4px;padding:4pt 6pt;font-size:10pt;line-height:1.25}',
      '.cue b{display:block;color:var(--blue);font-size:8pt;margin-bottom:1pt}',
      '.why{margin:0 0 4pt;font-size:9.5pt;line-height:1.28;color:var(--ink)}',
      '.hour{margin-top:1pt}',
      '.hour h2{font-size:7.5pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);margin-bottom:1pt}',
      '.step{display:grid;grid-template-columns:48pt 1fr;gap:6pt;padding:2.5pt 0;border-bottom:1px solid #e6e8ee;break-inside:avoid;page-break-inside:avoid}',
      '.step:last-child{border-bottom:0}',
      '.step-time{font-weight:800;color:var(--blue);font-variant-numeric:tabular-nums;font-size:9.5pt}',
      '.step-label{font-weight:700;font-size:10pt}',
      '.step-detail{margin-top:0;font-size:9.5pt;line-height:1.25;color:var(--ink)}',
      '.band{display:grid;gap:5pt;margin-top:5pt}',
      '.band article{background:var(--tint);border-radius:4px;padding:4pt 6pt;break-inside:avoid;page-break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.band h3{font-size:7.5pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--blue);margin-bottom:1pt}',
      '.band p{margin:0;font-size:9pt;line-height:1.25}',
      '.band ul{margin:0 0 0 11pt;padding:0;font-size:9pt;line-height:1.25}',
      '.band li{margin:0}',
      '.note{margin-top:4pt;padding:3pt 7pt;border-left:3px solid var(--blue);background:var(--tint);font-size:9.5pt;line-height:1.25;-webkit-print-color-adjust:exact;print-color-adjust:exact;break-inside:avoid}',
      '.note strong{display:block;font-size:7.5pt;letter-spacing:.1em;text-transform:uppercase;color:var(--blue);margin-bottom:1pt}',
      '.quiet{margin-top:4pt;font-size:8pt;line-height:1.3;color:var(--muted)}',
      '.foot{margin-top:2pt;text-align:center;font-size:7pt;color:#888}',
      '@page{size:A4;margin:8mm}',
      '@media print{a{color:inherit;text-decoration:none}}'
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

  function watchItems(lesson) {
    var pack = lesson._cuePack || defaultCuePack(lesson);
    if (!pack || pack.watch == null) return [];
    var raw = Array.isArray(pack.watch) ? pack.watch : String(pack.watch).split(/\n+/);
    return raw.map(function (line) {
      return String(line).replace(/^[-•\u2022]\s*/, '').trim();
    }).filter(Boolean).slice(0, 3);
  }

  function whyText(lesson) {
    var pack = lesson._cuePack || defaultCuePack(lesson);
    return pack && pack.why ? String(pack.why).trim() : '';
  }

  function metaLine(lesson) {
    var hour = programmeLabel(lesson);
    return [
      lesson.audience || '',
      hour ? ('Hour ' + hour) : '',
      lesson.duration_min ? lesson.duration_min + ' min' : '',
      lesson.group_size_max ? 'Up to ' + lesson.group_size_max : ''
    ].filter(Boolean).join(' · ');
  }

  function cueCards(lesson) {
    var items = cueItems(lesson);
    if (!items.length) return '';
    return '<div class="cues" style="grid-template-columns:repeat(' + items.length + ',minmax(0,1fr))">' +
      items.map(function (line, i) {
        return '<div class="cue"><b>' + (i + 1) + '</b>' + esc(line) + '</div>';
      }).join('') + '</div>';
  }

  function hourRows(lesson) {
    var rows = Array.isArray(lesson.run_sheet) ? lesson.run_sheet : [];
    if (!rows.length) return '<p class="why">No run sheet on this plan yet.</p>';
    return rows.map(function (step) {
      return '<div class="step"><div class="step-time">' + esc(step.from) + '–' + esc(step.to) + '</div>' +
        '<div><div class="step-label">' + esc(step.label) + '</div>' +
        (step.detail ? '<div class="step-detail">' + esc(step.detail) + '</div>' : '') +
        '</div></div>';
    }).join('');
  }

  function sheetHtml(lesson) {
    var logo = assetUrl('images/Icon.png');
    var coaching = lesson.session_kind === 'coaching';
    var sayLabel = coaching ? 'Planned theme' : 'Say this';
    var why = whyText(lesson);
    var watch = watchItems(lesson);
    var good = (lesson.success_check || '').trim();
    var step = (lesson.differentiation || '').trim();
    var note = (lesson.coach_note || '').trim();
    var equip = Array.isArray(lesson.equipment) && lesson.equipment.length ? lesson.equipment : ['Balls and cones'];
    var band = '';
    var bandCount = 0;
    if (good) {
      band += '<article><h3>What good looks like</h3><p>' + esc(good) + '</p></article>';
      bandCount += 1;
    }
    if (watch.length) {
      band += '<article><h3>If you see this</h3><ul>' +
        watch.map(function (line) { return '<li>' + esc(line) + '</li>'; }).join('') +
        '</ul></article>';
      bandCount += 1;
    }
    if (step) {
      band += '<article><h3>STEP</h3><p>' + esc(step) + '</p></article>';
      bandCount += 1;
    }
    var body =
      '<header class="head"><div><div class="brand"><img src="' + esc(logo) + '" alt="">' +
      '<div class="brand-name">Padel Pals</div></div>' +
      '<h1>' + esc(lesson.title || 'Lesson') + '</h1></div>' +
      '<p class="meta">' + esc(metaLine(lesson)) + '</p></header>' +
      '<section class="say"><span>' + esc(sayLabel) + '</span><strong>' + esc(lesson.objective || '') + '</strong></section>' +
      cueCards(lesson) +
      (why ? '<p class="why">' + esc(why) + '</p>' : '') +
      '<section class="hour"><h2>The hour</h2>' + hourRows(lesson) + '</section>' +
      (band ? '<section class="band" style="grid-template-columns:repeat(' + bandCount + ',minmax(0,1fr))">' + band + '</section>' : '') +
      (note ? '<div class="note"><strong>Coach note</strong>' + esc(note) + '</div>' : '') +
      '<p class="quiet">Equipment: ' + esc(equip.join(', ')) + '. ' +
      REMINDERS.map(esc).join(' · ') + '.</p>' +
      '<p class="foot">Print at 100%, not fit-to-page</p>';
    return docShell((lesson.title || 'Lesson') + ' · Coach Planner', body);
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
    printSheet: function (lesson, pool) {
      openPrint(sheetHtml(withComposedRunSheet(lesson, pool || [lesson])));
    }
  };
})(window);

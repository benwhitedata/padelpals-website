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
      '/* Press colour, unprofiled starting values for the printer. Navy #1A2238 C90 M78 Y42 K62. Blue #2A3990 C92 M78 Y0 K8. Gold #F6C915 C4 M22 Y95 K0. Tint #EEF0F7 C4 M3 Y0 K0. */',
      ':root{--navy:#1A2238;--blue:#2A3990;--gold:#F6C915;--ink:#333;--muted:#555;--line:#d0d5dd;--tint:#EEF0F7}',
      '*{box-sizing:border-box}',
      'html,body{margin:0;padding:0;background:#fff;color:var(--navy);font-family:Montserrat,Arial,Helvetica,sans-serif}',
      'body{font-size:10pt;line-height:1.3}',
      'h1,h2,h3,p{margin:0}',
      '.face{position:relative;width:154mm;height:216mm;overflow:hidden;background:#fff}',
      '.face+.face{break-before:page;page-break-before:always}',
      '.marks{position:absolute;inset:0;z-index:3;pointer-events:none}',
      '.marks span{position:absolute;background:#111}',
      '.marks .tlh,.marks .trh,.marks .blh,.marks .brh{height:.5pt;width:2mm}',
      '.marks .tlv,.marks .trv,.marks .blv,.marks .brv{width:.5pt;height:2mm}',
      '.marks .tlh,.marks .trh{top:3mm;margin-top:-.25pt}',
      '.marks .blh,.marks .brh{bottom:3mm;margin-bottom:-.25pt}',
      '.marks .tlv,.marks .trv{top:0}',
      '.marks .blv,.marks .brv{bottom:0}',
      '.marks .tlh,.marks .blh{left:0}',
      '.marks .trh,.marks .brh{right:0}',
      '.marks .tlv,.marks .blv{left:3mm;margin-left:-.25pt}',
      '.marks .trv,.marks .brv{right:3mm;margin-right:-.25pt}',
      '.mast{position:absolute;top:0;left:0;right:0;height:50mm;background:var(--navy);-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.safe{position:absolute;top:13mm;right:13mm;bottom:13mm;left:13mm;z-index:1;display:flex;flex-direction:column}',
      '.brand{display:flex;align-items:center;gap:6pt}',
      '.brand img{width:20pt;height:20pt}',
      '.brand-name{font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:8pt;color:var(--gold)}',
      '.court header{color:#fff;min-height:33mm}',
      '.court header h1{margin-top:4pt;font-size:16pt;font-weight:800;line-height:1.15;color:#fff}',
      '.meta{margin-top:3pt;font-size:8.5pt;font-weight:600;line-height:1.3;color:rgba(255,255,255,.9)}',
      '.say{margin:0 0 7pt;padding:7pt 9pt;background:var(--tint);border-left:3pt solid var(--gold);-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.say span,.band h3,.hour h2,.tail h2,.note strong,.quiet-head p{display:block;font-size:8pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--blue)}',
      '.say strong{display:block;margin-top:2pt;font-size:15pt;font-weight:700;line-height:1.25;color:var(--navy)}',
      '.cues{display:flex;flex-direction:column;gap:4pt;margin:0 0 7pt}',
      '.cue{display:grid;grid-template-columns:14pt 1fr;gap:5pt;align-items:start;padding:4pt 0;border-bottom:.5pt solid var(--line);font-size:11pt;line-height:1.3}',
      '.cue:last-child{border-bottom:0}',
      '.cue b{color:var(--blue);font-size:11pt}',
      '.band{display:flex;flex-direction:column;gap:5pt}',
      '.band article{background:var(--tint);padding:5pt 7pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.band h3{margin-bottom:2pt}',
      '.band p{font-size:10pt;line-height:1.3}',
      '.band ul{margin:0 0 0 12pt;padding:0;font-size:10pt;line-height:1.3}',
      '.band li{margin:0}',
      '.quiet-head{padding-bottom:4pt;margin-bottom:6pt;border-bottom:.5pt solid var(--navy)}',
      '.quiet-head h1{margin-top:2pt;font-size:13pt;font-weight:800;line-height:1.15;color:var(--navy)}',
      '.why{margin:0 0 4pt;font-size:10pt;line-height:1.3;color:var(--ink)}',
      '.hour h2{margin-bottom:2pt}',
      '.hour-rows{display:flex;flex-direction:column}',
      '.step{display:grid;grid-template-columns:40pt 1fr;gap:6pt;padding:2pt 0;border-bottom:.5pt solid var(--line);break-inside:avoid}',
      '.step:last-child{border-bottom:0}',
      '.step-time{font-weight:800;color:var(--blue);font-variant-numeric:tabular-nums;font-size:10pt}',
      '.step-label{font-weight:700;font-size:10.5pt;line-height:1.25}',
      '.step-detail{margin-top:1pt;font-size:10pt;line-height:1.3;color:var(--ink)}',
      '.note{margin-top:5pt;padding:4pt 7pt;border-left:2pt solid var(--blue);background:var(--tint);font-size:10pt;line-height:1.3;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.note strong{margin-bottom:1pt}',
      '.tail{margin-top:4pt}',
      '.tail h2{margin-bottom:2pt}',
      '.equip{margin:0 0 3pt;font-size:9.5pt;line-height:1.3;color:var(--ink)}',
      '.reminders{margin:0;padding:0 0 0 12pt;columns:2;column-gap:10pt;font-size:9pt;line-height:1.3;color:var(--ink)}',
      '.reminders li{margin:0;break-inside:avoid}',
      '.safe.tight .step{padding:1.5pt 0}',
      '.safe.tight .why{font-size:9.5pt;line-height:1.25}',
      '.safe.tight .reminders{font-size:8pt;line-height:1.25}',
      '.safe.dense .step-detail{font-size:9pt;line-height:1.2}',
      '.safe.dense .step-label{font-size:10pt}',
      '.safe.columns .hour-rows{display:block;column-count:2;column-gap:8pt}',
      '.safe.packed .why{font-size:9pt;line-height:1.2;margin-bottom:2pt}',
      '.safe.packed .step{padding:1pt 0}',
      '.safe.packed .note{margin-top:3pt;padding:2pt 6pt;font-size:9pt}',
      '.safe.packed .quiet-head{margin-bottom:3pt;padding-bottom:2pt}',
      '.safe.packed .tail{margin-top:3pt}',
      '.foot{margin-top:auto;padding-top:4pt;border-top:1.5pt solid var(--gold);text-align:center;font-size:8pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue)}',
      '@page{size:154mm 216mm;margin:0}',
      '@media screen{html,body{background:#cfd3dc}body{display:flex;flex-direction:column;align-items:center;gap:10mm;padding:10mm 0}.face{box-shadow:0 10px 28px rgba(26,34,56,.22)}}',
      '@media print{a{color:inherit;text-decoration:none}*{ -webkit-print-color-adjust:exact;print-color-adjust:exact}}'
    ].join('');
  }

  function docShell(title, bodyHtml) {
    return '<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8">' +
      '<title>' + esc(title) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">' +
      '<style>' + printCss() + '</style></head><body>' + bodyHtml +
      '<script>window.addEventListener("load",function(){var go=function(){document.querySelectorAll(".safe").forEach(function(safe){["tight","dense","columns","packed"].forEach(function(name){if(safe.scrollHeight>safe.clientHeight+1)safe.classList.add(name);});});setTimeout(function(){window.print();},250);};if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go);}else{go();}});<\/script></body></html>';
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

  function cropMarks() {
    return '<div class="marks" aria-hidden="true">' +
      '<span class="tlh"></span><span class="tlv"></span>' +
      '<span class="trh"></span><span class="trv"></span>' +
      '<span class="blh"></span><span class="blv"></span>' +
      '<span class="brh"></span><span class="brv"></span></div>';
  }

  function cueCards(lesson) {
    var items = cueItems(lesson);
    if (!items.length) return '';
    return '<div class="cues">' +
      items.map(function (line, i) {
        return '<div class="cue"><b>' + (i + 1) + '</b><span>' + esc(line) + '</span></div>';
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
    if (good) {
      band += '<article><h3>What good looks like</h3><p>' + esc(good) + '</p></article>';
    }
    if (watch.length) {
      band += '<article><h3>If you see this</h3><ul>' +
        watch.map(function (line) { return '<li>' + esc(line) + '</li>'; }).join('') +
        '</ul></article>';
    }
    if (step) {
      band += '<article><h3>STEP</h3><p>' + esc(step) + '</p></article>';
    }
    var title = esc(lesson.title || 'Lesson');
    var court =
      '<section class="face court">' + cropMarks() +
      '<div class="mast"></div>' +
      '<div class="safe">' +
      '<header><div class="brand"><img src="' + esc(logo) + '" alt="">' +
      '<div class="brand-name">Padel Pals</div></div>' +
      '<h1>' + title + '</h1>' +
      '<p class="meta">' + esc(metaLine(lesson)) + '</p></header>' +
      '<section class="say"><span>' + esc(sayLabel) + '</span><strong>' + esc(lesson.objective || '') + '</strong></section>' +
      cueCards(lesson) +
      (band ? '<section class="band">' + band + '</section>' : '') +
      '</div></section>';
    var hour =
      '<section class="face hour-face">' + cropMarks() +
      '<div class="safe">' +
      '<header class="quiet-head"><p>Padel Pals</p><h1>' + title + '</h1></header>' +
      (why ? '<p class="why">' + esc(why) + '</p>' : '') +
      '<section class="hour"><h2>The hour</h2><div class="hour-rows">' + hourRows(lesson) + '</div></section>' +
      (note ? '<div class="note"><strong>Coach note</strong>' + esc(note) + '</div>' : '') +
      '<div class="tail"><h2>Before you start</h2>' +
      '<p class="equip">Equipment: ' + esc(equip.join(', ')) + '.</p>' +
      '<ul class="reminders">' + REMINDERS.map(function (line) {
        return '<li>' + esc(line) + '</li>';
      }).join('') + '</ul></div>' +
      '<p class="foot">padelpals.app</p>' +
      '</div></section>';
    return docShell((lesson.title || 'Lesson') + ' · Coach Planner', court + hour);
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

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
    'Rotate partners every round'
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
      '.face{position:relative;width:148mm;height:210mm;overflow:hidden;background:#fff}',
      '.face+.face{break-before:page;page-break-before:always}',
      '.mast{position:absolute;top:0;left:0;right:0;height:50mm;background:var(--navy);-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.safe{position:absolute;top:10mm;right:10mm;bottom:10mm;left:10mm;z-index:1;display:flex;flex-direction:column}',
      '.brand{display:flex;align-items:center;gap:6pt}',
      '.brand img{width:20pt;height:20pt}',
      '.brand-name{font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:8pt;color:var(--gold)}',
      '.court header{color:#fff;min-height:33mm}',
      '.court header h1{margin-top:4pt;font-size:16pt;font-weight:800;line-height:1.15;color:#fff}',
      '.meta{margin-top:3pt;font-size:10pt;font-weight:600;line-height:1.3;color:rgba(255,255,255,.9)}',
      '.say{margin:0 0 7pt;padding:7pt 9pt;background:var(--tint);border-left:3pt solid var(--gold);-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.say span,.band h3,.hour h2,.tail h2,.note strong,.quiet-head p{display:block;font-size:8pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--blue)}',
      '.say strong{display:block;margin-top:2pt;font-size:13pt;font-weight:700;line-height:1.25;color:var(--navy)}',
      '.cues{display:flex;flex-direction:column;gap:4pt;margin:0 0 7pt}',
      '.cue{display:grid;grid-template-columns:14pt 1fr;gap:5pt;align-items:start;padding:4pt 0;border-bottom:.5pt solid var(--line);font-size:10pt;line-height:1.3}',
      '.cue:last-child{border-bottom:0}',
      '.cue b{color:var(--blue);font-size:10pt}',
      '.band{display:flex;flex-direction:column;gap:5pt}',
      '.band article{background:var(--tint);padding:5pt 7pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.band h3{margin-bottom:2pt}',
      '.band p{font-size:10pt;line-height:1.3}',
      '.band ul{margin:0 0 0 12pt;padding:0;font-size:10pt;line-height:1.3}',
      '.band li{margin:0}',
      '.quiet-head{padding-bottom:4pt;margin-bottom:6pt;border-bottom:.5pt solid var(--navy)}',
      '.quiet-head h1{margin-top:2pt;font-size:16pt;font-weight:800;line-height:1.15;color:var(--navy)}',
      '.why{margin:0 0 4pt;font-size:10pt;line-height:1.3;color:var(--ink)}',
      '.hour-face.coaching .why,.hour-face.coaching .step-time,.hour-face.coaching .step-label,.hour-face.coaching .step-detail,.hour-face.coaching .note,.hour-face.coaching .equip,.hour-face.coaching .reminders{font-size:8pt;line-height:1.25}',
      '.hour h2{margin-bottom:2pt}',
      '.hour-rows{display:flex;flex-direction:column}',
      '.step{display:grid;grid-template-columns:40pt 1fr;gap:6pt;padding:2pt 0;border-bottom:.5pt solid var(--line);break-inside:avoid}',
      '.step:last-child{border-bottom:0}',
      '.step-time{font-weight:800;color:var(--blue);font-variant-numeric:tabular-nums;font-size:10pt}',
      '.step-label{font-weight:700;font-size:10pt;line-height:1.25}',
      '.step-detail{margin-top:1pt;font-size:10pt;line-height:1.3;color:var(--ink)}',
      '.note{margin-top:5pt;padding:4pt 7pt;border-left:2pt solid var(--blue);background:var(--tint);font-size:10pt;line-height:1.3;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.note strong{margin-bottom:1pt}',
      '.tail{margin-top:4pt}',
      '.tail h2{margin-bottom:2pt}',
      '.equip{margin:0 0 3pt;font-size:10pt;line-height:1.3;color:var(--ink)}',
      '.reminders{margin:0;padding:0 0 0 12pt;columns:2;column-gap:10pt;font-size:10pt;line-height:1.3;color:var(--ink)}',
      '.reminders li{margin:0;break-inside:avoid}',
      '.safe.tight .step{padding:1.5pt 0}',
      '.safe.tight .why{line-height:1.25}',
      '.safe.tight .reminders{line-height:1.25}',
      '.safe.dense .step-detail{line-height:1.2}',
      '.safe.columns .hour-rows{display:block;column-count:2;column-gap:8pt}',
      '.safe.packed .why{line-height:1.2;margin-bottom:2pt}',
      '.safe.packed .step{padding:1pt 0}',
      '.safe.packed .note{margin-top:3pt;padding:2pt 6pt}',
      '.safe.packed .quiet-head{margin-bottom:3pt;padding-bottom:2pt}',
      '.safe.packed .tail{margin-top:3pt}',
      '.foot{margin-top:auto;padding-top:4pt;border-top:1.5pt solid var(--gold);text-align:center;font-size:8pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue)}',
      '@page{size:A5 portrait;margin:0}',
      '@page :first{margin:0}',
      '@page :left{margin:0}',
      '@page :right{margin:0}',
      '@media screen{html,body{background:#cfd3dc}body{display:flex;flex-direction:column;align-items:center;gap:10mm;padding:10mm 0}.face{box-shadow:0 10px 28px rgba(26,34,56,.22)}}',
      '@media print{html,body{margin:0!important;padding:0!important;background:#fff}body{display:block}.face{margin:0;box-shadow:none}a{color:inherit;text-decoration:none}*{ -webkit-print-color-adjust:exact;print-color-adjust:exact}}'
    ].join('');
  }

  function docShell(title, bodyHtml) {
    return '<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8">' +
      '<title>' + esc(title) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">' +
      '<style>' + printCss() + '</style></head><body>' + bodyHtml +
      '<script>window.addEventListener("load",function(){var go=function(){function over(safe){return safe.scrollHeight>safe.clientHeight+1;}document.querySelectorAll(".safe").forEach(function(safe){["tight","dense","columns","packed"].forEach(function(name){if(over(safe))safe.classList.add(name);});if(over(safe)){var why=safe.querySelector(".why");if(why)why.remove();}if(over(safe)){var reminders=safe.querySelector(".reminders");if(reminders)reminders.remove();}});setTimeout(function(){window.print();},250);};if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go);}else{go();}});<\/script></body></html>';
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
    // The hour names the game. The full setup stays on the game page, so the
    // printed why is not pushed off the card.
    var body = game.blurb || game.when_to_pick || game.setup || '';
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

  function frameworkLine(lesson) {
    var eye = lesson.technical_focus ? ('Eye on ' + lesson.technical_focus) : '';
    return [lesson.game_situation, lesson.phase, lesson.tactic, lesson.ball_characteristic, eye]
      .filter(Boolean).join(' · ');
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
      band += '<article><h3>STEP</h3><p>' + esc(step).replace(/\n/g, '<br>') + '</p></article>';
    }
    var title = esc(lesson.title || 'Lesson');
    var court =
      '<section class="face court">' +
      '<div class="mast"></div>' +
      '<div class="safe">' +
      '<header><div class="brand"><img src="' + esc(logo) + '" alt="">' +
      '<div class="brand-name">Padel Pals</div></div>' +
      '<h1>' + title + '</h1>' +
      '<p class="meta">' + esc(metaLine(lesson)) + '</p>' +
      (frameworkLine(lesson) ? '<p class="meta">' + esc(frameworkLine(lesson)) + '</p>' : '') +
      '</header>' +
      '<section class="say"><span>' + esc(sayLabel) + '</span><strong>' + esc(lesson.objective || '') + '</strong></section>' +
      cueCards(lesson) +
      (band ? '<section class="band">' + band + '</section>' : '') +
      '</div></section>';
    var hour =
      '<section class="face hour-face' + (coaching ? ' coaching' : '') + '">' +
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

  var MM = 72 / 25.4;
  var FONT_SRC = {
    regular: 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.2.5/latin-400-normal.ttf',
    bold: 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.2.5/latin-700-normal.ttf',
    black: 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.2.5/latin-800-normal.ttf'
  };

  function mm(n) { return n * MM; }

  function pdfSafe(value) {
    return String(value == null ? '' : value)
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
  }

  function loadScript(src, globalName) {
    return new Promise(function (resolve, reject) {
      if (globalName && global[globalName]) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error(src)); };
      document.head.appendChild(s);
    });
  }

  function wrapLines(text, font, size, width) {
    var words = pdfSafe(text).split(/\s+/).filter(Boolean);
    var lines = [];
    var line = '';
    var i;
    for (i = 0; i < words.length; i++) {
      var next = line ? line + ' ' + words[i] : words[i];
      if (line && font.widthOfTextAtSize(next, size) > width) {
        lines.push(line);
        line = words[i];
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawLines(page, lines, font, size, x, top, leading, color) {
    var y = top - size;
    var i;
    for (i = 0; i < lines.length; i++) {
      page.drawText(lines[i], { x: x, y: y, size: size, font: font, color: color });
      y -= leading;
    }
    return top - lines.length * leading;
  }

  function paintCard(pdf, fonts, logo, lesson) {
    var rgb = global.PDFLib.rgb;
    var navy = rgb(26 / 255, 34 / 255, 56 / 255);
    var blue = rgb(42 / 255, 57 / 255, 144 / 255);
    var gold = rgb(246 / 255, 201 / 255, 21 / 255);
    var ink = rgb(51 / 255, 51 / 255, 51 / 255);
    var tint = rgb(238 / 255, 240 / 255, 247 / 255);
    var line = rgb(208 / 255, 213 / 255, 221 / 255);
    var white = rgb(1, 1, 1);
    var pageW = mm(148);
    var pageH = mm(210);
    var pad = mm(10);
    var inner = pageW - pad * 2;
    var regular = fonts.regular;
    var bold = fonts.bold;
    var black = fonts.black;
    var saySize = 13;
    var bodySize = 10;
    var bodyLead = 12;
    var cueSize = bodySize;
    var cueLead = bodyLead;

    var court = pdf.addPage([pageW, pageH]);
    var titleLines = wrapLines(lesson.title || 'Lesson', black, 16, inner - mm(12));
    var metaLines = wrapLines(metaLine(lesson), bold, bodySize, inner);
    var frameworkLines = wrapLines(frameworkLine(lesson), bold, bodySize, inner);
    var headerH = 22 + titleLines.length * 19 + (metaLines.length + frameworkLines.length) * bodyLead;
    var mastH = Math.max(mm(46), pad + headerH + mm(4));
    court.drawRectangle({ x: 0, y: pageH - mastH, width: pageW, height: mastH, color: navy });
    if (logo) {
      court.drawImage(logo, { x: pad, y: pageH - pad - 18, width: 18, height: 18 });
    }
    court.drawText('PADEL PALS', {
      x: pad + (logo ? 24 : 0),
      y: pageH - pad - 13,
      size: 8,
      font: black,
      color: gold
    });
    drawLines(court, titleLines, black, 16, pad, pageH - pad - 26, 19, white);
    var metaTop = pageH - pad - 26 - titleLines.length * 19;
    drawLines(court, metaLines, bold, bodySize, pad, metaTop, bodyLead, white);
    if (frameworkLines.length) {
      drawLines(court, frameworkLines, bold, bodySize, pad, metaTop - metaLines.length * bodyLead, bodyLead, white);
    }

    var cursor = pageH - mastH - mm(4);
    var coaching = lesson.session_kind === 'coaching';
    var sayLabel = coaching ? 'PLANNED THEME' : 'SAY THIS';
    var sayLines = wrapLines(lesson.objective || '', bold, saySize, inner - 18);
    var sayH = 14 + 12 + sayLines.length * (saySize + 4) + 8;
    court.drawRectangle({ x: pad, y: cursor - sayH, width: inner, height: sayH, color: tint });
    court.drawRectangle({ x: pad, y: cursor - sayH, width: 3, height: sayH, color: gold });
    court.drawText(sayLabel, { x: pad + 12, y: cursor - 18, size: 8, font: black, color: blue });
    cursor = drawLines(court, sayLines, bold, saySize, pad + 12, cursor - 24, saySize + 4, navy) - 14;

    cueItems(lesson).forEach(function (cueLine, index) {
      var lines = wrapLines(cueLine, regular, cueSize, inner - 24);
      court.drawText(String(index + 1), { x: pad, y: cursor - cueSize, size: cueSize, font: black, color: blue });
      cursor = drawLines(court, lines, regular, cueSize, pad + 18, cursor, cueLead, navy) - 6;
    });
    cursor -= 6;

    function bandBlock(heading, lines) {
      if (!lines.length) return;
      var blockH = 12 + 14 + lines.length * bodyLead + 6;
      court.drawRectangle({ x: pad, y: cursor - blockH, width: inner, height: blockH, color: tint });
      court.drawText(heading, { x: pad + 10, y: cursor - 16, size: 8, font: black, color: blue });
      cursor = drawLines(court, lines, regular, bodySize, pad + 10, cursor - 20, bodyLead, ink) - 8;
    }
    var good = (lesson.success_check || '').trim();
    var stepText = (lesson.differentiation || '').trim();
    if (good) bandBlock('WHAT GOOD LOOKS LIKE', wrapLines(good, regular, bodySize, inner - 16));
    var watch = watchItems(lesson);
    if (watch.length) {
      bandBlock('IF YOU SEE THIS', watch.reduce(function (all, line) {
        return all.concat(wrapLines(line, regular, bodySize, inner - 24).map(function (part, i) {
          return (i === 0 ? '- ' : '  ') + part;
        }));
      }, []));
    }
    if (stepText) bandBlock('STEP', stepText.split(/\n+/).reduce(function (all, line) {
      var trimmed = line.trim();
      if (!trimmed) return all;
      return all.concat(wrapLines(trimmed, regular, bodySize, inner - 16));
    }, []));

    var hour = pdf.addPage([pageW, pageH]);
    var hourTitle = wrapLines(lesson.title || 'Lesson', black, 16, inner);
    hour.drawText('PADEL PALS', { x: pad, y: pageH - pad - 8, size: 8, font: black, color: blue });
    var afterTitle = drawLines(hour, hourTitle, black, 16, pad, pageH - pad - 16, 20, navy);
    hour.drawRectangle({ x: pad, y: afterTitle - 8, width: inner, height: 0.6, color: navy });
    var floor = mm(14);
    var hourSize = coaching ? 8 : bodySize;
    var hourLead = coaching ? 10 : bodyLead;
    var why = whyText(lesson);
    var whyLines = why ? wrapLines(why, regular, hourSize, inner) : [];
    var rows = Array.isArray(lesson.run_sheet) ? lesson.run_sheet : [];
    var prepared = rows.map(function (step) {
      return {
        step: step,
        detailLines: step.detail ? wrapLines(step.detail, regular, hourSize, inner) : []
      };
    });
    var note = (lesson.coach_note || '').trim();
    var noteLines = note ? wrapLines(note, regular, hourSize, inner - 18) : [];
    var equip = Array.isArray(lesson.equipment) && lesson.equipment.length ? lesson.equipment : ['Balls and cones'];
    var equipLines = wrapLines('Equipment: ' + equip.join(', ') + '.', regular, hourSize, inner);
    var colW = (inner - 16) / 2;
    var reminderRows = [];
    for (var r = 0; r < REMINDERS.length; r += 2) {
      reminderRows.push({
        left: wrapLines(REMINDERS[r], regular, hourSize, colW - 12).map(function (part, i) {
          return (i === 0 ? '- ' : '  ') + part;
        }),
        right: REMINDERS[r + 1] ? wrapLines(REMINDERS[r + 1], regular, hourSize, colW - 12).map(function (part, i) {
          return (i === 0 ? '- ' : '  ') + part;
        }) : []
      });
    }
    function projectedEnd(showWhy, showReminders) {
      var c = afterTitle - mm(6);
      if (showWhy && whyLines.length) c -= whyLines.length * hourLead + 8;
      c -= 16;
      prepared.forEach(function (row) {
        c -= 22 + row.detailLines.length * hourLead;
      });
      if (noteLines.length) c -= 30 + noteLines.length * hourLead;
      c -= 18 + equipLines.length * hourLead + 4;
      if (showReminders) {
        reminderRows.forEach(function (pair) {
          c -= Math.max(pair.left.length, pair.right.length) * hourLead + 2;
        });
      }
      return c;
    }
    var showWhy = whyLines.length > 0 && projectedEnd(true, true) >= floor;
    var showReminders = projectedEnd(showWhy, true) >= floor;

    cursor = afterTitle - mm(6);
    if (showWhy) {
      cursor = drawLines(hour, whyLines, regular, hourSize, pad, cursor, hourLead, ink) - 8;
    }
    hour.drawText('THE HOUR', { x: pad, y: cursor - 8, size: 8, font: black, color: blue });
    cursor -= 16;
    prepared.forEach(function (row) {
      var step = row.step;
      var detailLines = row.detailLines;
      hour.drawText(pdfSafe(step.from + '-' + step.to), {
        x: pad, y: cursor - 10, size: hourSize, font: black, color: blue
      });
      hour.drawText(pdfSafe(step.label || ''), {
        x: pad + mm(18), y: cursor - 10, size: hourSize, font: bold, color: navy
      });
      if (detailLines.length) {
        cursor = drawLines(hour, detailLines, regular, hourSize, pad, cursor - 14, hourLead, ink) - 4;
      } else {
        cursor -= 18;
      }
      hour.drawRectangle({ x: pad, y: cursor, width: inner, height: 0.4, color: line });
      cursor -= 4;
    });
    if (noteLines.length) {
      var noteH = 18 + noteLines.length * hourLead + 6;
      hour.drawRectangle({ x: pad, y: cursor - noteH, width: inner, height: noteH, color: tint });
      hour.drawRectangle({ x: pad, y: cursor - noteH, width: 2, height: noteH, color: blue });
      hour.drawText('COACH NOTE', { x: pad + 10, y: cursor - 14, size: 8, font: black, color: blue });
      cursor = drawLines(hour, noteLines, regular, hourSize, pad + 10, cursor - 20, hourLead, ink) - 10;
    }
    hour.drawText('BEFORE YOU START', { x: pad, y: cursor - 10, size: 8, font: black, color: blue });
    cursor -= 18;
    cursor = drawLines(hour, equipLines, regular, hourSize, pad, cursor, hourLead, ink) - 4;
    if (showReminders) {
      reminderRows.forEach(function (pair) {
        drawLines(hour, pair.left, regular, hourSize, pad, cursor, hourLead, ink);
        if (pair.right.length) drawLines(hour, pair.right, regular, hourSize, pad + colW + 16, cursor, hourLead, ink);
        cursor -= Math.max(pair.left.length, pair.right.length) * hourLead + 2;
      });
    }
    var footY = mm(8);
    hour.drawRectangle({ x: pad, y: footY + 12, width: inner, height: 1.5, color: gold });
    var foot = 'PADELPALS.APP';
    var footW = black.widthOfTextAtSize(foot, 8);
    hour.drawText(foot, { x: (pageW - footW) / 2, y: footY, size: 8, font: black, color: blue });
    return cursor > floor;
  }

  function buildPdf(lesson) {
    return loadScript('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js', 'PDFLib').then(function () {
      return loadScript('https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js', 'fontkit');
    }).then(function () {
      return Promise.all([
        fetch(FONT_SRC.regular).then(function (r) { return r.arrayBuffer(); }),
        fetch(FONT_SRC.bold).then(function (r) { return r.arrayBuffer(); }),
        fetch(FONT_SRC.black).then(function (r) { return r.arrayBuffer(); }),
        fetch(assetUrl('images/Icon.png')).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).catch(function () { return null; })
      ]);
    }).then(function (parts) {
      var pdf = global.PDFLib.PDFDocument.create();
      return pdf.then(function (doc) {
        doc.registerFontkit(global.fontkit);
        if (!global.fontkit.__ppNoLigatures) {
          var createFont = global.fontkit.create;
          global.fontkit.create = function () {
            var font = createFont.apply(this, arguments);
            if (font && !font.__ppNoLigatures) {
              var layout = font.layout.bind(font);
              font.layout = function (text, features) {
                return layout(text, features || { liga: false, clig: false, dlig: false, hlig: false, calt: false });
              };
              font.__ppNoLigatures = true;
            }
            return font;
          };
          global.fontkit.__ppNoLigatures = true;
        }
        return Promise.all([
          doc.embedFont(parts[0]),
          doc.embedFont(parts[1]),
          doc.embedFont(parts[2]),
          parts[3] ? doc.embedPng(parts[3]).catch(function () { return null; }) : null
        ]).then(function (embedded) {
          var fonts = { regular: embedded[0], bold: embedded[1], black: embedded[2] };
          paintCard(doc, fonts, embedded[3], lesson);
          doc.setTitle((lesson.title || 'Lesson') + ' · Coach Planner');
          return doc.save();
        });
      });
    });
  }

  function openPdf(lesson) {
    buildPdf(lesson).then(function (bytes) {
      var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      var frame = document.getElementById('pp-print-frame');
      if (!frame) {
        frame = document.createElement('iframe');
        frame.id = 'pp-print-frame';
        frame.title = 'Lesson card';
        frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
        document.body.appendChild(frame);
      }
      frame.onload = function () {
        setTimeout(function () {
          try {
            frame.contentWindow.focus();
            frame.contentWindow.print();
          } catch (err) {
            global.open(url, '_blank');
          }
        }, 500);
      };
      frame.src = url;
    }).catch(function () {
      openPrint(sheetHtml(lesson));
    });
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
      openPdf(withComposedRunSheet(lesson, pool || [lesson]));
    }
  };
})(window);

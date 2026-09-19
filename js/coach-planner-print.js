/* Shared print HTML for Coach Planner. Do not put lesson copy in this file. */
(function (global) {
  'use strict';

  var AUDIENCE_SLOT = {
    'Intro to Padel': 'Tue 17:30',
    'Beginner / Improver': 'Sun 11:00',
    'Improver / Intermediate': 'Sun 12:00'
  };

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

  function slotFor(audience) {
    return AUDIENCE_SLOT[audience] || '';
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
      ':root{--navy:#1A2238;--blue:#2A3990;--accent:#4A90E2;--ink:#333;--muted:#555;--line:#d0d5dd;--paper:#fff;--tint:#EEF0F7;--gold:#F6C915}',
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
      '.note{border-left:4px solid var(--gold);background:#FFF8EC;padding:10px 14px;border-radius:0 10px 10px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.note h3{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#E08540;margin-bottom:4px}',
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
    if (!lesson || !lesson.audience || !lesson.session_date) return null;
    var later = (pool || []).filter(function (other) {
      return other
        && other.audience === lesson.audience
        && other.session_date
        && other.session_date > lesson.session_date
        && other.slug !== lesson.slug;
    }).sort(function (a, b) {
      return String(a.session_date).localeCompare(String(b.session_date));
    });
    return later.length ? later[0].title : null;
  }

  function composeRunSheet(lesson, options) {
    options = options || {};
    var nextTitle = options.nextTitle || null;
    var spine = options.spine || spineOf(lesson);
    var details = lesson.step_details || {};
    var steps = spine && Array.isArray(spine.steps) ? spine.steps : [];
    if (steps.length) {
      return steps.map(function (step) {
        var label = step.label;
        var overlay = details[label];
        var detail;
        if (overlay != null && String(overlay).trim() !== '') {
          detail = overlay;
        } else if (label === 'Name the focus' && lesson.objective) {
          detail = 'One sentence, out loud, twice: ' + lesson.objective;
        } else if (label === 'Open' && lesson.differentiation) {
          detail = [step.default_detail, lesson.differentiation].filter(Boolean).join(' ');
        } else if (label === 'Close' && nextTitle) {
          detail = 'Restate the focus. Next week is ' + nextTitle + '. One paid session and where to book.';
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
    var copy = Object.assign({}, lesson);
    var spine = spineOf(lesson);
    copy.run_sheet = composeRunSheet(lesson, {
      spine: spine,
      nextTitle: nextTitleFor(lesson, pool)
    });
    if (!copy.duration_min && spine && spine.duration_min) copy.duration_min = spine.duration_min;
    if (!copy.group_size_max && spine && spine.group_size_max) copy.group_size_max = spine.group_size_max;
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
    var dateLabel = formatDate(lesson.session_date);
    var equip = Array.isArray(lesson.equipment) ? lesson.equipment : [];
    var note = (lesson.coach_note || '').trim();
    var body =
      '<div class="brand"><div class="brand-left"><img src="' + esc(logo) + '" alt="">' +
      '<div><div class="brand-name">Padel Pals</div><div class="eyebrow" style="margin:0">Coach Planner</div></div></div>' +
      '<div class="brand-meta">' + esc(dateLabel) + '<br>padelpals.app</div></div>' +
      '<div class="hero"><h1>' + esc(lesson.title) + '</h1>' +
      (lesson.audience ? '<p>' + esc(lesson.audience) + (slotFor(lesson.audience) ? ' · ' + esc(slotFor(lesson.audience)) : '') + '</p>' : '') +
      '<div class="pills">' + pills(lesson) + '</div></div>' +
      '<div class="grid-3">' +
      '<div class="card"><h3>Objective</h3><p>' + esc(lesson.objective || '') + '</p></div>' +
      '<div class="card"><h3>What good looks like</h3><p>' + esc(lesson.success_check || '') + '</p></div>' +
      '<div class="card"><h3>Differentiation</h3><p>' + esc(lesson.differentiation || '') + '</p></div>' +
      '</div>' +
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
    return '<section class="half">' +
      '<div class="half-head"><div><div class="eyebrow">Coach Planner</div>' +
      '<h2>' + esc(lesson.title) + '</h2>' +
      '<div style="font-size:10px;color:var(--muted);font-weight:600;margin-top:2px">' +
      esc(lesson.audience || '') +
      (lesson.group_size_max ? ' · max ' + esc(lesson.group_size_max) : '') +
      '</div></div><div class="slot">' + esc(slotFor(lesson.audience)) + '</div></div>' +
      '<div class="half-grid"><div>' + runRows(lesson, false) + '</div>' +
      '<div class="right">' +
      '<h3>Announce</h3><p>' + esc(lesson.objective || '') + '</p>' +
      '<h3>Framework</h3><p>' +
      [lesson.game_situation, lesson.phase, lesson.tactic].filter(Boolean).map(esc).join(' · ') +
      '</p>' +
      '<h3>Good is</h3><p class="good">' + esc(lesson.success_check || '') + '</p>' +
      (lesson.differentiation ? '<h3>STEP</h3><p>' + esc(lesson.differentiation) + '</p>' : '') +
      overlayRows(lesson).map(function (step) {
        return '<h3>' + esc(step.label) + '</h3><p>' + esc(step.detail) + '</p>';
      }).join('') +
      '</div></div></section>';
  }

  function courtSheetHtml(lessons) {
    var list = sortLessons(lessons).slice(0, 2);
    if (!list.length) return '';
    var logo = assetUrl('images/Icon.png');
    var dateLabel = formatDate(list[0].session_date);
    var title = list.length === 2
      ? 'Court sheet · ' + dateLabel
      : (list[0].title || 'Court sheet');
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
    slotFor: slotFor,
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

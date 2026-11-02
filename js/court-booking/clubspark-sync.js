/**
 * ClubSpark sync — upload a ClubSpark bookings export and make the club's
 * padel courts in Padel Pals match it. Dry run first, then apply.
 * The CSV is parsed here; sync_clubspark_bookings does the matching.
 */
(function (global) {
  'use strict';

  var MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'];
  var REQUIRED = ['Date', 'Time of booking', 'Duration', 'Court(s)'];

  // RFC 4180-style: quoted fields may contain commas, quotes are doubled.
  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = '';
    var quoted = false;
    var src = String(text || '').replace(/^﻿/, '');
    for (var i = 0; i < src.length; i++) {
      var ch = src.charAt(i);
      if (quoted) {
        if (ch === '"') {
          if (src.charAt(i + 1) === '"') { field += '"'; i++; }
          else quoted = false;
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === ',') {
        row.push(field); field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && src.charAt(i + 1) === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
    if (field !== '' || row.length) {
      row.push(field);
      if (row.length > 1 || row[0] !== '') rows.push(row);
    }
    return rows;
  }

  function personName(first, last, bookedBy) {
    var name = [first, last].map(function (s) { return String(s || '').trim(); }).filter(Boolean).join(' ');
    if (!name || name.toLowerCase() === 'non member non member') name = String(bookedBy || '').trim();
    return name || null;
  }

  /**
   * Turns the export into one row per court. Only courts whose name matches
   * one of courtNames (case-insensitive) are kept.
   */
  function readExport(text, courtNames) {
    var table = parseCsv(text);
    if (!table.length) throw new Error('That file is empty.');
    var header = table[0].map(function (h) { return h.trim(); });
    var col = {};
    header.forEach(function (h, i) { col[h] = i; });
    var missing = REQUIRED.filter(function (h) { return col[h] === undefined; });
    if (missing.length) {
      throw new Error('This does not look like a ClubSpark bookings export (missing ' + missing.join(', ') + ').');
    }
    var wanted = {};
    (courtNames || []).forEach(function (n) { wanted[String(n).toLowerCase()] = n; });

    var rows = [];
    var dates = [];
    var aloneOn = {};
    var otherCourts = 0;
    table.slice(1).forEach(function (cells, index) {
      function cell(name) { return col[name] === undefined ? '' : String(cells[col[name]] || '').trim(); }
      var date = cell('Date');
      var time = cell('Time of booking');
      var minutes = parseInt(cell('Duration'), 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time) || !(minutes > 0)) {
        throw new Error('Row ' + (index + 2) + ' has a date, time or duration we cannot read.');
      }
      var courts = cell('Court(s)').split(',').map(function (c) { return c.trim(); }).filter(Boolean);
      var name = personName(cell('First name'), cell('Last name'), cell('Booked by'));
      var matched = courts.filter(function (c) { return wanted[c.toLowerCase()]; });
      if (!matched.length) { otherCourts++; return; }
      matched.forEach(function (c) {
        var courtName = wanted[c.toLowerCase()];
        if (courts.length === 1) aloneOn[courtName] = true;
        rows.push({
          court: courtName,
          date: date,
          time: time.length === 4 ? '0' + time : time,
          minutes: minutes,
          name: name,
          category: cell('Booking category') || 'Booking'
        });
      });
      dates.push(date);
    });
    dates.sort();

    var perCourt = {};
    (courtNames || []).forEach(function (n) { perCourt[n] = 0; });
    rows.forEach(function (r) { perCourt[r.court] = (perCourt[r.court] || 0) + 1; });
    var warnings = [];
    (courtNames || []).forEach(function (n) {
      if (!perCourt[n]) warnings.push(n + ' has no bookings in this file. Check the export included every court.');
      else if (!aloneOn[n]) warnings.push(n + ' only appears in bookings shared with another court. Check the export was not filtered to one court.');
    });

    return {
      rows: rows,
      rangeFrom: dates[0] || null,
      rangeTo: dates[dates.length - 1] || null,
      perCourt: perCourt,
      otherCourts: otherCourts,
      warnings: warnings
    };
  }

  // "Mode-Club-Bookings-02-November-2026-0750.csv" -> "2026-11-02 07:50 Europe/London"
  function exportedAtFromName(fileName) {
    var m = String(fileName || '').match(/(\d{1,2})-([A-Za-z]+)-(\d{4})-(\d{2})(\d{2})/);
    if (!m) return null;
    var month = MONTHS.indexOf(m[2].toLowerCase());
    if (month === -1) return null;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return m[3] + '-' + pad(month + 1) + '-' + pad(parseInt(m[1], 10)) + ' ' + m[4] + ':' + m[5] + ' Europe/London';
  }

  global.ClubSparkExport = {
    parseCsv: parseCsv,
    readExport: readExport,
    exportedAtFromName: exportedAtFromName
  };

  if (typeof document === 'undefined') return;

  var S = global.CourtBookingService;
  var app;
  var state = {
    clubs: [],
    clubId: null,
    courts: [],
    file: null,
    parsed: null,
    plan: null,
    runs: [],
    busy: false,
    error: '',
    done: ''
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function when(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-GB', {
      timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function clock(iso) {
    return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
  }

  function dayLabel(ymd) {
    if (!ymd) return '';
    return new Date(ymd + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function applyTheme(club) {
    var primary = (club && club.primary_color) || '#FF6B35';
    var secondary = (club && club.secondary_color) || '#0d1b2e';
    document.documentElement.style.setProperty('--cb-primary', primary);
    document.documentElement.style.setProperty('--cb-secondary', secondary);
    document.body.style.background = secondary;
  }

  function waitConfig() {
    if (global.config && global.config.supabaseUrl) return Promise.resolve();
    return new Promise(function (resolve) {
      document.addEventListener('configLoaded', function onLoad() {
        document.removeEventListener('configLoaded', onLoad);
        resolve();
      });
    });
  }

  function denied(message) {
    app.innerHTML = '<div class="cb-status"><h1>ClubSpark sync</h1><p>' + escapeHtml(message) + '</p>' +
      '<p><a class="cb-btn" href="courts.html">Back to courts</a></p></div>';
  }

  var PROBLEM_COPY = {
    missing_court: function (p) { return p.court + ' has no bookings in this file. Export again with every padel court selected.'; },
    overlap: function (p) { return p.court + ' has two bookings that overlap at ' + when(p.starts_at) + '. Check the file.'; },
    bad_row: function (p) { return 'Row ' + p.row + ' (' + p.court + ') is outside the date range or not on a quarter hour.'; },
    mass_cancel: function (p) { return 'This would cancel ' + p.cancel_count + ' of ' + p.existing_count + ' bookings. Tick the box below if that is right.'; }
  };

  var ACTION_COPY = { add: 'Add', update: 'Change', cancel: 'Cancel', skip: 'Skipped (clashes with a hold or lesson)' };

  function planHtml() {
    var plan = state.plan;
    if (!plan) return '';
    var c = plan.counts || {};
    var problems = plan.problems || [];
    var blocking = problems.filter(function (p) { return p.code !== 'mass_cancel'; });
    var mass = problems.some(function (p) { return p.code === 'mass_cancel'; });
    var items = plan.items || [];
    var rows = items.map(function (it) {
      var time = clock(it.starts_at) + '–' + clock(it.ends_at);
      if (it.action === 'update' && it.old_ends_at) time += ' (was to ' + clock(it.old_ends_at) + ')';
      return '<tr><td>' + escapeHtml(ACTION_COPY[it.action] || it.action) + '</td>' +
        '<td>' + escapeHtml(dayLabel(String(new Date(it.starts_at).toLocaleDateString('en-CA', { timeZone: 'Europe/London' })))) + '</td>' +
        '<td>' + escapeHtml(time) + '</td>' +
        '<td>' + escapeHtml(it.court) + '</td>' +
        '<td>' + escapeHtml(it.action === 'cancel' ? '' : (it.name || '')) + (it.category && it.category !== 'Booking' ? ' <span class="cb-caption">' + escapeHtml(it.category) + '</span>' : '') + '</td></tr>';
    }).join('');
    return '<div class="cb-card"><h3>' + (plan.applied ? 'Synced' : 'What this sync will do') + '</h3>' +
      '<p>' + [
        (c.added || 0) + ' to add',
        (c.updated || 0) + ' to change',
        (c.cancelled || 0) + ' to cancel',
        (c.unchanged || 0) + ' already match',
        c.skipped ? c.skipped + ' skipped' : null
      ].filter(Boolean).join(' · ') + '</p>' +
      '<p class="cb-caption">Covers ' + escapeHtml(dayLabel(plan.range_from)) + ' to ' + escapeHtml(dayLabel(plan.range_to)) +
        ', from ' + escapeHtml(when(plan.window_start)) + '. Bookings that have already started are left alone' +
        (c.past ? ' (' + c.past + ' in the file)' : '') + '.</p>' +
      problems.map(function (p) {
        var copy = PROBLEM_COPY[p.code];
        return '<p class="cb-error">' + escapeHtml(copy ? copy(p) : p.code) + '</p>';
      }).join('') +
      (rows ? '<table class="cb-table"><thead><tr><th></th><th>Day</th><th>Time</th><th>Court</th><th>Name</th></tr></thead><tbody>' + rows + '</tbody></table>' : '<p class="cb-caption">Padel Pals already matches this file.</p>') +
      (!plan.applied && !blocking.length
        ? '<div class="cb-actions" style="margin-top:16px">' +
            (mass ? '<label class="cb-check-row"><input type="checkbox" id="csMass"> Yes, cancel these bookings</label>' : '') +
            '<button type="button" class="cb-btn" id="csApply"' + (state.busy ? ' disabled' : '') + '>Apply sync</button>' +
          '</div>'
        : '') +
      '</div>';
  }

  function runsHtml() {
    if (!state.runs.length) return '<p class="cb-caption">No syncs yet.</p>';
    return '<table class="cb-table"><thead><tr><th>Synced</th><th>Export</th><th>Days</th><th>Changes</th></tr></thead><tbody>' +
      state.runs.map(function (r) {
        return '<tr><td>' + escapeHtml(when(r.created_at)) + '</td>' +
          '<td>' + escapeHtml(r.exported_at ? when(r.exported_at) : (r.file_name || '')) + '</td>' +
          '<td>' + escapeHtml(dayLabel(r.range_from) + ' – ' + dayLabel(r.range_to)) + '</td>' +
          '<td>+' + r.added + ' / ~' + r.updated + ' / −' + r.cancelled + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function render() {
    var club = state.clubs.find(function (c) { return c.id === state.clubId; });
    var parsed = state.parsed;
    var clubSelect = state.clubs.length > 1
      ? '<select id="csClub" class="cb-btn cb-btn-ghost">' + state.clubs.map(function (c) {
          return '<option value="' + escapeHtml(c.id) + '"' + (c.id === state.clubId ? ' selected' : '') + '>' + escapeHtml(c.club_name) + '</option>';
        }).join('') + '</select>'
      : '';
    app.innerHTML =
      '<div class="cb-toolbar">' +
        '<div class="cb-club"><div><h1>' + escapeHtml(club ? club.club_name : 'Your club') + '</h1><p>ClubSpark sync</p></div></div>' +
        clubSelect +
        '<div class="cb-toolbar-actions"><a class="cb-btn cb-btn-ghost" href="courts.html">Back to courts</a></div>' +
      '</div>' +
      '<div class="cb-view"><div class="cb-panel">' +
        '<div class="cb-card"><h3>Upload a ClubSpark export</h3>' +
          '<p class="cb-caption">In ClubSpark admin, export the bookings report from today to 8 days ahead with every court included, then choose the file here. ' +
          'Padel Pals will match ' + escapeHtml(state.courts.join(' and ') || 'the padel courts') + ' to it.</p>' +
          '<input type="file" id="csFile" accept=".csv,text/csv"' + (state.busy ? ' disabled' : '') + '>' +
          (parsed
            ? '<p>' + escapeHtml(state.file.name) + ' · ' + parsed.rows.length + ' padel bookings (' +
                Object.keys(parsed.perCourt).map(function (k) { return escapeHtml(k) + ': ' + parsed.perCourt[k]; }).join(', ') + ')' +
                (parsed.otherCourts ? ' · ' + parsed.otherCourts + ' on other courts ignored' : '') + '</p>' +
              '<div class="cb-actions">' +
                '<label class="cb-field">From <input type="date" id="csFrom" value="' + escapeHtml(parsed.rangeFrom || '') + '"></label>' +
                '<label class="cb-field">To <input type="date" id="csTo" value="' + escapeHtml(parsed.rangeTo || '') + '"></label>' +
                '<button type="button" class="cb-btn cb-btn-secondary" id="csPreview"' + (state.busy ? ' disabled' : '') + '>Check again</button>' +
              '</div>' +
              parsed.warnings.map(function (w) { return '<p class="cb-error">' + escapeHtml(w) + '</p>'; }).join('')
            : '') +
        '</div>' +
        (state.error ? '<p class="cb-error">' + escapeHtml(state.error) + '</p>' : '') +
        (state.done ? '<p class="cb-ok">' + escapeHtml(state.done) + '</p>' : '') +
        planHtml() +
        '<div class="cb-card"><h3>Recent syncs</h3>' + runsHtml() + '</div>' +
      '</div></div>';
    bind();
  }

  function bind() {
    var fileInput = document.getElementById('csFile');
    if (fileInput) fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) loadFile(fileInput.files[0]);
    });
    var preview = document.getElementById('csPreview');
    if (preview) preview.addEventListener('click', function () { runSync(false); });
    var apply = document.getElementById('csApply');
    if (apply) apply.addEventListener('click', function () { runSync(true); });
    var clubSelect = document.getElementById('csClub');
    if (clubSelect) clubSelect.addEventListener('change', function () { selectClub(clubSelect.value); });
  }

  function rangeFromInputs() {
    var from = document.getElementById('csFrom');
    var to = document.getElementById('csTo');
    return {
      from: (from && from.value) || (state.parsed && state.parsed.rangeFrom),
      to: (to && to.value) || (state.parsed && state.parsed.rangeTo)
    };
  }

  async function loadFile(file) {
    state.file = file;
    state.plan = null;
    state.error = '';
    state.done = '';
    try {
      var text = await file.text();
      state.parsed = readExport(text, state.courts);
      if (!state.parsed.rows.length) throw new Error('No ' + state.courts.join(' or ') + ' bookings in this file.');
    } catch (err) {
      state.parsed = null;
      state.error = err.message || String(err);
      render();
      return;
    }
    render();
    runSync(false);
  }

  async function runSync(apply) {
    if (!state.parsed || state.busy) return;
    var range = rangeFromInputs();
    var mass = document.getElementById('csMass');
    state.busy = true;
    state.error = '';
    state.done = '';
    render();
    try {
      state.plan = await S.syncClubSpark({
        clubId: state.clubId,
        rows: state.parsed.rows,
        rangeFrom: range.from,
        rangeTo: range.to,
        fileName: state.file.name,
        exportedAt: exportedAtFromName(state.file.name),
        apply: apply,
        allowMassCancel: !!(mass && mass.checked)
      });
      if (apply && state.plan && state.plan.applied) {
        state.done = 'Padel Pals now matches ' + state.file.name + '.';
        state.runs = await S.listSyncRuns(state.clubId).catch(function () { return state.runs; });
      }
    } catch (err) {
      state.error = err.message || 'The sync did not run. Please try again.';
    }
    state.busy = false;
    render();
  }

  async function selectClub(id) {
    state.clubId = id;
    state.parsed = null;
    state.plan = null;
    state.file = null;
    var club = state.clubs.find(function (c) { return c.id === id; });
    applyTheme(club);
    try {
      var settings = await S.getSettings(id);
      state.courts = (settings.courts || [])
        .filter(function (c) { return c.is_active && c.sport === 'padel'; })
        .map(function (c) { return c.name; });
      state.runs = await S.listSyncRuns(id);
    } catch (err) {
      state.error = err.message || 'Could not load the club.';
    }
    render();
  }

  async function bootstrap() {
    app = document.getElementById('cbApp');
    await waitConfig();
    var auth;
    try {
      auth = await S.getAccessToken();
    } catch (e) {
      try { sessionStorage.setItem('pp_after_auth', 'clubspark-sync.html'); } catch (err) {}
      window.location.href = '/auth.html';
      return;
    }
    try {
      var roles = (await S.fetchClubRoles(auth.userId)).filter(function (r) { return r.role === 'admin'; });
      var ids = roles.map(function (r) { return String(r.club_id).toLowerCase(); })
        .filter(function (id, i, all) { return all.indexOf(id) === i; });
      if (!ids.length) {
        denied('Only club admins can sync bookings from ClubSpark.');
        return;
      }
      state.clubs = (await S.fetchClubs(ids)).map(function (c) {
        c.id = String(c.id).toLowerCase();
        return c;
      });
      var stored = '';
      try { stored = String(localStorage.getItem('pp_active_staff_club') || '').toLowerCase(); } catch (e) {}
      var first = state.clubs.find(function (c) { return c.id === stored; }) || state.clubs[0];
      await selectClub(first.id);
    } catch (err) {
      denied(err.message || 'Could not load your clubs.');
    }
  }

  bootstrap();
})(window);

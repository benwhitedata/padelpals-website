/**
 * Courts page: session gate, day board, member/staff inspector, admin settings and Players.
 */
(function (global) {
  'use strict';

  var TZ = 'Europe/London';
  var WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var HOLD_REASONS = [
    { id: 'maintenance', title: 'Maintenance' },
    { id: 'club_social', title: 'Club social' },
    { id: 'coaching', title: 'Coaching' },
    { id: 'competition', title: 'Competition' },
    { id: 'other', title: 'Other' }
  ];
  var RECURRENCE = [
    { id: 'once', title: 'Does not repeat' },
    { id: 'daily', title: 'Daily' },
    { id: 'weekly', title: 'Weekly' },
    { id: 'biweekly', title: 'Every 2 weeks' },
    { id: 'monthly', title: 'Monthly' }
  ];
  var SHEET_PRIVACY = [
    { id: 'anyone', title: 'Anyone' },
    { id: 'logged_in', title: 'Signed-in users' },
    { id: 'members_or_roles', title: 'Members' },
    { id: 'booking_admins_only', title: 'Staff only' }
  ];
  var NAMES_PRIVACY = [
    { id: 'members_or_roles', title: 'Members can see names' },
    { id: 'booking_admins_only', title: 'Only staff see names' }
  ];

  var S = global.CourtBookingService;
  var B = global.CourtBookingBoard;
  var app = document.getElementById('cbApp');
  var pollTimer = null;

  var state = {
    userId: null,
    displayName: '',
    homeClubId: null,
    homeClub: null,
    roles: [],
    staffClubs: [],
    activeClubId: null,
    activeClub: null,
    playDate: todayYmd(),
    sheet: null,
    layout: null,
    boardView: 'staff',
    panel: null,
    inspector: { mode: 'idle' },
    loading: true,
    error: '',
    notice: '',
    busy: false,
    settings: null,
    players: [],
    playerFilter: 'all',
    playerQuery: '',
    myBookings: [],
    members: [],
    memberQuery: '',
    waitlistOk: true,
    noShowOk: true
  };

  function todayYmd() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }

  function addYmd(ymd, days) {
    var parts = ymd.split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
    return date.toISOString().slice(0, 10);
  }

  function formatDayTitle(ymd) {
    var date = new Date(ymd + 'T12:00:00Z');
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: TZ
    }).format(date);
  }

  function formatTime(value) {
    var date = B.parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: TZ
    }).format(date);
  }

  function formatDateTime(value) {
    var date = B.parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: TZ
    }).format(date);
  }

  function hhmm(value) {
    return String(value || '').slice(0, 5);
  }

  function timeParam(value) {
    var text = String(value || '00:00');
    if (text.length === 5) return text + ':00';
    return text.slice(0, 8);
  }

  function durationLabel(slots, minutes) {
    var total = Math.max(1, slots) * Math.max(1, minutes);
    if (total % 60 === 0) {
      var hours = total / 60;
      return hours === 1 ? '1 hour' : hours + ' hours';
    }
    return total + ' minutes';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clubName(club) {
    return (club && (club.club_name || club.name)) || 'Your club';
  }

  function isStaff() {
    return !!(state.sheet && state.sheet.is_staff);
  }

  function isAdmin() {
    return !!(state.sheet && state.sheet.is_admin);
  }

  function actingAsStaff() {
    return isStaff() && state.boardView === 'staff';
  }

  function showNames() {
    return actingAsStaff();
  }

  function activeStaffRole() {
    var id = String(state.activeClubId || '').toLowerCase();
    var row = state.roles.find(function (r) { return String(r.club_id).toLowerCase() === id; });
    return row ? row.role : null;
  }

  function canManageSettings() {
    return isAdmin() || activeStaffRole() === 'admin';
  }

  function errorMessage(err) {
    if (!err) return 'Something went wrong. Please try again.';
    if (err.code === 'not_authorized') {
      return 'Ask your club to tick Court booking on the Players list, then turn on member booking.';
    }
    return err.message || 'Something went wrong. Please try again.';
  }

  function applyTheme(club) {
    var primary = (club && club.primary_color) || '#FF6B35';
    var secondary = (club && club.secondary_color) || '#0d1b2e';
    document.documentElement.style.setProperty('--cb-primary', primary);
    document.documentElement.style.setProperty('--cb-secondary', secondary);
    document.body.style.background = secondary;
  }

  function redirectToAuth() {
    try { sessionStorage.setItem('pp_after_auth', 'courts.html'); } catch (e) {}
    var last = parseInt(localStorage.getItem('authRedirectTime') || '0', 10);
    if (Date.now() - last < 5000 && last > 0) {
      renderDenied('We could not restore your session. Please sign in again.');
      return;
    }
    localStorage.setItem('authRedirectTime', String(Date.now()));
    window.location.href = '/auth.html';
  }

  function waitConfig() {
    return new Promise(function (resolve) {
      if (global.config && global.config.supabaseUrl) {
        resolve();
        return;
      }
      document.addEventListener('configLoaded', function onLoad() {
        document.removeEventListener('configLoaded', onLoad);
        resolve();
      });
    });
  }

  async function bootstrap() {
    await waitConfig();
    var auth;
    try {
      auth = await S.getAccessToken();
    } catch (e) {
      redirectToAuth();
      return;
    }
    localStorage.removeItem('authRedirectTime');
    state.userId = auth.userId;
    try {
      var profile = await S.fetchProfile(auth.userId);
      var roles = await S.fetchClubRoles(auth.userId);
      state.displayName = (profile && (profile.display_name || profile.short_name)) || 'You';
      state.homeClubId = profile && profile.club_id ? String(profile.club_id).toLowerCase() : null;
      state.homeClub = profile && profile.clubs ? profile.clubs : null;
      state.roles = roles || [];
      if (!state.roles.length && profile) {
        if (profile.isAdmin && state.homeClubId) {
          state.roles.push({ club_id: state.homeClubId, role: 'admin' });
        } else if (profile.is_coach && state.homeClubId) {
          state.roles.push({ club_id: state.homeClubId, role: 'coach' });
        }
      }
      var staffIds = state.roles.map(function (r) { return String(r.club_id).toLowerCase(); });
      var uniqueIds = staffIds.filter(function (id, i) { return staffIds.indexOf(id) === i; });
      var clubs = uniqueIds.length ? await S.fetchClubs(uniqueIds) : [];
      state.staffClubs = uniqueIds.map(function (id) {
        var club = clubs.find(function (c) { return String(c.id).toLowerCase() === id; }) || { id: id, club_name: 'Club' };
        var roleRow = state.roles.find(function (r) { return String(r.club_id).toLowerCase() === id; });
        club.role = roleRow ? roleRow.role : 'coach';
        return club;
      });
      var stored = '';
      try { stored = String(localStorage.getItem('pp_active_staff_club') || '').toLowerCase(); } catch (e) {}
      if (state.staffClubs.length) {
        var match = state.staffClubs.find(function (c) { return String(c.id).toLowerCase() === stored; });
        state.activeClubId = match ? match.id : (state.homeClubId && uniqueIds.indexOf(state.homeClubId) !== -1 ? state.homeClubId : state.staffClubs[0].id);
        state.activeClub = state.staffClubs.find(function (c) { return String(c.id).toLowerCase() === String(state.activeClubId).toLowerCase(); }) || state.homeClub;
      } else {
        state.activeClubId = state.homeClubId;
        state.activeClub = state.homeClub;
      }
      applyTheme(state.activeClub);
      if (!state.activeClubId) {
        renderDenied('Join a club in the Padel Pals app to book a court.');
        return;
      }
      await loadSheet();
    } catch (err) {
      renderDenied(errorMessage(err));
    }
  }

  async function loadSheet() {
    state.loading = !state.sheet;
    state.error = '';
    render();
    try {
      var sheet = await S.listSheet(state.activeClubId, state.playDate);
      state.sheet = sheet;
      state.layout = B.buildLayout(sheet.courts || []);
      if (!sheet.is_staff) state.boardView = 'member';
      if (state.activeClub) applyTheme(state.activeClub);
      state.loading = false;
      state.inspector = state.inspector.mode === 'idle' ? state.inspector : state.inspector;
      startPoll();
      render();
    } catch (err) {
      state.loading = false;
      if (err.code === 'not_authorized') {
        renderDenied(errorMessage(err));
        return;
      }
      state.error = errorMessage(err);
      render();
    }
  }

  function startPoll() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      if (document.hidden || state.busy || state.panel) return;
      S.listSheet(state.activeClubId, state.playDate).then(function (sheet) {
        state.sheet = sheet;
        state.layout = B.buildLayout(sheet.courts || []);
        renderBoardOnly();
      }).catch(function () {});
    }, 30000);
  }

  function quotaText(sheet) {
    if (!sheet) return '';
    var count = sheet.remaining_hires === 1 ? '1 booking left today' : (sheet.remaining_hires || 0) + ' bookings left today';
    var left = actingAsStaff() ? 'Members have ' + count : count;
    return left + ' · up to ' + durationLabel(sheet.max_slots, sheet.slot_minutes) + ' · new days at ' + hhmm(sheet.new_day_unlock);
  }

  function renderDenied(message) {
    app.innerHTML =
      '<div class="cb-denied">' +
      '<h1>Court bookings</h1>' +
      '<p>' + escapeHtml(message) + '</p>' +
      '<a class="cb-btn" href="dashboard.html">Back to dashboard</a>' +
      '</div>';
  }

  function render() {
    if (!state.sheet && state.loading) {
      app.innerHTML = '<div class="cb-status"><h1>Loading courts</h1><p>Fetching the day board…</p></div>';
      return;
    }
    if (!state.sheet) {
      app.innerHTML =
        '<div class="cb-denied"><h1>Could not load courts</h1><p>' +
        escapeHtml(state.error || 'Please try again.') +
        '</p><button type="button" class="cb-btn" id="cbRetry">Retry</button></div>';
      bindRetry();
      return;
    }

    var sheet = state.sheet;
    var closed = !!sheet.is_closed;
    var caption = state.panel
      ? ''
      : '<p class="cb-caption' + (!sheet.enabled && actingAsStaff() ? ' warn' : '') + '" id="cbCaption">' + escapeHtml(captionText()) + '</p>';
    var main = state.panel
      ? panelHtml()
      : '<div class="cb-workspace">' +
          '<div class="cb-board-wrap" id="cbBoardWrap">' + boardHtml(closed) + '</div>' +
          '<aside class="cb-inspector" id="cbInspector">' + inspectorHtml() + '</aside>' +
        '</div>';
    app.innerHTML = chromeHtml() + caption + main + confirmHtml();
    bindChrome();
  }

  function renderBoardOnly() {
    var wrap = document.getElementById('cbBoardWrap');
    var caption = document.getElementById('cbCaption');
    if (caption) caption.textContent = captionText();
    if (wrap) wrap.innerHTML = boardHtml(!!state.sheet.is_closed);
    bindBoard();
  }

  function captionText() {
    var sheet = state.sheet;
    if (!sheet) return '';
    if (sheet.is_closed) return 'The club is closed on this day.';
    if (!sheet.enabled && actingAsStaff()) return 'Member booking is off. Staff can still book and hold courts while testing.';
    if (!sheet.enabled && isStaff() && state.boardView === 'member') return 'Member booking is off. Members cannot open this board yet.';
    if (!actingAsStaff() && state.playDate > sheet.max_bookable_date) return 'Opens at ' + hhmm(sheet.new_day_unlock) + '.';
    return quotaText(sheet);
  }

  function chromeHtml() {
    return '<div class="cb-chrome">' + toolbarHtml() +
      (state.panel ? '<div class="cb-panel-head"><h2>' + escapeHtml(panelTitle()) + '</h2></div>' : '') +
      '</div>';
  }

  function toolbarHtml() {
    var club = state.activeClub || state.homeClub || {};
    var logo = club.logo_url
      ? '<img src="' + escapeHtml(club.logo_url) + '" alt="">'
      : '<i class="fas fa-building"></i>';
    var clubSelect = '';
    if (state.staffClubs.length > 1) {
      clubSelect = '<select class="cb-select" id="cbClubSelect" aria-label="Club">' +
        state.staffClubs.map(function (c) {
          var selected = String(c.id).toLowerCase() === String(state.activeClubId).toLowerCase() ? ' selected' : '';
          return '<option value="' + escapeHtml(c.id) + '"' + selected + '>' + escapeHtml(clubName(c)) + '</option>';
        }).join('') + '</select>';
    }
    var staffToggle = isStaff()
      ? '<div class="cb-seg" role="group" aria-label="Board view">' +
        '<button type="button" data-board-view="staff"' + (state.boardView === 'staff' ? ' class="is-active"' : '') + '>Staff</button>' +
        '<button type="button" data-board-view="member"' + (state.boardView === 'member' ? ' class="is-active"' : '') + '>Member</button>' +
        '</div>'
      : '';
    var staffButtons = actingAsStaff()
      ? '<button type="button" class="cb-btn cb-btn-ghost' + (state.panel === 'hold' ? ' is-on' : '') + '" id="cbHold">Hold</button>'
      : '';
    var adminButtons = canManageSettings()
      ? '<button type="button" class="cb-btn cb-btn-ghost' + (state.panel === 'settings' ? ' is-on' : '') + '" id="cbSettings">Settings</button>' +
        '<button type="button" class="cb-btn cb-btn-ghost' + (state.panel === 'players' ? ' is-on' : '') + '" id="cbPlayers">Players</button>'
      : '';
    var showDate = state.panel !== 'settings' && state.panel !== 'players';
    var dateNav = showDate
      ? '<div class="cb-date-nav">' +
          '<button type="button" class="cb-btn cb-btn-ghost" id="cbPrev" aria-label="Previous day"><i class="fas fa-chevron-left"></i></button>' +
          '<label class="cb-date-picker">' +
            '<span>' + escapeHtml(formatDayTitle(state.playDate)) + '</span>' +
            '<input type="date" id="cbDate" value="' + escapeHtml(state.playDate) + '" aria-label="Booking date">' +
          '</label>' +
          (state.playDate !== todayYmd() ? '<button type="button" class="cb-btn cb-btn-text" id="cbToday">Today</button>' : '') +
          '<button type="button" class="cb-btn cb-btn-ghost" id="cbNext" aria-label="Next day"><i class="fas fa-chevron-right"></i></button>' +
        '</div>'
      : '';
    var backBtn = state.panel
      ? '<button type="button" class="cb-btn cb-btn-ghost" id="cbClosePanel">Back to board</button>'
      : '';
    return (
      '<div class="cb-toolbar">' +
        '<div class="cb-club">' + logo +
          '<div><h1>' + escapeHtml(clubName(club)) + '</h1><p>Court bookings</p></div>' +
        '</div>' + clubSelect +
        dateNav +
        '<div class="cb-toolbar-actions">' +
          staffToggle + staffButtons + adminButtons +
          '<button type="button" class="cb-btn cb-btn-ghost' + (state.panel === 'mine' ? ' is-on' : '') + '" id="cbMine">My bookings</button>' +
          backBtn +
        '</div>' +
      '</div>'
    );
  }

  function boardHtml(closed) {
    if (closed) {
      return '<div class="cb-status"><h1>Closed</h1><p>No courts are available on this day.</p></div>';
    }
    var layout = state.layout;
    if (!layout || !layout.columns.length) {
      return '<div class="cb-status"><h1>No courts</h1><p>This club has no active courts yet.</p></div>';
    }
    var count = layout.columns.length;
    var style = '--cb-court-count:' + count;
    var header = '<div class="cb-board-header" style="' + style + '"><div></div>' +
      layout.columns.map(function (col) {
        return '<div class="cb-court-name">' + escapeHtml(col.court.name) + '</div>';
      }).join('') + '</div>';
    var hours = '<div class="cb-hours" style="height:' + layout.boardHeight + 'px">' +
      layout.hours.map(function (hour) {
        var h = B.heightFor(hour.endsAt - hour.startsAt);
        return '<div class="cb-hour" style="height:' + h + 'px">' + escapeHtml(formatTime(hour.startsAt)) + '</div>';
      }).join('') + '</div>';
    var cols = layout.columns.map(function (col, index) {
      return '<div class="cb-column" data-col="' + index + '" style="height:' + layout.boardHeight + 'px">' +
        tracksHtml(col) +
        (actingAsStaff() ? gapsHtml(layout, col) : '') +
        occHtml(layout, col) +
        '</div>';
    }).join('');
    return '<div class="cb-board">' + header + '<div class="cb-board-body" style="' + style + '">' + hours + cols + '</div></div>';
  }

  function tracksHtml(col) {
    var remainingZero = !actingAsStaff() && state.sheet.remaining_hires === 0;
    return col.tracks.map(function (track, i) {
      var h = B.heightFor(track.endsAt - track.startsAt);
      var cls = 'cb-track is-' + track.kind + (remainingZero && track.kind === 'free' ? ' is-none' : '') + (track.kind === 'free' && !remainingZero ? ' is-free' : '');
      var label = '';
      if (track.kind === 'free') label = remainingZero ? 'None left' : 'Free';
      if (track.kind === 'locked') label = '—';
      var disabled = track.kind !== 'free' || remainingZero ? ' disabled' : '';
      return '<button type="button" class="' + cls + '" style="height:' + h + 'px" data-track="' + i + '"' + disabled + '>' +
        (track.kind === 'free' ? '<i class="fas fa-' + (remainingZero ? 'xmark' : 'plus') + '"></i> ' : '') +
        escapeHtml(label) +
        '</button>';
    }).join('');
  }

  function gapsHtml(layout, col) {
    return col.gaps.map(function (gap, i) {
      var frame = B.occupancyFrame(layout, gap.startsAt, gap.endsAt);
      return '<button type="button" class="cb-gap" data-gap="' + i + '" style="top:' + frame.y + 'px;height:' + frame.height + 'px">' +
        '<strong>Free</strong><span>' + escapeHtml(formatTime(gap.startsAt) + '–' + formatTime(gap.endsAt)) + '</span></button>';
    }).join('');
  }

  function occHtml(layout, col) {
    var names = showNames();
    return col.occupancies.map(function (occ, i) {
      var frame = B.occupancyFrame(layout, occ.startsAt, occ.endsAt);
      var fill = B.occupancyFill(occ.slot);
      var title = B.occupancyTitle(occ.slot, names);
      var clickable = occ.slot.state === 'mine' || occ.slot.state === 'booked' || occ.slot.state === 'listed' || (actingAsStaff() && occ.slot.state === 'held');
      var tag = clickable ? 'button' : 'div';
      return '<' + tag + (clickable ? ' type="button"' : '') + ' class="cb-occ" data-occ="' + i + '" style="top:' + frame.y + 'px;height:' + frame.height + 'px;background:' + fill + '">' +
        '<strong>' + escapeHtml(title) + '</strong>' +
        (frame.height >= 36 ? '<span>' + escapeHtml(formatTime(occ.startsAt) + '–' + formatTime(occ.endsAt)) + '</span>' : '') +
        '</' + tag + '>';
    }).join('');
  }

  function inspectorHtml() {
    var ins = state.inspector;
    if (state.error) {
      return '<div class="cb-error">' + escapeHtml(state.error) + '</div>' + idleInspector();
    }
    if (state.notice) {
      return '<div class="cb-ok">' + escapeHtml(state.notice) + '</div>' + inspectorBody(ins);
    }
    return inspectorBody(ins);
  }

  function idleInspector() {
    return '<h2>Select a slot</h2><p class="lead">Tap a free time to book. Booked courts open details here — names stay on the board for staff.</p>';
  }

  function inspectorBody(ins) {
    if (!ins || ins.mode === 'idle') return idleInspector();
    if (ins.mode === 'memberBook') return memberBookHtml(ins);
    if (ins.mode === 'staffHire') return staffHireHtml(ins);
    if (ins.mode === 'booking') return bookingDetailHtml(ins);
    if (ins.mode === 'hold') return holdDetailHtml(ins);
    if (ins.mode === 'lesson') {
      return '<h2>' + escapeHtml(ins.title || 'Lesson') + '</h2><p class="lead">This court is reserved for a Group Lesson. Empty listings can be booked; a live lesson keeps the court.</p>';
    }
    return idleInspector();
  }

  function memberBookHtml(ins) {
    var sheet = state.sheet;
    var minSlots = Math.max(1, sheet.min_slots || 1);
    var maxSlots = Math.max(minSlots, sheet.max_slots || 1);
    var chips = '';
    for (var n = minSlots; n <= maxSlots; n++) {
      chips += '<button type="button" class="cb-chip' + (ins.slotCount === n ? ' is-active' : '') + '" data-slots="' + n + '">' +
        escapeHtml(durationLabel(n, sheet.slot_minutes)) + '</button>';
    }
    var warn = ins.listed
      ? '<p class="cb-caption warn">A lesson is listed at this time. Booking the court cancels that listing.</p>'
      : '';
    var orphan = ins.orphan
      ? '<p class="cb-caption warn">That time would leave a gap too short to book. Please choose a different slot.</p>'
      : '';
    return '<h2>Book ' + escapeHtml(ins.court.name) + '</h2>' +
      '<p class="lead">From ' + escapeHtml(formatTime(ins.slot.starts_at)) + '. How long?</p>' +
      warn + orphan +
      '<div class="cb-chip-row">' + chips + '</div>' +
      '<div class="cb-actions">' +
        '<button type="button" class="cb-btn" id="cbBook" ' + (state.busy || ins.orphan ? 'disabled' : '') + '>Book court</button>' +
      '</div>';
  }

  function staffHireHtml(ins) {
    var types = (state.sheet.booking_types || []).filter(function (t) { return t.is_active !== false; });
    var typeOpts = types.map(function (t) {
      var selected = String(t.id) === String(ins.bookingTypeId) ? ' selected' : '';
      return '<option value="' + escapeHtml(t.id) + '"' + selected + '>' + escapeHtml(t.name) + '</option>';
    }).join('');
    var courts = (state.sheet.courts || []).map(function (c) {
      var checked = (ins.courtIds || []).indexOf(c.id) !== -1 ? ' checked' : '';
      return '<label class="cb-check-row"><input type="checkbox" data-hire-court="' + escapeHtml(c.id) + '"' + checked + (ins.bookingId ? ' disabled' : '') + '> ' + escapeHtml(c.name) + '</label>';
    }).join('');
    var recOpts = RECURRENCE.map(function (r) {
      var selected = ins.recurrence === r.id ? ' selected' : '';
      return '<option value="' + r.id + '"' + selected + '>' + r.title + '</option>';
    }).join('');
    var matches = filterMembers(ins.playerQuery || '');
    var results = (ins.playerQuery ? matches.slice(0, 12) : []).map(function (m) {
      return '<button type="button" data-pick-member="' + escapeHtml(m.id) + '">' + escapeHtml(m.display_name || m.short_name || 'Member') + '</button>';
    }).join('');
    return '<h2>' + (ins.bookingId ? 'Edit booking' : 'Staff booking') + '</h2>' +
      '<p class="lead">Times are in 15-minute steps, London time. Staff can book as any home-club player.</p>' +
      '<div class="cb-field"><label>Court</label>' + courts + '</div>' +
      '<div class="cb-field"><label for="cbHireStart">Starts</label><input id="cbHireStart" class="cb-input" type="time" step="900" value="' + escapeHtml(ins.startTime) + '"></div>' +
      '<div class="cb-field"><label for="cbHireEnd">Ends</label><input id="cbHireEnd" class="cb-input" type="time" step="900" value="' + escapeHtml(ins.endTime) + '"></div>' +
      (ins.bookingId ? '' : '<div class="cb-field"><label for="cbHireRecur">Repeat</label><select id="cbHireRecur" class="cb-select">' + recOpts + '</select></div>') +
      (ins.recurrence && ins.recurrence !== 'once' ? '<div class="cb-field"><label for="cbHireUntil">End date</label><input id="cbHireUntil" class="cb-input" type="date" value="' + escapeHtml(ins.seriesUntil || addYmd(state.playDate, 84)) + '"></div>' : '') +
      (typeOpts ? '<div class="cb-field"><label for="cbHireType">Type</label><select id="cbHireType" class="cb-select">' + typeOpts + '</select></div>' : '') +
      '<div class="cb-field"><label for="cbHirePlayer">Book as</label>' +
        '<input id="cbHirePlayer" class="cb-input" type="search" placeholder="Search club members" value="' + escapeHtml(ins.playerName || '') + '" autocomplete="off">' +
        '<div class="cb-search-results" id="cbMemberResults">' + results + '</div>' +
        (ins.playerName ? '<p class="cb-caption">Booking as ' + escapeHtml(ins.playerName) + '</p>' : '') +
      '</div>' +
      '<div class="cb-field"><label for="cbHireNote">Note</label><textarea id="cbHireNote" class="cb-textarea" placeholder="Optional staff note">' + escapeHtml(ins.staffNote || '') + '</textarea></div>' +
      (ins.warning ? '<p class="cb-caption warn">' + escapeHtml(ins.warning) + '</p>' : '') +
      '<div class="cb-actions">' +
        '<button type="button" class="cb-btn" id="cbHireSave"' + (state.busy ? ' disabled' : '') + '>Save</button>' +
      '</div>';
  }

  function bookingDetailHtml(ins) {
    var rec = ins.record || {};
    var own = ins.own;
    var canCancel = (own || actingAsStaff()) && rec.no_show !== true;
    var rows = '';
    rows += detailRow('Court', rec.court_name || ins.courtName);
    if (rec.booking_type_name) rows += detailRow('Type', rec.booking_type_name);
    rows += detailRow('Starts', formatDateTime(rec.starts_at || ins.startsAt));
    rows += detailRow('Ends', formatDateTime(rec.ends_at || ins.endsAt));
    if (rec.series_id) rows += detailRow('Repeats', 'Repeating series');
    if (rec.booked_for_name) rows += detailRow('Booked as', rec.booked_for_name);
    if (rec.created_by_name && rec.created_by_user_id !== rec.booked_for_user_id) rows += detailRow('Booked by', rec.created_by_name);
    if (rec.staff_note) rows += detailRow('Note', rec.staff_note);
    if (rec.no_show) rows += detailRow('Status', 'No-show');
    var actions = '';
    if (actingAsStaff() && rec.id) {
      actions += '<button type="button" class="cb-btn cb-btn-ghost" id="cbEditHire">Edit</button>';
      if (state.noShowOk && rec.no_show !== true) {
        actions += '<button type="button" class="cb-btn cb-btn-ghost" id="cbNoShow">Mark no-show</button>';
      }
    }
    if (canCancel) {
      actions += '<button type="button" class="cb-btn cb-btn-danger" id="cbCancelHire">' + (rec.series_id ? 'Cancel this date' : 'Cancel booking') + '</button>';
      if (actingAsStaff() && rec.series_id) {
        actions += '<button type="button" class="cb-btn cb-btn-danger" id="cbCancelSeries">Remove the series</button>';
      }
    }
    if (!own && !actingAsStaff() && state.waitlistOk) {
      actions += '<button type="button" class="cb-btn cb-btn-ghost" id="cbWaitlist">Join waitlist</button><p class="cb-caption">You get a push if the court frees — you still book it from the day board.</p>';
    }
    return '<h2>Court booking</h2>' + rows + '<div class="cb-actions">' + actions + '</div>';
  }

  function detailRow(label, value) {
    return '<div class="cb-field"><label>' + escapeHtml(label) + '</label><div>' + escapeHtml(value || '—') + '</div></div>';
  }

  function holdDetailHtml(ins) {
    var repeating = isRepeating(ins.recurrence);
    return '<h2>Hold</h2>' +
      '<p class="lead">' + escapeHtml(ins.label || 'Held') + ' · ' + escapeHtml(formatTime(ins.startsAt) + '–' + formatTime(ins.endsAt)) + '</p>' +
      '<div class="cb-actions">' +
        (repeating
          ? '<button type="button" class="cb-btn cb-btn-ghost" id="cbSkipHold">Skip this date</button><button type="button" class="cb-btn cb-btn-danger" id="cbDeleteHold">Remove the series</button>'
          : '<button type="button" class="cb-btn cb-btn-danger" id="cbDeleteHold">Remove hold</button>') +
      '</div>';
  }

  function isRepeating(raw) {
    return !!raw && raw !== 'once';
  }

  function panelHtml() {
    if (!state.panel) return '';
    var inner = '';
    if (state.panel === 'settings') inner = settingsHtml();
    if (state.panel === 'players') inner = playersHtml();
    if (state.panel === 'mine') inner = mineHtml();
    if (state.panel === 'hold') inner = holdEditorHtml();
    return '<section class="cb-view" id="cbView">' +
      '<div class="cb-panel">' + inner + '</div></section>';
  }

  function panelTitle() {
    if (state.panel === 'settings') return 'Courts and booking';
    if (state.panel === 'players') return 'Players';
    if (state.panel === 'mine') return 'My court bookings';
    if (state.panel === 'hold') return 'Hold a court';
    return '';
  }

  function settingsHtml() {
    var s = state.settings;
    if (!s) return '<p class="cb-caption">Loading settings…</p>';
    var hours = fillDayHours(s.day_hours || [], s.earliest_open, s.latest_close);
    var hourRows = hours.map(function (d) {
      return '<tr>' +
        '<td>' + WEEKDAYS[d.weekday - 1] + '</td>' +
        '<td><label class="cb-check-row"><input type="checkbox" data-open-day="' + d.weekday + '"' + (d.is_closed ? '' : ' checked') + '> Open</label></td>' +
        '<td><input type="time" step="900" data-open-time="' + d.weekday + '" value="' + escapeHtml(hhmm(d.earliest_open)) + '"' + (d.is_closed ? ' disabled' : '') + '></td>' +
        '<td><input type="time" step="900" data-close-time="' + d.weekday + '" value="' + escapeHtml(hhmm(d.latest_close)) + '"' + (d.is_closed ? ' disabled' : '') + '></td>' +
        '</tr>';
    }).join('');
    var types = (s.booking_types || []).map(function (t) {
      return '<tr>' +
        '<td><span class="cb-type-dot" style="background:' + B.paletteColor(t.colour_index) + '"></span>' + escapeHtml(t.name) + (t.is_default ? ' (default)' : '') + '</td>' +
        '<td>' + (t.is_default ? '' : '<button type="button" class="cb-btn cb-btn-text" data-del-type="' + escapeHtml(t.id) + '">Delete</button>') + '</td>' +
        '</tr>';
    }).join('');
    var holds = (s.holds || []).map(function (h) {
      return '<tr><td>' + escapeHtml(h.court_name) + '</td><td>' + escapeHtml(h.note || h.reason) + '</td><td>' + escapeHtml(h.recurrence || 'once') + '</td>' +
        '<td><button type="button" class="cb-btn cb-btn-text" data-del-hold="' + escapeHtml(h.id) + '">Remove</button></td></tr>';
    }).join('');
    var courts = (s.courts || []).map(function (c) {
      return '<tr><td>' + escapeHtml(c.name) + '</td><td>' + (c.is_active === false ? 'Inactive' : 'Active') + '</td></tr>';
    }).join('');
    return '<div class="cb-grid-2">' +
      '<div class="cb-card"><h3>Member booking is live</h3>' +
        '<label class="cb-check-row"><span class="cb-toggle"><input type="checkbox" id="cbEnabled"' + (s.enabled ? ' checked' : '') + '><span></span></span> Members with Court booking ticked can self-serve</label>' +
        '<p class="cb-caption">Staff can still test while this is off.</p></div>' +
      '<div class="cb-card"><h3>Who can see the sheet</h3>' +
        '<div class="cb-field"><label>Sheet</label><select class="cb-select" id="cbSheetPrivacy">' + optionsHtml(SHEET_PRIVACY, s.sheet_privacy) + '</select></div>' +
        '<div class="cb-field"><label>Names</label><select class="cb-select" id="cbNamesPrivacy">' + optionsHtml(NAMES_PRIVACY, s.names_privacy) + '</select></div></div>' +
      '</div>' +
      '<div class="cb-card"><h3>Hours</h3>' +
        '<p class="cb-caption">The day board only shows times the club is open that day. Times are London time.</p>' +
        '<p><button type="button" class="cb-btn cb-btn-text" id="cbCopyWeekdays">Copy Monday to weekdays</button> ' +
        '<button type="button" class="cb-btn cb-btn-text" id="cbCopyWeekend">Copy Saturday to Sunday</button></p>' +
        '<table class="cb-hours-table"><thead><tr><th>Day</th><th></th><th>Opens</th><th>Closes</th></tr></thead><tbody>' + hourRows + '</tbody></table>' +
        '<div class="cb-field" style="margin-top:12px"><label for="cbUnlock">New day unlocks</label><input id="cbUnlock" class="cb-input" type="time" step="900" value="' + escapeHtml(hhmm(s.new_day_unlock)) + '"></div>' +
      '</div>' +
      '<div class="cb-grid-2">' +
        '<div class="cb-card"><h3>Slot length</h3>' +
          '<div class="cb-seg" id="cbSlotLen">' +
            [30, 60, 90].map(function (n) {
              return '<button type="button" data-slot-min="' + n + '"' + (Number(s.slot_minutes) === n ? ' class="is-active"' : '') + '>' + n + ' min</button>';
            }).join('') +
          '</div></div>' +
        '<div class="cb-card"><h3>Everyone</h3>' +
          numberField('cbAdvance', 'Advance days', s.advance_days, 1, 14) +
          numberField('cbMaxBookings', 'Max bookings', s.max_bookings, 1, 14) +
          numberField('cbPeriod', 'Every N days', s.max_bookings_period_days, 1, 14) +
          numberField('cbMinSlots', 'Minimum slots', s.min_slots, 1, 8) +
          numberField('cbMaxSlots', 'Maximum slots', s.max_slots, 1, 8) +
          numberField('cbCancelHours', 'Cancel hours before', s.cancel_hours, 0, 48) +
          '<label class="cb-check-row"><input type="checkbox" id="cbGroup"' + (s.group_booking ? ' checked' : '') + '> Group booking</label>' +
        '</div>' +
      '</div>' +
      '<div class="cb-card"><h3>Booking types</h3>' +
        '<table class="cb-table"><tbody>' + types + '</tbody></table>' +
        '<div class="cb-field"><label>New type</label><input class="cb-input" id="cbNewType" placeholder="Type name"></div>' +
        '<button type="button" class="cb-btn cb-btn-ghost" id="cbAddType">Add type</button>' +
      '</div>' +
      '<div class="cb-card"><h3>Holds</h3><p class="cb-caption">Create them from the day board Hold button.</p>' +
        '<table class="cb-table"><tbody>' + (holds || '<tr><td>No holds yet.</td></tr>') + '</tbody></table></div>' +
      '<div class="cb-card"><h3>Courts</h3><table class="cb-table"><tbody>' + courts + '</tbody></table>' +
        '<p class="cb-caption">These courts appear on the day board. Inactive courts are hidden from members.</p></div>' +
      '<button type="button" class="cb-btn" id="cbSaveSettings"' + (state.busy ? ' disabled' : '') + '>Save settings</button>';
  }

  function numberField(id, label, value, min, max) {
    return '<div class="cb-field"><label for="' + id + '">' + escapeHtml(label) + '</label>' +
      '<input class="cb-input" id="' + id + '" type="number" min="' + min + '" max="' + max + '" value="' + Number(value || min) + '"></div>';
  }

  function optionsHtml(list, current) {
    return list.map(function (item) {
      var selected = item.id === current ? ' selected' : '';
      return '<option value="' + item.id + '"' + selected + '>' + escapeHtml(item.title) + '</option>';
    }).join('');
  }

  function fillDayHours(hours, open, close) {
    var map = {};
    (hours || []).forEach(function (h) { map[h.weekday] = h; });
    var result = [];
    for (var d = 1; d <= 7; d++) {
      result.push(map[d] || { weekday: d, earliest_open: open || '07:00:00', latest_close: close || '22:00:00', is_closed: false });
    }
    return result;
  }

  function playersHtml() {
    var q = (state.playerQuery || '').toLowerCase();
    var rows = (state.players || []).filter(function (p) {
      if (state.playerFilter === 'allowed' && !p.can_book_courts) return false;
      if (state.playerFilter === 'notAllowed' && p.can_book_courts) return false;
      if (q && String(p.display_name || '').toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).map(function (p) {
      return '<tr><td>' + escapeHtml(p.display_name || 'Player') + '</td><td>' +
        '<label class="cb-toggle"><input type="checkbox" data-access="' + escapeHtml(p.id) + '"' + (p.can_book_courts ? ' checked' : '') + '><span></span></label>' +
        '</td></tr>';
    }).join('');
    return '<p class="cb-caption">Ticked players can use Book a court when member booking is live.</p>' +
      '<div class="cb-toolbar-actions" style="margin:0 0 16px">' +
        '<div class="cb-seg" id="cbPlayerFilter">' +
          '<button type="button" data-pfilter="all"' + (state.playerFilter === 'all' ? ' class="is-active"' : '') + '>All</button>' +
          '<button type="button" data-pfilter="allowed"' + (state.playerFilter === 'allowed' ? ' class="is-active"' : '') + '>Allowed</button>' +
          '<button type="button" data-pfilter="notAllowed"' + (state.playerFilter === 'notAllowed' ? ' class="is-active"' : '') + '>Not allowed</button>' +
        '</div>' +
        '<input class="cb-input" id="cbPlayerSearch" placeholder="Search players" value="' + escapeHtml(state.playerQuery) + '" style="max-width:280px">' +
      '</div>' +
      '<table class="cb-table cb-players-table"><thead><tr><th>Player</th><th>Court booking</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="2">No matching players.</td></tr>') + '</tbody></table>';
  }

  function mineHtml() {
    if (!state.myBookings) return '<p class="cb-caption">Loading bookings…</p>';
    if (!state.myBookings.length) return '<p class="cb-caption">When you book a court it will show here.</p>';
    return state.myBookings.map(function (b) {
      return '<button type="button" class="cb-list-btn" data-my-booking="' + escapeHtml(b.id) + '" data-court-id="' + escapeHtml(b.court_id) + '" data-court-name="' + escapeHtml(b.court_name) + '">' +
        '<strong>' + escapeHtml(b.court_name) + '</strong>' +
        '<span>' + escapeHtml(formatDateTime(b.starts_at) + '–' + formatTime(b.ends_at)) + '</span></button>';
    }).join('');
  }

  function holdEditorHtml() {
    var ins = state.holdForm || defaultHoldForm();
    var courts = (state.sheet.courts || []).map(function (c) {
      var checked = (ins.courtIds || []).indexOf(c.id) !== -1 ? ' checked' : '';
      return '<label class="cb-check-row"><input type="checkbox" data-hold-court="' + escapeHtml(c.id) + '"' + checked + '> ' + escapeHtml(c.name) + '</label>';
    }).join('');
    return '<div class="cb-field"><label>Court</label>' + courts + '</div>' +
      '<div class="cb-field"><label>Starts</label><input id="cbHoldStart" class="cb-input" type="time" step="900" value="' + escapeHtml(ins.startTime) + '"></div>' +
      '<div class="cb-field"><label>Ends</label><input id="cbHoldEnd" class="cb-input" type="time" step="900" value="' + escapeHtml(ins.endTime) + '"></div>' +
      '<div class="cb-field"><label>Repeat</label><select id="cbHoldRecur" class="cb-select">' + optionsHtml(RECURRENCE, ins.recurrence) + '</select></div>' +
      (ins.recurrence !== 'once' ? '<div class="cb-field"><label>End date</label><input id="cbHoldUntil" class="cb-input" type="date" value="' + escapeHtml(ins.seriesUntil || addYmd(state.playDate, 84)) + '"></div>' : '') +
      '<div class="cb-field"><label>Reason</label><select id="cbHoldReason" class="cb-select">' + optionsHtml(HOLD_REASONS, ins.reason) + '</select></div>' +
      '<div class="cb-field"><label>Note</label><textarea id="cbHoldNote" class="cb-textarea">' + escapeHtml(ins.note || '') + '</textarea></div>' +
      '<p class="cb-caption">Use this for maintenance or other blocks. Club nights and socials should be staff bookings so they show as booked.</p>' +
      '<button type="button" class="cb-btn" id="cbSaveHold"' + (state.busy ? ' disabled' : '') + '>Save hold</button>';
  }

  function defaultHoldForm() {
    var first = (state.sheet.courts || [])[0];
    var slot = first && first.slots && first.slots[0];
    return {
      courtIds: first ? [first.id] : [],
      startTime: slot ? formatTime(slot.starts_at) : '18:00',
      endTime: '19:00',
      recurrence: 'once',
      reason: 'maintenance',
      note: '',
      seriesUntil: addYmd(state.playDate, 84)
    };
  }

  function confirmHtml() {
    if (!state.confirm) return '';
    return '<div class="cb-confirm" id="cbConfirm"><div class="cb-confirm-card">' +
      '<h3>' + escapeHtml(state.confirm.title) + '</h3>' +
      '<p>' + escapeHtml(state.confirm.message) + '</p>' +
      '<div class="cb-actions">' +
        '<button type="button" class="cb-btn ' + (state.confirm.danger ? 'cb-btn-danger' : '') + '" id="cbConfirmOk">' + escapeHtml(state.confirm.ok || 'Confirm') + '</button>' +
        '<button type="button" class="cb-btn cb-btn-ghost" id="cbConfirmCancel">Keep</button>' +
      '</div></div></div>';
  }

  function bindRetry() {
    var btn = document.getElementById('cbRetry');
    if (btn) btn.addEventListener('click', function () { loadSheet(); });
  }

  function bindChrome() {
    bindBoard();
    var clubSelect = document.getElementById('cbClubSelect');
    if (clubSelect) {
      clubSelect.addEventListener('change', async function () {
        state.activeClubId = clubSelect.value;
        state.activeClub = state.staffClubs.find(function (c) { return String(c.id) === String(clubSelect.value); }) || state.activeClub;
        try { localStorage.setItem('pp_active_staff_club', String(state.activeClubId).toLowerCase()); } catch (e) {}
        applyTheme(state.activeClub);
        state.inspector = { mode: 'idle' };
        await loadSheet();
      });
    }
    onClick('cbPrev', function () { changeDay(-1); });
    onClick('cbNext', function () { changeDay(1); });
    onClick('cbToday', function () { state.playDate = todayYmd(); state.inspector = { mode: 'idle' }; loadSheet(); });
    var dateEl = document.getElementById('cbDate');
    if (dateEl) dateEl.addEventListener('change', function () {
      state.playDate = dateEl.value;
      state.inspector = { mode: 'idle' };
      loadSheet();
    });
    document.querySelectorAll('[data-board-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.boardView = btn.getAttribute('data-board-view');
        state.inspector = { mode: 'idle' };
        render();
      });
    });
    onClick('cbHold', function () {
      if (state.panel === 'hold') {
        state.panel = null;
        render();
      } else {
        openHold();
      }
    });
    onClick('cbSettings', function () {
      if (state.panel === 'settings') {
        state.panel = null;
        render();
      } else {
        openSettings();
      }
    });
    onClick('cbPlayers', function () {
      if (state.panel === 'players') {
        state.panel = null;
        render();
      } else {
        openPlayers();
      }
    });
    onClick('cbMine', function () {
      if (state.panel === 'mine') {
        state.panel = null;
        render();
      } else {
        openMine();
      }
    });
    onClick('cbClosePanel', function () { state.panel = null; render(); });
    bindInspector();
    bindPanel();
    bindConfirm();
  }

  function bindBoard() {
    document.querySelectorAll('.cb-column').forEach(function (colEl) {
      var index = Number(colEl.getAttribute('data-col'));
      var col = state.layout.columns[index];
      if (!col) return;
      colEl.querySelectorAll('[data-track]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var track = col.tracks[Number(btn.getAttribute('data-track'))];
          if (track && track.slot) handleTap(col.court, track.slot);
        });
      });
      colEl.querySelectorAll('[data-gap]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var gap = col.gaps[Number(btn.getAttribute('data-gap'))];
          if (gap) handleTap(col.court, gap.slot);
        });
      });
      colEl.querySelectorAll('[data-occ]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var occ = col.occupancies[Number(btn.getAttribute('data-occ'))];
          if (occ) handleTap(col.court, occ.slot);
        });
      });
    });
  }

  function bindInspector() {
    document.querySelectorAll('[data-slots]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        state.inspector.slotCount = Number(btn.getAttribute('data-slots'));
        await previewMemberOrphan();
        render();
      });
    });
    onClick('cbBook', bookMember);
    onClick('cbHireSave', saveStaffHire);
    onClick('cbEditHire', function () {
      if (!state.inspector.record) return;
      openStaffHireFromRecord(state.inspector.record);
    });
    onClick('cbCancelHire', function () {
      ask({
        title: 'Cancel this booking?',
        message: state.inspector.record && state.inspector.record.series_id
          ? 'This date becomes free. Later dates stay booked.'
          : 'The court will become free for others.',
        ok: 'Cancel booking',
        danger: true,
        action: cancelHire
      });
    });
    onClick('cbCancelSeries', function () {
      ask({
        title: 'Remove the series?',
        message: 'Cancels this booking and every later date in the series, including other courts booked with it.',
        ok: 'Remove the series',
        danger: true,
        action: cancelSeries
      });
    });
    onClick('cbNoShow', function () {
      ask({
        title: 'Mark as no-show?',
        message: 'Frees the court. This still counts towards that player’s daily booking cap.',
        ok: 'Mark no-show',
        danger: true,
        action: markNoShow
      });
    });
    onClick('cbWaitlist', joinWaitlist);
    onClick('cbSkipHold', function () { mutate(function () { return S.skipHoldDate(state.inspector.holdId, state.playDate); }); });
    onClick('cbDeleteHold', function () {
      ask({
        title: 'Remove hold?',
        message: isRepeating(state.inspector.recurrence) ? 'Removes every date in this hold series.' : 'The court will become free.',
        ok: 'Remove hold',
        danger: true,
        action: function () { return mutate(function () { return S.deleteHold(state.inspector.holdId); }); }
      });
    });
    var player = document.getElementById('cbHirePlayer');
    if (player) {
      player.addEventListener('input', function () {
        state.inspector.playerQuery = player.value;
        var box = document.getElementById('cbMemberResults');
        if (!box) return;
        var matches = filterMembers(player.value).slice(0, 12);
        box.innerHTML = matches.map(function (m) {
          return '<button type="button" data-pick-member="' + escapeHtml(m.id) + '">' + escapeHtml(m.display_name || m.short_name || 'Member') + '</button>';
        }).join('');
        box.querySelectorAll('[data-pick-member]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-pick-member');
            var member = state.members.find(function (m) { return String(m.id) === id; });
            state.inspector.playerUserId = id;
            state.inspector.playerName = member ? (member.display_name || member.short_name) : btn.textContent;
            state.inspector.playerQuery = '';
            render();
          });
        });
      });
    }
    document.querySelectorAll('[data-pick-member]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-pick-member');
        var member = state.members.find(function (m) { return String(m.id) === id; });
        state.inspector.playerUserId = id;
        state.inspector.playerName = member ? (member.display_name || member.short_name) : btn.textContent;
        state.inspector.playerQuery = '';
        render();
      });
    });
    syncHireFormFields();
  }

  function syncHireFormFields() {
    var ins = state.inspector;
    if (ins.mode !== 'staffHire') return;
    var start = document.getElementById('cbHireStart');
    var end = document.getElementById('cbHireEnd');
    var recur = document.getElementById('cbHireRecur');
    var until = document.getElementById('cbHireUntil');
    var type = document.getElementById('cbHireType');
    var note = document.getElementById('cbHireNote');
    if (start) start.addEventListener('change', function () { ins.startTime = start.value; });
    if (end) end.addEventListener('change', function () { ins.endTime = end.value; });
    if (recur) recur.addEventListener('change', function () { ins.recurrence = recur.value; render(); });
    if (until) until.addEventListener('change', function () { ins.seriesUntil = until.value; });
    if (type) type.addEventListener('change', function () { ins.bookingTypeId = type.value; });
    if (note) note.addEventListener('input', function () { ins.staffNote = note.value; });
    document.querySelectorAll('[data-hire-court]').forEach(function (box) {
      box.addEventListener('change', function () {
        var id = box.getAttribute('data-hire-court');
        ins.courtIds = ins.courtIds || [];
        if (box.checked) {
          if (ins.courtIds.indexOf(id) === -1) ins.courtIds.push(id);
        } else if (ins.courtIds.length > 1) {
          ins.courtIds = ins.courtIds.filter(function (x) { return x !== id; });
        } else {
          box.checked = true;
        }
      });
    });
  }

  function bindPanel() {
    if (state.panel === 'settings') bindSettings();
    if (state.panel === 'players') bindPlayers();
    if (state.panel === 'mine') {
      document.querySelectorAll('[data-my-booking]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openBooking({
            booking_id: btn.getAttribute('data-my-booking'),
            courtId: btn.getAttribute('data-court-id'),
            courtName: btn.getAttribute('data-court-name'),
            own: true
          });
          state.panel = null;
        });
      });
    }
    if (state.panel === 'hold') bindHoldEditor();
  }

  function bindSettings() {
    onClick('cbSaveSettings', saveSettings);
    onClick('cbAddType', addType);
    onClick('cbCopyWeekdays', function () { copyHours(1, [2, 3, 4, 5]); });
    onClick('cbCopyWeekend', function () { copyHours(6, [7]); });
    document.querySelectorAll('[data-slot-min]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.settings.slot_minutes = Number(btn.getAttribute('data-slot-min'));
        render();
      });
    });
    document.querySelectorAll('[data-del-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-del-type');
        ask({
          title: 'Delete booking type?',
          message: 'Existing bookings keep their times. The default type cannot be deleted.',
          ok: 'Delete',
          danger: true,
          action: async function () {
            await S.deleteBookingType(state.settings.club_id, id);
            await openSettings();
          }
        });
      });
    });
    document.querySelectorAll('[data-del-hold]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-del-hold');
        ask({
          title: 'Remove hold?',
          message: 'The court will become free on those dates.',
          ok: 'Remove hold',
          danger: true,
          action: async function () {
            await S.deleteHold(id);
            await openSettings();
            await loadSheet();
          }
        });
      });
    });
    var enabled = document.getElementById('cbEnabled');
    if (enabled) {
      enabled.addEventListener('change', function (e) {
        if (enabled.checked && !state.settings.enabled) {
          e.preventDefault();
          enabled.checked = false;
          ask({
            title: 'Turn on member booking?',
            message: 'Only ticked players on the Players list will be able to book.',
            ok: 'Turn on',
            action: function () {
              state.settings.enabled = true;
              render();
            }
          });
        } else {
          state.settings.enabled = enabled.checked;
        }
      });
    }
  }

  function copyHours(from, toDays) {
    var hours = collectDayHours();
    var source = hours.find(function (h) { return h.weekday === from; });
    if (!source) return;
    hours.forEach(function (h) {
      if (toDays.indexOf(h.weekday) !== -1) {
        h.earliest_open = source.earliest_open;
        h.latest_close = source.latest_close;
        h.is_closed = source.is_closed;
      }
    });
    state.settings.day_hours = hours;
    render();
  }

  function collectDayHours() {
    var hours = fillDayHours(state.settings.day_hours || [], state.settings.earliest_open, state.settings.latest_close);
    hours.forEach(function (h) {
      var openBox = document.querySelector('[data-open-day="' + h.weekday + '"]');
      var openTime = document.querySelector('[data-open-time="' + h.weekday + '"]');
      var closeTime = document.querySelector('[data-close-time="' + h.weekday + '"]');
      if (openBox) h.is_closed = !openBox.checked;
      if (openTime) h.earliest_open = timeParam(openTime.value);
      if (closeTime) h.latest_close = timeParam(closeTime.value);
    });
    return hours;
  }

  function bindPlayers() {
    document.querySelectorAll('[data-pfilter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.playerFilter = btn.getAttribute('data-pfilter');
        render();
      });
    });
    var search = document.getElementById('cbPlayerSearch');
    if (search) {
      search.addEventListener('input', function () {
        state.playerQuery = search.value;
        render();
        var again = document.getElementById('cbPlayerSearch');
        if (again) {
          again.focus();
          again.setSelectionRange(search.value.length, search.value.length);
        }
      });
    }
    document.querySelectorAll('[data-access]').forEach(function (box) {
      box.addEventListener('change', async function () {
        var id = box.getAttribute('data-access');
        var player = state.players.find(function (p) { return String(p.id) === id; });
        if (!player) return;
        var previous = player.can_book_courts;
        player.can_book_courts = box.checked;
        try {
          await S.setClubBookingAccess(state.activeClubId, id, box.checked);
        } catch (err) {
          player.can_book_courts = previous;
          state.error = errorMessage(err);
          render();
        }
      });
    });
  }

  function bindHoldEditor() {
    onClick('cbSaveHold', saveHold);
    var recur = document.getElementById('cbHoldRecur');
    if (recur) recur.addEventListener('change', function () {
      state.holdForm = readHoldForm();
      state.holdForm.recurrence = recur.value;
      render();
    });
    document.querySelectorAll('[data-hold-court]').forEach(function (box) {
      box.addEventListener('change', function () {
        state.holdForm = readHoldForm();
      });
    });
  }

  function bindConfirm() {
    onClick('cbConfirmCancel', function () { state.confirm = null; render(); });
    onClick('cbConfirmOk', async function () {
      var action = state.confirm && state.confirm.action;
      state.confirm = null;
      if (action) await action();
      else render();
    });
  }

  function onClick(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }

  function ask(opts) {
    state.confirm = opts;
    render();
  }

  function changeDay(delta) {
    state.playDate = addYmd(state.playDate, delta);
    state.inspector = { mode: 'idle' };
    loadSheet();
  }

  function handleTap(court, slot) {
    state.error = '';
    state.notice = '';
    var staff = actingAsStaff();
    if (slot.state === 'free' || slot.state === 'listed') {
      if (staff) openStaffHire(court, slot);
      else openMemberBook(court, slot);
      return;
    }
    if (slot.state === 'mine' || slot.state === 'booked') {
      if (slot.booking_id) openBooking({ booking_id: slot.booking_id, court: court, slot: slot, own: slot.state === 'mine' });
      return;
    }
    if (slot.state === 'held' && staff && slot.hold_id) {
      state.inspector = {
        mode: 'hold',
        holdId: slot.hold_id,
        recurrence: slot.hold_recurrence,
        label: slot.label,
        startsAt: slot.occupancy_starts_at || slot.starts_at,
        endsAt: slot.occupancy_ends_at || slot.ends_at
      };
      render();
      return;
    }
    if (slot.state === 'lesson' || slot.state === 'listed') {
      state.inspector = { mode: 'lesson', title: slot.label || 'Lesson' };
      render();
    }
  }

  function openMemberBook(court, slot) {
    state.inspector = {
      mode: 'memberBook',
      court: court,
      slot: slot,
      slotCount: Math.max(1, state.sheet.min_slots || 1),
      listed: slot.state === 'listed',
      orphan: false
    };
    previewMemberOrphan().then(render);
  }

  async function previewMemberOrphan() {
    var ins = state.inspector;
    if (ins.mode !== 'memberBook') return;
    var minutes = (state.sheet.slot_minutes || 60) * ins.slotCount;
    var start = B.parseDate(ins.slot.starts_at);
    var end = new Date(start.getTime() + minutes * 60000);
    try {
      ins.orphan = await S.previewOrphan(ins.court.id, start.toISOString(), end.toISOString());
    } catch (e) {
      ins.orphan = false;
    }
  }

  async function bookMember() {
    var ins = state.inspector;
    state.busy = true;
    render();
    try {
      var id = await S.createBooking({
        courtId: ins.court.id,
        startsAt: B.parseDate(ins.slot.starts_at).toISOString(),
        slotCount: ins.slotCount
      });
      state.busy = false;
      state.notice = 'Court booked.';
      await loadSheet();
      await openBooking({ booking_id: id, court: ins.court, own: true });
    } catch (err) {
      state.busy = false;
      state.error = errorMessage(err);
      render();
    }
  }

  async function openStaffHire(court, slot, bookingId) {
    if (!state.members.length) {
      try { state.members = await S.fetchClubMembers(state.activeClubId); } catch (e) { state.members = []; }
    }
    var start = B.parseDate(slot.occupancy_starts_at || slot.starts_at);
    var end = B.parseDate(slot.occupancy_ends_at || slot.ends_at);
    var types = state.sheet.booking_types || [];
    var defaultType = types.find(function (t) { return t.is_default; }) || types[0];
    state.inspector = {
      mode: 'staffHire',
      courtIds: [court.id],
      bookingId: bookingId || null,
      startTime: formatTime(start),
      endTime: formatTime(end),
      recurrence: 'once',
      seriesUntil: addYmd(state.playDate, 84),
      bookingTypeId: slot.booking_type_id || (defaultType && defaultType.id),
      playerUserId: state.userId,
      playerName: state.displayName,
      playerQuery: '',
      staffNote: ''
    };
    render();
  }

  async function openStaffHireFromRecord(rec) {
    await openStaffHire(
      { id: rec.court_id, name: rec.court_name },
      { occupancy_starts_at: rec.starts_at, occupancy_ends_at: rec.ends_at, booking_type_id: rec.booking_type_id },
      rec.id
    );
    state.inspector.playerUserId = rec.booked_for_user_id;
    state.inspector.playerName = rec.booked_for_name;
    state.inspector.staffNote = rec.staff_note || '';
    render();
  }

  function combineDateTime(ymd, hhmmValue) {
    var time = timeParam(hhmmValue);
    var wanted = String(hhmmValue || '').slice(0, 5);
    var candidates = [
      new Date(ymd + 'T' + time + '+01:00'),
      new Date(ymd + 'T' + time + '+00:00')
    ];
    for (var i = 0; i < candidates.length; i++) {
      if (!isNaN(candidates[i].getTime()) && formatTime(candidates[i]) === wanted) {
        return candidates[i];
      }
    }
    return candidates[1];
  }

  async function saveStaffHire() {
    var ins = state.inspector;
    if (!ins.playerUserId) {
      state.error = 'Pick a club member to book as.';
      render();
      return;
    }
    var start = combineDateTime(state.playDate, ins.startTime);
    var end = combineDateTime(state.playDate, ins.endTime);
    if (!(end > start)) end = new Date(start.getTime() + 15 * 60000);
    state.busy = true;
    render();
    try {
      if (!ins.bookingId) {
        var orphan = await S.previewOrphan(ins.courtIds[0], start.toISOString(), end.toISOString());
        if (orphan && !ins.warning) {
          ins.warning = 'This would leave a gap shorter than one member hour. Members cannot book that leftover.';
          state.busy = false;
          render();
          return;
        }
      }
      if (ins.bookingId) {
        await S.updateBooking({
          id: ins.bookingId,
          courtId: ins.courtIds[0],
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          bookedForUserId: ins.playerUserId,
          staffNote: ins.staffNote,
          bookingTypeId: ins.bookingTypeId
        });
      } else {
        await S.createStaffBookings({
          courtIds: ins.courtIds,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          bookedForUserId: ins.playerUserId,
          staffNote: ins.staffNote,
          bookingTypeId: ins.bookingTypeId,
          recurrence: ins.recurrence,
          seriesUntil: ins.recurrence !== 'once' ? ins.seriesUntil : null
        });
      }
      state.busy = false;
      state.notice = 'Booking saved.';
      state.inspector = { mode: 'idle' };
      await loadSheet();
    } catch (err) {
      state.busy = false;
      if (err.code === 'hold_conflicts') {
        ask({
          title: 'Players already have bookings in that time.',
          message: 'Save anyway to cancel the overlapping bookings and keep this staff booking.',
          ok: 'Cancel those bookings and save',
          danger: true,
          action: async function () {
            await S.createStaffBookings({
              courtIds: ins.courtIds,
              startsAt: start.toISOString(),
              endsAt: end.toISOString(),
              bookedForUserId: ins.playerUserId,
              staffNote: ins.staffNote,
              bookingTypeId: ins.bookingTypeId,
              recurrence: ins.recurrence,
              seriesUntil: ins.recurrence !== 'once' ? ins.seriesUntil : null,
              cancelOverlappingHires: true
            });
            state.inspector = { mode: 'idle' };
            await loadSheet();
          }
        });
        return;
      }
      state.error = errorMessage(err);
      render();
    }
  }

  async function openBooking(opts) {
    try {
      var rec = await S.getBooking(opts.booking_id);
      state.inspector = {
        mode: 'booking',
        record: rec,
        own: opts.own || String(rec.booked_for_user_id).toLowerCase() === state.userId,
        courtName: opts.courtName || (opts.court && opts.court.name) || rec.court_name,
        courtId: rec.court_id,
        startsAt: rec.starts_at,
        endsAt: rec.ends_at
      };
      render();
    } catch (err) {
      state.error = errorMessage(err);
      render();
    }
  }

  async function cancelHire() {
    await mutate(function () { return S.cancelBooking(state.inspector.record.id); });
  }

  async function cancelSeries() {
    await mutate(function () { return S.cancelBookingSeries(state.inspector.record.id); });
  }

  async function markNoShow() {
    try {
      await S.markNoShow(state.inspector.record.id);
      await loadSheet();
      await openBooking({ booking_id: state.inspector.record.id, own: state.inspector.own });
    } catch (err) {
      if (err.message && err.message.indexOf('not available') !== -1) state.noShowOk = false;
      state.error = errorMessage(err);
      render();
    }
  }

  async function joinWaitlist() {
    try {
      await S.joinWaitlist(state.inspector.courtId, state.inspector.startsAt, state.inspector.endsAt);
      state.notice = 'You are on the waitlist. If the court frees you will still book it from the day board.';
      render();
    } catch (err) {
      if (err.message && err.message.indexOf('not available') !== -1) state.waitlistOk = false;
      state.error = errorMessage(err);
      render();
    }
  }

  async function mutate(fn) {
    state.busy = true;
    render();
    try {
      await fn();
      state.busy = false;
      state.inspector = { mode: 'idle' };
      state.notice = 'Updated.';
      await loadSheet();
    } catch (err) {
      state.busy = false;
      state.error = errorMessage(err);
      render();
    }
  }

  async function openSettings() {
    if (!canManageSettings()) return;
    state.panel = 'settings';
    state.settings = null;
    render();
    try {
      var settings = await S.getSettings(state.activeClubId);
      var holds = [];
      try { holds = await S.listHolds(state.activeClubId); } catch (e) { holds = []; }
      settings.holds = holds;
      state.settings = settings;
      render();
    } catch (err) {
      state.panel = null;
      state.error = errorMessage(err);
      render();
    }
  }

  async function saveSettings() {
    var s = state.settings;
    var hours = collectDayHours();
    var openDays = hours.filter(function (h) { return !h.is_closed; });
    var earliest = openDays.length ? openDays.map(function (h) { return h.earliest_open; }).sort()[0] : s.earliest_open;
    var latest = openDays.length ? openDays.map(function (h) { return h.latest_close; }).sort().slice(-1)[0] : s.latest_close;
    var payload = {
      club_id: s.club_id,
      sheet_privacy: val('cbSheetPrivacy', s.sheet_privacy),
      names_privacy: val('cbNamesPrivacy', s.names_privacy),
      earliest_open: timeParam(earliest),
      latest_close: timeParam(latest),
      new_day_unlock: timeParam(val('cbUnlock', s.new_day_unlock)),
      slot_minutes: Number(s.slot_minutes),
      group_booking: !!(document.getElementById('cbGroup') && document.getElementById('cbGroup').checked),
      cancel_hours: num('cbCancelHours', s.cancel_hours),
      advance_days: num('cbAdvance', s.advance_days),
      max_bookings: num('cbMaxBookings', s.max_bookings),
      max_bookings_period_days: num('cbPeriod', s.max_bookings_period_days),
      max_slots: num('cbMaxSlots', s.max_slots),
      min_slots: num('cbMinSlots', s.min_slots),
      enabled: !!(document.getElementById('cbEnabled') && document.getElementById('cbEnabled').checked),
      day_hours: hours.map(function (h) {
        return {
          weekday: h.weekday,
          earliest_open: timeParam(h.earliest_open),
          latest_close: timeParam(h.latest_close),
          is_closed: !!h.is_closed
        };
      })
    };
    if (payload.min_slots > payload.max_slots) payload.min_slots = payload.max_slots;
    state.busy = true;
    render();
    try {
      await S.saveSettings(payload);
      state.busy = false;
      state.panel = null;
      state.notice = 'Settings saved.';
      await loadSheet();
    } catch (err) {
      state.busy = false;
      state.error = errorMessage(err);
      render();
    }
  }

  function val(id, fallback) {
    var el = document.getElementById(id);
    return el ? el.value : fallback;
  }

  function num(id, fallback) {
    return Number(val(id, fallback));
  }

  async function addType() {
    var input = document.getElementById('cbNewType');
    var name = input ? input.value.trim() : '';
    if (!name) return;
    try {
      await S.saveBookingType(state.settings.club_id, null, name, (state.settings.booking_types || []).length % 12);
      await openSettings();
    } catch (err) {
      state.error = errorMessage(err);
      render();
    }
  }

  async function openPlayers() {
    if (!canManageSettings()) return;
    state.panel = 'players';
    render();
    try {
      state.players = await S.listClubPlayers(state.activeClubId);
      render();
    } catch (err) {
      state.panel = null;
      state.error = errorMessage(err);
      render();
    }
  }

  async function openMine() {
    state.panel = 'mine';
    state.myBookings = null;
    render();
    try {
      state.myBookings = await S.listMyBookings();
      render();
    } catch (err) {
      state.myBookings = [];
      state.error = errorMessage(err);
      render();
    }
  }

  function openHold() {
    if (!actingAsStaff()) return;
    state.holdForm = defaultHoldForm();
    state.panel = 'hold';
    render();
  }

  function readHoldForm() {
    var ids = [];
    document.querySelectorAll('[data-hold-court]:checked').forEach(function (box) {
      ids.push(box.getAttribute('data-hold-court'));
    });
    return {
      courtIds: ids.length ? ids : (state.holdForm && state.holdForm.courtIds) || [],
      startTime: val('cbHoldStart', state.holdForm.startTime),
      endTime: val('cbHoldEnd', state.holdForm.endTime),
      recurrence: val('cbHoldRecur', state.holdForm.recurrence),
      seriesUntil: val('cbHoldUntil', state.holdForm.seriesUntil),
      reason: val('cbHoldReason', state.holdForm.reason),
      note: val('cbHoldNote', state.holdForm.note || '')
    };
  }

  async function saveHold() {
    var form = readHoldForm();
    if (!form.courtIds.length) return;
    if (form.reason === 'other' && !String(form.note || '').trim()) {
      state.error = 'Please add a name or note.';
      render();
      return;
    }
    var start = combineDateTime(state.playDate, form.startTime);
    var end = combineDateTime(state.playDate, form.endTime);
    if (!(end > start)) end = new Date(start.getTime() + 15 * 60000);
    state.busy = true;
    render();
    try {
      await S.createHold({
        courtIds: form.courtIds,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        reason: form.reason,
        note: form.note,
        recurrence: form.recurrence,
        seriesUntil: form.recurrence !== 'once' ? form.seriesUntil : null
      });
      state.busy = false;
      state.panel = null;
      await loadSheet();
    } catch (err) {
      state.busy = false;
      if (err.code === 'hold_conflicts') {
        ask({
          title: 'Players already have bookings in that time.',
          message: 'Save anyway to cancel the overlapping bookings and hold the courts.',
          ok: 'Cancel those bookings and hold',
          danger: true,
          action: async function () {
            await S.createHold({
              courtIds: form.courtIds,
              startsAt: start.toISOString(),
              endsAt: end.toISOString(),
              reason: form.reason,
              note: form.note,
              recurrence: form.recurrence,
              seriesUntil: form.recurrence !== 'once' ? form.seriesUntil : null,
              cancelOverlappingHires: true
            });
            state.panel = null;
            await loadSheet();
          }
        });
        return;
      }
      state.error = errorMessage(err);
      render();
    }
  }

  function filterMembers(query) {
    var q = String(query || '').trim().toLowerCase();
    if (!q) return state.members.slice(0, 8);
    return state.members.filter(function (m) {
      return String(m.display_name || m.short_name || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && state.sheet) loadSheet();
  });

  bootstrap();
})(window);

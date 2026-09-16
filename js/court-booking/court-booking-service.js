/**
 * Supabase RPC client for court booking.
 * Port of CourtBookingService.swift — writes go through SECURITY DEFINER RPCs only.
 */
(function (global) {
  'use strict';

  var ERROR_COPY = {
    slot_taken: 'That court is no longer free.',
    quota_exceeded: 'You already have a court booked on that day.',
    not_yet_released: 'That day is not open for booking yet. New days unlock at the club’s unlock time.',
    too_far_ahead: 'That time is not available to book.',
    too_late: 'It is too close to the start time to cancel. Please ask the club if you need to change this.',
    too_short: 'That booking is shorter than the club allows.',
    too_long: 'That booking is longer than the club allows.',
    orphan_gap: 'That time would leave a gap too short to book. Please choose a different slot.',
    outside_hours: 'That time is outside club opening hours.',
    invalid_hours: 'Please set a closing time later than opening for each open day.',
    invalid_step: 'Please choose a start time that matches the slot length.',
    court_inactive: 'That court is not available.',
    not_authorized: 'You do not have access to book this court.',
    not_ready: 'Member booking could not be turned on yet.',
    note_required: 'Please add a name or note.',
    hold_conflicts: 'Players already have bookings in that time.',
    courts_not_held: 'Book these courts before opening the social.',
    court_listed: 'Another lesson is already listed on that court at that time.',
    court_unavailable: 'That court is already booked or held at that time.',
    court_required: 'Assign a court to this lesson before players can join.',
    window_closed: 'That play time is closed.',
    already_confirmed: 'That box league match is already confirmed.'
  };

  function CourtBookingError(code, message) {
    var err = new Error(message || ERROR_COPY[code] || code || 'Something went wrong. Please try again.');
    err.code = code || 'error';
    err.name = 'CourtBookingError';
    return err;
  }

  function restBase() {
    if (!global.config || !global.config.supabaseUrl) {
      throw CourtBookingError('invalidResponse', 'Could not reach bookings.');
    }
    return String(global.config.supabaseUrl).replace(/\/$/, '') + '/rest/v1/';
  }

  function getClient() {
    if (typeof global.getOrCreateSupabaseClient === 'function') {
      return global.getOrCreateSupabaseClient();
    }
    return global.supabaseClient;
  }

  async function getAccessToken() {
    var client = getClient();
    if (!client || !client.auth) throw CourtBookingError('notAuthenticated', 'Sign in to book a court.');
    var result = await client.auth.getSession();
    if (result.error || !result.data || !result.data.session || !result.data.session.access_token) {
      throw CourtBookingError('notAuthenticated', 'Sign in to book a court.');
    }
    return {
      token: result.data.session.access_token,
      userId: String(result.data.session.user.id).toLowerCase(),
      user: result.data.session.user,
      session: result.data.session
    };
  }

  function extractRpcCode(text) {
    if (!text) return '';
    try {
      var obj = JSON.parse(text);
      var raw = String(obj.message || obj.error || obj.hint || '').trim();
      if (!raw) return '';
      var match = raw.match(/([a-z_]+)/i);
      var token = (match ? match[1] : raw).toLowerCase();
      if (ERROR_COPY[token]) return token;
      for (var key in ERROR_COPY) {
        if (Object.prototype.hasOwnProperty.call(ERROR_COPY, key) && raw.toLowerCase().indexOf(key) !== -1) {
          return key;
        }
      }
      return token;
    } catch (e) {
      return '';
    }
  }

  async function request(path, options) {
    options = options || {};
    var auth = await getAccessToken();
    var query = options.query || '';
    var url = restBase() + path + (query ? (query.charAt(0) === '?' ? query : '?' + query) : '');
    var headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      apikey: global.config.supabaseKey,
      Authorization: 'Bearer ' + auth.token
    };
    if (options.prefer) headers.Prefer = options.prefer;

    var response;
    try {
      response = await fetch(url, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined
      });
    } catch (e) {
      throw CourtBookingError('invalidResponse', 'Could not reach bookings.');
    }

    var text = await response.text().catch(function () { return ''; });
    if (!response.ok) {
      var code = extractRpcCode(text);
      var fallback = 'Something went wrong. Please try again.';
      if (response.status === 401 || response.status === 403) fallback = ERROR_COPY.not_authorized;
      if (response.status === 404) fallback = 'That action is not available yet.';
      throw CourtBookingError(code || String(response.status), ERROR_COPY[code] || fallback);
    }
    if (response.status === 204 || !text) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      throw CourtBookingError('invalidResponse', 'Could not read the booking response.');
    }
  }

  function rpc(name, body) {
    return request('rpc/' + name, { method: 'POST', body: body || {} });
  }

  function unwrapUuid(value) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.id) return String(value.id);
      if (Array.isArray(value) && value[0]) return unwrapUuid(value[0]);
    }
    return String(value);
  }

  var api = {
    CourtBookingError: CourtBookingError,
    errorCopy: ERROR_COPY,
    getAccessToken: getAccessToken,
    getClient: getClient,

    listSheet: function (clubId, playDate) {
      return rpc('list_booking_sheet', { p_club_id: clubId, p_play_date: playDate });
    },
    createBooking: function (opts) {
      var body = {
        p_court_id: opts.courtId,
        p_starts_at: opts.startsAt,
        p_slot_count: opts.slotCount
      };
      if (opts.bookedForUserId) body.p_booked_for_user_id = opts.bookedForUserId;
      if (opts.endsAt) body.p_ends_at = opts.endsAt;
      if (opts.staffNote) body.p_staff_note = opts.staffNote;
      if (opts.bookingTypeId) body.p_booking_type_id = opts.bookingTypeId;
      return rpc('create_court_booking', body).then(unwrapUuid);
    },
    createStaffBookings: function (opts) {
      var body = {
        p_court_ids: opts.courtIds,
        p_starts_at: opts.startsAt,
        p_ends_at: opts.endsAt,
        p_booked_for_user_id: opts.bookedForUserId,
        p_recurrence: opts.recurrence || 'once',
        p_cancel_overlapping_hires: !!opts.cancelOverlappingHires
      };
      if (opts.seriesUntil) body.p_series_until = opts.seriesUntil;
      body.p_staff_note = opts.staffNote || null;
      body.p_booking_type_id = opts.bookingTypeId || null;
      return rpc('create_staff_court_bookings', body).then(unwrapUuid);
    },
    updateBooking: function (opts) {
      var body = {
        p_booking_id: opts.id,
        p_court_id: opts.courtId,
        p_starts_at: opts.startsAt,
        p_ends_at: opts.endsAt,
        p_booked_for_user_id: opts.bookedForUserId
      };
      body.p_staff_note = opts.staffNote || null;
      if (opts.bookingTypeId) body.p_booking_type_id = opts.bookingTypeId;
      return rpc('update_court_booking', body);
    },
    cancelBooking: function (id) {
      return rpc('cancel_court_booking', { p_booking_id: id });
    },
    cancelBookingSeries: function (id) {
      return rpc('cancel_court_booking_series', { p_booking_id: id });
    },
    getBooking: function (id) {
      return rpc('get_court_booking', { p_booking_id: id });
    },
    previewOrphan: function (courtId, startsAt, endsAt, ignoreBookingId) {
      var body = { p_court_id: courtId, p_starts_at: startsAt, p_ends_at: endsAt };
      if (ignoreBookingId) body.p_ignore_booking_id = ignoreBookingId;
      return rpc('preview_court_booking_orphan', body).then(function (flag) {
        return flag === true;
      });
    },
    listMyBookings: function () {
      return rpc('list_my_court_bookings', {}).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      });
    },
    joinWaitlist: function (courtId, startsAt, endsAt) {
      return rpc('join_court_waitlist', {
        p_court_id: courtId,
        p_starts_at: startsAt,
        p_ends_at: endsAt
      });
    },
    createHold: function (opts) {
      var body = {
        p_court_ids: opts.courtIds,
        p_starts_at: opts.startsAt,
        p_ends_at: opts.endsAt,
        p_reason: opts.reason || 'maintenance',
        p_recurrence: opts.recurrence || 'once',
        p_cancel_overlapping_hires: !!opts.cancelOverlappingHires
      };
      if (opts.seriesUntil) body.p_series_until = opts.seriesUntil;
      body.p_note = opts.note || null;
      return rpc('create_court_hold', body);
    },
    deleteHold: function (id) {
      return rpc('delete_court_hold', { p_hold_id: id });
    },
    skipHoldDate: function (id, playDate) {
      return rpc('skip_court_hold_date', { p_hold_id: id, p_play_date: playDate });
    },
    listHolds: function (clubId) {
      return rpc('list_court_holds', { p_club_id: clubId }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      });
    },
    markNoShow: function (bookingId) {
      return rpc('mark_court_booking_no_show', { p_booking_id: bookingId });
    },
    getSettings: function (clubId) {
      return rpc('get_court_booking_settings', { p_club_id: clubId });
    },
    saveSettings: function (settings) {
      return rpc('admin_update_booking_settings', {
        p_club_id: settings.club_id,
        p_sheet_privacy: settings.sheet_privacy,
        p_names_privacy: settings.names_privacy,
        p_earliest_open: settings.earliest_open,
        p_latest_close: settings.latest_close,
        p_new_day_unlock: settings.new_day_unlock,
        p_slot_minutes: settings.slot_minutes,
        p_group_booking: settings.group_booking,
        p_cancel_hours: settings.cancel_hours,
        p_advance_days: settings.advance_days,
        p_max_bookings: settings.max_bookings,
        p_max_bookings_period_days: settings.max_bookings_period_days,
        p_max_slots: settings.max_slots,
        p_min_slots: settings.min_slots,
        p_enabled: settings.enabled,
        p_day_hours: settings.day_hours
      });
    },
    saveBookingType: function (clubId, id, name, colourIndex) {
      return rpc('admin_save_booking_type', {
        p_club_id: clubId,
        p_id: id || null,
        p_name: name,
        p_colour_index: colourIndex
      }).then(unwrapUuid);
    },
    deleteBookingType: function (clubId, id) {
      return rpc('admin_delete_booking_type', { p_club_id: clubId, p_id: id });
    },
    listClubPlayers: function (clubId) {
      return rpc('admin_list_club_players', { p_club_id: clubId }).then(function (rows) {
        if (Array.isArray(rows)) return rows;
        if (typeof rows === 'string') {
          try {
            var parsed = JSON.parse(rows);
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        }
        return [];
      });
    },
    setClubBookingAccess: function (clubId, userId, allowed) {
      return rpc('admin_set_club_booking_access', {
        p_club_id: clubId,
        p_user_id: userId,
        p_allowed: allowed
      });
    },
    fetchProfile: function (userId) {
      return request('user_profiles', {
        query: 'id=eq.' + encodeURIComponent(userId) + '&select=id,display_name,short_name,club_id,isAdmin,is_coach,clubs!user_profiles_club_id_fkey(id,club_name,primary_color,secondary_color,logo_url)'
      }).then(function (rows) {
        return rows && rows[0] ? rows[0] : null;
      });
    },
    fetchClubRoles: function (userId) {
      return request('club_roles', {
        query: 'user_id=eq.' + encodeURIComponent(userId) + '&select=club_id,role'
      }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      });
    },
    fetchClubs: function (ids) {
      if (!ids || !ids.length) return Promise.resolve([]);
      return request('clubs', {
        query: 'id=in.(' + ids.join(',') + ')&select=id,club_name,primary_color,secondary_color,logo_url'
      }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      });
    },
    fetchClubMembers: function (clubId) {
      return request('user_profiles', {
        query: 'club_id=eq.' + encodeURIComponent(clubId) + '&select=id,display_name,short_name,avatar_url&order=display_name.asc'
      }).then(function (rows) {
        return Array.isArray(rows) ? rows : [];
      });
    }
  };

  global.CourtBookingService = api;
})(window);

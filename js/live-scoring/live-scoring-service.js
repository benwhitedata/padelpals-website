/**
 * Supabase REST client for match live scoring.
 * Port of MatchLiveScoringService.swift — never writes parent match set scores.
 */
(function (global) {
  'use strict';

  const ERRORS = {
    notAuthenticated: 'Sign in to use live scoring.',
    incompleteRoster: 'Live scoring needs all four players filled in before you can start.',
    invalidResponse: "Couldn't reach the live scoring service. Please try again.",
    noActivePointToUndo: "There's no point to undo.",
    sessionNotActive: 'This live scoring session is no longer active.',
    sessionAlreadyCaptured:
      'Live scoring has already been captured for this match. Open Live results to review it.',
    sessionAbandoned:
      'This live scoring session was abandoned. You can continue it or delete it.'
  };

  function LiveScoringError(code, message) {
    const err = new Error(message || ERRORS[code] || code);
    err.code = code;
    err.name = 'LiveScoringError';
    return err;
  }

  function isoString(date) {
    return (date || new Date()).toISOString();
  }

  function restBase() {
    if (!global.config || !global.config.supabaseUrl) {
      throw LiveScoringError('invalidResponse');
    }
    return String(global.config.supabaseUrl).replace(/\/$/, '') + '/rest/v1/';
  }

  async function getAccessToken() {
    const client =
      typeof global.getOrCreateSupabaseClient === 'function'
        ? global.getOrCreateSupabaseClient()
        : global.supabaseClient;
    if (!client || !client.auth) throw LiveScoringError('notAuthenticated');
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.access_token) throw LiveScoringError('notAuthenticated');
    return {
      token: data.session.access_token,
      userId: String(data.session.user.id).toLowerCase()
    };
  }

  async function request(path, { method = 'GET', query = '', body, preferReturn } = {}) {
    const { token } = await getAccessToken();
    const url = restBase() + path + (query ? (query.startsWith('?') ? query : '?' + query) : '');
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      apikey: global.config.supabaseKey,
      Authorization: 'Bearer ' + token
    };
    if (preferReturn) headers.Prefer = 'return=representation';

    let response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      throw LiveScoringError('invalidResponse');
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw LiveScoringError(
        'server',
        'Supabase error (' + response.status + '): ' + (text || 'Unknown error')
      );
    }

    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      throw LiveScoringError('invalidResponse');
    }
  }

  function rosterSnapshot(match) {
    const Eng = global.LiveScoreEngine;
    const t1Ids = (match.team1?.playerIds || [])
      .map((id) => String(id).toLowerCase())
      .filter((id) => id && !id.startsWith('placeholder_'));
    const t2Ids = (match.team2?.playerIds || [])
      .map((id) => String(id).toLowerCase())
      .filter((id) => id && !id.startsWith('placeholder_'));
    const t1Names = (match.team1?.players || []).map(Eng.nameOnly);
    const t2Names = (match.team2?.players || []).map(Eng.nameOnly);

    if (
      t1Ids.length !== 2 ||
      t2Ids.length !== 2 ||
      t1Names.length < 2 ||
      t2Names.length < 2 ||
      !t1Names[0] ||
      !t1Names[1] ||
      !t2Names[0] ||
      !t2Names[1]
    ) {
      throw LiveScoringError('incompleteRoster');
    }

    return {
      team1Ids: t1Ids.slice(0, 2),
      team2Ids: t2Ids.slice(0, 2),
      team1Names: t1Names.slice(0, 2),
      team2Names: t2Names.slice(0, 2)
    };
  }

  function hasFullRoster(match) {
    try {
      rosterSnapshot(match);
      return true;
    } catch (e) {
      return false;
    }
  }

  function canUserParticipate(match, userId, isAdmin) {
    if (isAdmin) return true;
    if (!userId) return false;
    const uid = String(userId).toLowerCase();
    const ids = [
      ...(match.team1?.playerIds || []),
      ...(match.team2?.playerIds || [])
    ].map((id) => String(id).toLowerCase());
    return ids.includes(uid);
  }

  async function fetchActiveSession(matchId, category) {
    const cat = global.LiveScoreEngine.normalizeMatchCategory(category);
    const rows = await request(
      'match_live_sessions',
      {
        query:
          'match_id=eq.' +
          encodeURIComponent(String(matchId).toLowerCase()) +
          '&match_category=eq.' +
          encodeURIComponent(cat) +
          '&status=in.(in_progress,paused)&order=created_at.desc&limit=1'
      }
    );
    return (rows && rows[0]) || null;
  }

  async function fetchLatestSession(matchId, category) {
    const cat = global.LiveScoreEngine.normalizeMatchCategory(category);
    const rows = await request(
      'match_live_sessions',
      {
        query:
          'match_id=eq.' +
          encodeURIComponent(String(matchId).toLowerCase()) +
          '&match_category=eq.' +
          encodeURIComponent(cat) +
          '&order=created_at.desc&limit=1'
      }
    );
    return (rows && rows[0]) || null;
  }

  async function fetchActiveOrLatest(matchId, category) {
    const active = await fetchActiveSession(matchId, category);
    if (active) return active;
    return fetchLatestSession(matchId, category);
  }

  async function fetchPoints(sessionId, includeUndone) {
    let query =
      'session_id=eq.' +
      encodeURIComponent(String(sessionId).toLowerCase()) +
      '&order=sequence.asc';
    if (!includeUndone) query += '&is_undone=eq.false';
    const rows = await request('match_live_points', { query });
    return rows || [];
  }

  async function sessionHasCapturedData(session) {
    const points = await fetchPoints(session.id, false);
    return points.length > 0;
  }

  async function patchSession(id, fields) {
    const rows = await request('match_live_sessions', {
      method: 'PATCH',
      query: 'id=eq.' + encodeURIComponent(String(id).toLowerCase()),
      body: fields,
      preferReturn: true
    });
    if (!rows || !rows[0]) throw LiveScoringError('invalidResponse');
    return rows[0];
  }

  async function reopenEmptySession(session, roster) {
    const snapshot = global.LiveScoreEngine.initialSnapshot(
      session.number_of_sets,
      session.match_category
    );
    return patchSession(session.id, {
      status: 'in_progress',
      started_at: isoString(new Date()),
      ended_at: null,
      paused_at: null,
      accumulated_pause_ms: 0,
      team1_player_ids: roster.team1Ids,
      team2_player_ids: roster.team2Ids,
      team1_player_names: roster.team1Names,
      team2_player_names: roster.team2Names,
      score_snapshot: snapshot
    });
  }

  async function startSession(match) {
    const roster = rosterSnapshot(match);
    const { userId } = await getAccessToken();
    const matchId = match.id;
    const category = global.LiveScoreEngine.normalizeMatchCategory(match.matchCategory);

    const active = await fetchActiveSession(matchId, category);
    if (active) return active;

    const latest = await fetchLatestSession(matchId, category);
    if (latest) {
      if (await sessionHasCapturedData(latest)) {
        if (latest.status === 'abandoned') throw LiveScoringError('sessionAbandoned');
        throw LiveScoringError('sessionAlreadyCaptured');
      }
      if (latest.status === 'abandoned' || latest.status === 'completed') {
        return reopenEmptySession(latest, roster);
      }
    }

    const numberOfSets = match.numberOfSets === 5 ? 5 : 3;
    const snapshot = global.LiveScoreEngine.initialSnapshot(numberOfSets, category);
    const payload = {
      match_id: String(matchId).toLowerCase(),
      match_category: category,
      status: 'in_progress',
      created_by: userId,
      number_of_sets: numberOfSets,
      golden_point_at_deuce: false,
      team1_player_ids: roster.team1Ids,
      team2_player_ids: roster.team2Ids,
      team1_player_names: roster.team1Names,
      team2_player_names: roster.team2Names,
      score_snapshot: snapshot,
      accumulated_pause_ms: 0
    };

    const rows = await request('match_live_sessions', {
      method: 'POST',
      body: payload,
      preferReturn: true
    });
    if (!rows || !rows[0]) throw LiveScoringError('invalidResponse');
    return rows[0];
  }

  async function continueAbandonedSession(session) {
    if (session.status !== 'abandoned') throw LiveScoringError('sessionNotActive');
    return patchSession(session.id, {
      status: 'paused',
      ended_at: null,
      paused_at: isoString(new Date())
    });
  }

  async function deleteSession(session) {
    await request('match_live_sessions', {
      method: 'DELETE',
      query: 'id=eq.' + encodeURIComponent(String(session.id).toLowerCase())
    });
  }

  async function pause(session) {
    return patchSession(session.id, {
      status: 'paused',
      paused_at: isoString(new Date())
    });
  }

  async function resume(session) {
    let accumulated = session.accumulated_pause_ms || 0;
    if (session.paused_at) {
      accumulated += Date.now() - new Date(session.paused_at).getTime();
    }
    return patchSession(session.id, {
      status: 'in_progress',
      paused_at: null,
      accumulated_pause_ms: accumulated
    });
  }

  async function complete(session, snapshot) {
    return patchSession(session.id, {
      status: 'completed',
      ended_at: isoString(new Date()),
      paused_at: null,
      score_snapshot: snapshot
    });
  }

  async function abandon(session, snapshot) {
    return patchSession(session.id, {
      status: 'abandoned',
      ended_at: isoString(new Date()),
      paused_at: null,
      score_snapshot: snapshot
    });
  }

  async function updateSnapshot(snapshot, sessionId) {
    await patchSession(sessionId, { score_snapshot: snapshot });
  }

  async function appendPoint(session, draft, outcome, elapsedMs, nextSequence) {
    if (session.status !== 'in_progress' && session.status !== 'paused') {
      throw LiveScoringError('sessionNotActive');
    }
    const payload = {
      session_id: String(session.id).toLowerCase(),
      sequence: nextSequence,
      occurred_at: isoString(new Date()),
      elapsed_ms: elapsedMs,
      set_index: global.LiveScoreEngine.snapshotHelpers(outcome.before).currentSetIndex,
      game_index: global.LiveScoreEngine.snapshotHelpers(outcome.before).currentGameIndex,
      team1_games_before: outcome.before.team1Games,
      team2_games_before: outcome.before.team2Games,
      team1_points_before: outcome.before.team1Points,
      team2_points_before: outcome.before.team2Points,
      team1_games_after: outcome.after.team1Games,
      team2_games_after: outcome.after.team2Games,
      team1_points_after: outcome.after.team1Points,
      team2_points_after: outcome.after.team2Points,
      awarding_team: draft.awardingTeam,
      attribution: draft.attribution,
      player_id: draft.playerId ? String(draft.playerId).toLowerCase() : null,
      player_slot: draft.playerSlot || null,
      server_slot: draft.serverSlot || null,
      reason: (draft.reason || '').trim() || null,
      is_golden_point: !!(outcome.isGoldenPoint || draft.isGoldenPoint),
      won_game: !!outcome.wonGame,
      won_set: !!outcome.wonSet,
      won_match: !!outcome.wonMatch,
      is_undone: false
    };

    const rows = await request('match_live_points', {
      method: 'POST',
      body: payload,
      preferReturn: true
    });
    if (!rows || !rows[0]) throw LiveScoringError('invalidResponse');

    const updated = await patchSession(session.id, {
      score_snapshot: outcome.after
    });
    return { point: rows[0], session: updated };
  }

  async function undoLastPoint(session) {
    const allActive = await fetchPoints(session.id, false);
    const last = allActive[allActive.length - 1];
    if (!last || !last.id) throw LiveScoringError('noActivePointToUndo');

    await request('match_live_points', {
      method: 'PATCH',
      query: 'id=eq.' + encodeURIComponent(String(last.id).toLowerCase()),
      body: { is_undone: true },
      preferReturn: true
    });

    let snapshot = global.LiveScoreEngine.initialSnapshot(
      session.number_of_sets,
      session.match_category
    );
    const remaining = await fetchPoints(session.id, false);
    remaining.forEach((point) => {
      if (point.server_slot) {
        global.LiveServeRotation.chooseServer(point.server_slot, snapshot);
      }
      const helpers = global.LiveScoreEngine.snapshotHelpers(snapshot);
      const mode = point.is_golden_point
        ? 'golden'
        : helpers.isDeuce
          ? 'advantage'
          : null;
      const outcome = global.LiveScoreEngine.apply(
        point.awarding_team,
        snapshot,
        mode || snapshot.deuceMode
      );
      snapshot = outcome.after;
    });
    global.LiveServeRotation.syncCurrentServer(snapshot);

    const updated = await patchSession(session.id, { score_snapshot: snapshot });
    return { session: updated, points: remaining };
  }

  global.MatchLiveScoringService = {
    ERRORS,
    LiveScoringError,
    hasFullRoster,
    rosterSnapshot,
    canUserParticipate,
    fetchActiveSession,
    fetchLatestSession,
    fetchActiveOrLatest,
    fetchPoints,
    sessionHasCapturedData,
    startSession,
    continueAbandonedSession,
    deleteSession,
    pause,
    resume,
    complete,
    abandon,
    updateSnapshot,
    appendPoint,
    undoLastPoint
  };
})(typeof window !== 'undefined' ? window : globalThis);

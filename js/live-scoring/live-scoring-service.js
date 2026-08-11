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

  /** Elapsed playing time for the session clock (finished sessions use ended_at). */
  function elapsedMsFor(session, atDate) {
    const at = atDate ? new Date(atDate).getTime() : Date.now();
    const started = new Date(session.started_at).getTime();
    switch (session.status) {
      case 'completed':
      case 'abandoned': {
        const end = session.ended_at ? new Date(session.ended_at).getTime() : at;
        return Math.max(0, end - started - (session.accumulated_pause_ms || 0));
      }
      case 'paused': {
        let pauseMs = session.accumulated_pause_ms || 0;
        if (session.paused_at) {
          pauseMs += at - new Date(session.paused_at).getTime();
        }
        return Math.max(0, at - started - pauseMs);
      }
      case 'in_progress':
      default:
        return Math.max(0, at - started - (session.accumulated_pause_ms || 0));
    }
  }

  /** PATCH fields so the session clock presents presentingElapsedMs at `at`. */
  function clockFields(presentingElapsedMs, startedAt, atDate, status) {
    const at = atDate ? new Date(atDate).getTime() : Date.now();
    const sinceStart = at - new Date(startedAt).getTime();
    const accumulated = Math.max(0, sinceStart - presentingElapsedMs);
    const fields = {
      status: status,
      accumulated_pause_ms: accumulated
    };
    if (status === 'paused') {
      fields.paused_at = isoString(new Date(at));
    } else {
      fields.paused_at = null;
    }
    return fields;
  }

  /**
   * Resume an abandoned or completed session from its last checkpoint.
   * Lands paused; clock restores elapsed at close (not wall time since then).
   */
  async function continueFinishedSession(session) {
    if (session.status !== 'abandoned' && session.status !== 'completed') {
      throw LiveScoringError('sessionNotActive');
    }
    const snapshot = global.LiveScoreEngine.cloneSnapshot(
      session.score_snapshot ||
        global.LiveScoreEngine.initialSnapshot(session.number_of_sets, session.match_category)
    );
    if (snapshot.matchDecided) snapshot.matchDecided = false;

    const elapsedAtClose = elapsedMsFor(session, session.ended_at || new Date());
    const now = new Date();
    const fields = clockFields(elapsedAtClose, session.started_at, now, 'paused');
    fields.ended_at = null;
    fields.score_snapshot = snapshot;
    return patchSession(session.id, fields);
  }

  /** @deprecated use continueFinishedSession */
  async function continueAbandonedSession(session) {
    return continueFinishedSession(session);
  }

  /** Set the live clock to elapsedMs. Must be ≥ last active point’s elapsed (or 0). */
  async function setElapsedMs(elapsedMs, session, minimumMs) {
    if (session.status !== 'in_progress' && session.status !== 'paused') {
      throw LiveScoringError('sessionNotActive');
    }
    const target = Math.max(minimumMs || 0, elapsedMs);
    const status = session.status === 'in_progress' ? 'in_progress' : 'paused';
    const fields = clockFields(target, session.started_at, new Date(), status);
    return patchSession(session.id, fields);
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

  async function finishSession(session, snapshot, status) {
    const now = new Date();
    let accumulated = session.accumulated_pause_ms || 0;
    if (session.paused_at && session.status === 'paused') {
      accumulated += now.getTime() - new Date(session.paused_at).getTime();
    }
    return patchSession(session.id, {
      status: status,
      ended_at: isoString(now),
      paused_at: null,
      accumulated_pause_ms: accumulated,
      score_snapshot: snapshot
    });
  }

  async function complete(session, snapshot) {
    return finishSession(session, snapshot, 'completed');
  }

  async function abandon(session, snapshot) {
    return finishSession(session, snapshot, 'abandoned');
  }

  async function updateSnapshot(snapshot, sessionId) {
    await patchSession(sessionId, { score_snapshot: snapshot });
  }

  async function nextSequenceNumber(sessionId) {
    const all = await fetchPoints(sessionId, true);
    let max = 0;
    all.forEach((p) => {
      if (p.sequence > max) max = p.sequence;
    });
    return max + 1;
  }

  async function appendPoint(session, draft, outcome, elapsedMs, nextSequence) {
    if (session.status !== 'in_progress' && session.status !== 'paused') {
      throw LiveScoringError('sessionNotActive');
    }
    const sequence =
      nextSequence != null ? nextSequence : await nextSequenceNumber(session.id);
    const payload = {
      session_id: String(session.id).toLowerCase(),
      sequence: sequence,
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

  async function deletePoint(id) {
    await request('match_live_points', {
      method: 'DELETE',
      query: 'id=eq.' + encodeURIComponent(String(id).toLowerCase())
    });
  }

  /** Replay active points to refresh before/after scores, win flags, and session snapshot. */
  async function rebuildScores(session) {
    let snapshot = global.LiveScoreEngine.initialSnapshot(
      session.number_of_sets,
      session.match_category
    );
    const remaining = await fetchPoints(session.id, false);
    for (const point of remaining) {
      if (!point.id) continue;
      if (point.server_slot) {
        global.LiveServeRotation.chooseServer(point.server_slot, snapshot);
      }
      const before = global.LiveScoreEngine.cloneSnapshot(snapshot);
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

      await request('match_live_points', {
        method: 'PATCH',
        query: 'id=eq.' + encodeURIComponent(String(point.id).toLowerCase()),
        body: {
          set_index: global.LiveScoreEngine.snapshotHelpers(before).currentSetIndex,
          game_index: global.LiveScoreEngine.snapshotHelpers(before).currentGameIndex,
          team1_games_before: before.team1Games,
          team2_games_before: before.team2Games,
          team1_points_before: before.team1Points,
          team2_points_before: before.team2Points,
          team1_games_after: outcome.after.team1Games,
          team2_games_after: outcome.after.team2Games,
          team1_points_after: outcome.after.team1Points,
          team2_points_after: outcome.after.team2Points,
          is_golden_point: !!(outcome.isGoldenPoint || point.is_golden_point),
          won_game: !!outcome.wonGame,
          won_set: !!outcome.wonSet,
          won_match: !!outcome.wonMatch
        }
      });
    }
    global.LiveServeRotation.syncCurrentServer(snapshot);
    const updated = await patchSession(session.id, { score_snapshot: snapshot });
    const refreshed = await fetchPoints(session.id, false);
    return { session: updated, points: refreshed };
  }

  /** Hard-delete the last active point, then rebuild snapshot (fixes sequence 409 on redo). */
  async function undoLastPoint(session) {
    const allActive = await fetchPoints(session.id, false);
    const last = allActive[allActive.length - 1];
    if (!last || !last.id) throw LiveScoringError('noActivePointToUndo');
    await deletePoint(last.id);
    return rebuildScores(session);
  }

  /** Replace attribution / detail on an existing point, then rebuild score fields. */
  async function replacePoint(session, pointId, draft) {
    const fields = {
      awarding_team: draft.awardingTeam,
      attribution: draft.attribution,
      is_golden_point: !!draft.isGoldenPoint,
      is_undone: false,
      player_id: draft.playerId ? String(draft.playerId).toLowerCase() : null,
      player_slot: draft.attribution === 'team_award' ? null : draft.playerSlot || null,
      reason: (draft.reason || '').trim() || null
    };
    if (draft.serverSlot) fields.server_slot = draft.serverSlot;

    await request('match_live_points', {
      method: 'PATCH',
      query: 'id=eq.' + encodeURIComponent(String(pointId).toLowerCase()),
      body: fields
    });
    return rebuildScores(session);
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
    continueFinishedSession,
    continueAbandonedSession,
    setElapsedMs,
    elapsedMsFor,
    deleteSession,
    pause,
    resume,
    complete,
    abandon,
    updateSnapshot,
    nextSequenceNumber,
    appendPoint,
    undoLastPoint,
    replacePoint,
    rebuildScores
  };
})(typeof window !== 'undefined' ? window : globalThis);

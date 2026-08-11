/**
 * Aggregates a live session for Summary + Match log.
 * Port of LiveScoringAnalytics.swift.
 */
(function (global) {
  'use strict';

  function formatDuration(ms) {
    const total = Math.max(0, Math.floor(Number(ms) / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return h + 'h ' + String(m).padStart(2, '0') + 'm';
    if (m > 0) return m + ' min ' + String(s).padStart(2, '0') + ' s';
    return s + ' s';
  }

  function statusText(status) {
    switch (status) {
      case 'in_progress':
        return 'In progress';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      case 'abandoned':
        return 'Abandoned';
      default:
        return status || '';
    }
  }

  function isTieBreakGroup(points) {
    const first = points[0];
    if (!first) return false;
    const tennisLabels = new Set(['0', '15', '30', '40', 'AD']);
    if (first.team1_games_before === 6 && first.team2_games_before === 6) return true;
    const p1 = first.team1_points_before;
    const p2 = first.team2_points_before;
    if (!tennisLabels.has(p1) || !tennisLabels.has(p2)) {
      return !Number.isNaN(parseInt(p1, 10)) || !Number.isNaN(parseInt(p2, 10));
    }
    return false;
  }

  function build(session, points) {
    const Eng = global.LiveScoreEngine;
    const active = (points || [])
      .filter((p) => !p.is_undone)
      .slice()
      .sort((a, b) => a.sequence - b.sequence);

    const playerMap = {};
    const slots = Eng.SLOTS;
    slots.forEach((slot) => {
      const ids = slot.startsWith('t1') ? session.team1_player_ids : session.team2_player_ids;
      const names = slot.startsWith('t1') ? session.team1_player_names : session.team2_player_names;
      const idx = Eng.slotIndex(slot);
      const id = ids && ids[idx];
      if (!id) return;
      playerMap[slot] = {
        playerId: String(id).toLowerCase(),
        slot,
        displayName: Eng.nameOnly((names && names[idx]) || 'Player'),
        winners: 0,
        errors: 0,
        serves: 0,
        goldenPointsWon: 0,
        goldenPointsPlayed: 0,
        get net() {
          return this.winners - this.errors;
        }
      };
    });

    let team1Won = 0;
    let team2Won = 0;
    let golden = 0;

    active.forEach((point) => {
      if (point.awarding_team === 1) team1Won += 1;
      else team2Won += 1;
      if (point.is_golden_point) {
        golden += 1;
        if (point.player_slot && playerMap[point.player_slot]) {
          playerMap[point.player_slot].goldenPointsPlayed += 1;
        }
      }
      if (point.server_slot && playerMap[point.server_slot]) {
        playerMap[point.server_slot].serves += 1;
      }
      if (!point.player_slot || !playerMap[point.player_slot]) return;
      const stat = playerMap[point.player_slot];
      if (point.attribution === 'winner') {
        stat.winners += 1;
        if (point.is_golden_point) stat.goldenPointsWon += 1;
      } else if (point.attribution === 'error') {
        stat.errors += 1;
      }
    });

    const groups = [];
    let bucket = [];
    let currentKey = null;
    active.forEach((point) => {
      const key = point.set_index + '-' + point.game_index;
      if (currentKey === null) currentKey = key;
      if (currentKey !== key) {
        const [setIndex, gameIndex] = currentKey.split('-').map(Number);
        groups.push({ setIndex, gameIndex, points: bucket, isTieBreak: isTieBreakGroup(bucket) });
        bucket = [];
        currentKey = key;
      }
      bucket.push(point);
    });
    if (currentKey !== null && bucket.length) {
      const [setIndex, gameIndex] = currentKey.split('-').map(Number);
      groups.push({ setIndex, gameIndex, points: bucket, isTieBreak: isTieBreakGroup(bucket) });
    }

    groups.forEach((g) => {
      g.title = g.isTieBreak
        ? 'Set ' + (g.setIndex + 1) + ' · Tie-break'
        : 'Set ' + (g.setIndex + 1) + ' · Game ' + (g.gameIndex + 1);
      const lastWon = [...g.points].reverse().find((p) => p.won_game);
      g.wonByTeam = lastWon ? lastWon.awarding_team : null;
    });

    const snap = session.score_snapshot || Eng.initialSnapshot(session.number_of_sets, session.match_category);
    const helpers = Eng.snapshotHelpers(snap);
    const setPairs = (snap.team1SetScores || [])
      .map((s1, i) => s1 + '-' + (snap.team2SetScores[i] || 0))
      .join(', ');
    const setScoreLine = setPairs
      ? helpers.team1SetsWon + '–' + helpers.team2SetsWon + '  (' + setPairs + ')'
      : helpers.team1SetsWon + '–' + helpers.team2SetsWon;
    const gamesLine =
      'Current games ' +
      snap.team1Games +
      '–' +
      snap.team2Games +
      (snap.isTieBreak
        ? ' · Tie-break ' + snap.team1Points + '–' + snap.team2Points
        : ' · ' + snap.team1Points + '–' + snap.team2Points);

    let durationMs = 0;
    if (session.ended_at && session.started_at) {
      const raw = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
      durationMs = Math.max(0, raw - (session.accumulated_pause_ms || 0));
    } else if (active.length) {
      durationMs = active[active.length - 1].elapsed_ms || 0;
    }

    return {
      team1Names: (session.team1_player_names || []).map(Eng.nameOnly).join(' & '),
      team2Names: (session.team2_player_names || []).map(Eng.nameOnly).join(' & '),
      setScoreLine,
      gamesLine,
      durationLabel: formatDuration(durationMs),
      totalPoints: active.length,
      team1PointsWon: team1Won,
      team2PointsWon: team2Won,
      players: slots.map((s) => playerMap[s]).filter(Boolean),
      games: groups,
      goldenPointCount: golden,
      statusLabel: statusText(session.status)
    };
  }

  global.LiveScoringAnalytics = { build, formatDuration, statusText };
})(typeof window !== 'undefined' ? window : globalThis);

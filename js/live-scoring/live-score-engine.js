/**
 * Pure tennis/padel point → game → set engine for live scoring analysis.
 * Port of LiveScoreEngine.swift + MatchScoringRules (set/match close).
 * Does not mutate parent match set scores.
 */
(function (global) {
  'use strict';

  const SLOTS = ['t1_0', 't1_1', 't2_0', 't2_1'];

  const POINT_NEXT = { '0': '15', '15': '30', '30': '40', '40': null, AD: null };

  function nameOnly(name) {
    if (!name) return '';
    return String(name)
      .trim()
      .replace(/\s+\(\d+(?:\.\d+)?\)$/, '')
      .trim();
  }

  function normalizeMatchCategory(cat) {
    if (!cat) return 'Regular';
    const key = String(cat).toLowerCase().replace(/[\s_-]/g, '');
    const map = {
      regular: 'Regular',
      clubsession: 'ClubSession',
      boxleague: 'BoxLeague',
      brackettournament: 'BracketTournament'
    };
    return map[key] || cat;
  }

  function slotTeam(slot) {
    return slot && String(slot).startsWith('t1') ? 1 : 2;
  }

  function slotIndex(slot) {
    return slot && String(slot).endsWith('_1') ? 1 : 0;
  }

  function slotPartner(slot) {
    const map = { t1_0: 't1_1', t1_1: 't1_0', t2_0: 't2_1', t2_1: 't2_0' };
    return map[slot] || slot;
  }

  function makeSlot(team, index) {
    if (team === 1 && index === 0) return 't1_0';
    if (team === 1 && index === 1) return 't1_1';
    if (team === 2 && index === 0) return 't2_0';
    if (team === 2 && index === 1) return 't2_1';
    return null;
  }

  function isCompleteSet(team1, team2, isLastSet, matchCategory) {
    if (team1 === 0 && team2 === 0) return false;
    if (team1 < 0 || team2 < 0) return false;
    const maxScore = Math.max(team1, team2);
    const minScore = Math.min(team1, team2);
    if (
      matchCategory === 'BoxLeague' &&
      isLastSet &&
      ((team1 === 1 && team2 === 0) || (team1 === 0 && team2 === 1))
    ) {
      return true;
    }
    if (maxScore === 6 && minScore <= 4) return true;
    if (maxScore === 7 && (minScore === 5 || minScore === 6)) return true;
    if (isLastSet && maxScore >= 8 && minScore === maxScore - 2) return true;
    return false;
  }

  function setsWon(team1Scores, team2Scores, numberOfSets, matchCategory) {
    const pairCount = Math.min(team1Scores.length, team2Scores.length);
    const totalSets = numberOfSets || Math.max(team1Scores.length, team2Scores.length);
    const setsToWin = totalSets === 5 ? 3 : 2;
    let team1Won = 0;
    let team2Won = 0;
    for (let i = 0; i < pairCount; i++) {
      if (team1Won >= setsToWin || team2Won >= setsToWin) break;
      const s1 = team1Scores[i];
      const s2 = team2Scores[i];
      if (s1 === 0 && s2 === 0) continue;
      const isLastSet = i === pairCount - 1;
      if (!isCompleteSet(s1, s2, isLastSet, matchCategory || 'Regular')) continue;
      if (s1 > s2) team1Won += 1;
      else if (s2 > s1) team2Won += 1;
    }
    return { team1: team1Won, team2: team2Won };
  }

  function initialSnapshot(numberOfSets, matchCategory) {
    return {
      team1SetScores: [],
      team2SetScores: [],
      team1Games: 0,
      team2Games: 0,
      team1Points: '0',
      team2Points: '0',
      isTieBreak: false,
      deuceMode: null,
      matchCategory: normalizeMatchCategory(matchCategory),
      numberOfSets: numberOfSets === 5 ? 5 : 3,
      matchDecided: false,
      currentServer: null,
      setFirstServer: null,
      setSecondServer: null,
      tieBreakFirstServer: null,
      tieBreakSecondServer: null
    };
  }

  function cloneSnapshot(s) {
    return JSON.parse(JSON.stringify(s));
  }

  function snapshotHelpers(s) {
    const setsToWin = s.numberOfSets === 5 ? 3 : 2;
    const won = setsWon(s.team1SetScores, s.team2SetScores, s.numberOfSets, s.matchCategory);
    return {
      setsToWin,
      team1SetsWon: won.team1,
      team2SetsWon: won.team2,
      currentSetIndex: s.team1SetScores.length,
      currentGameIndex: s.team1Games + s.team2Games,
      isDeuce: !s.isTieBreak && s.team1Points === '40' && s.team2Points === '40',
      tieBreakPointsPlayed: s.isTieBreak
        ? (parseInt(s.team1Points, 10) || 0) + (parseInt(s.team2Points, 10) || 0)
        : 0
    };
  }

  function pointLabel(team, state) {
    return team === 1 ? state.team1Points : state.team2Points;
  }

  function setPointLabel(label, team, state) {
    if (team === 1) state.team1Points = label;
    else state.team2Points = label;
  }

  function resetPoints(state) {
    state.team1Points = '0';
    state.team2Points = '0';
    state.deuceMode = null;
  }

  function applyRegularPoint(awardingTeam, state, deuceModeOverride) {
    const other = awardingTeam === 1 ? 2 : 1;
    const pAward = pointLabel(awardingTeam, state);
    const pOther = pointLabel(other, state);

    if (pAward === '40' && pOther === '40') {
      const mode = deuceModeOverride || state.deuceMode || 'advantage';
      state.deuceMode = mode;
      if (mode === 'golden') {
        resetPoints(state);
        return { wonGame: true, usedGolden: true };
      }
      setPointLabel('AD', awardingTeam, state);
      return { wonGame: false, usedGolden: false };
    }

    if (pAward === 'AD') {
      resetPoints(state);
      return { wonGame: true, usedGolden: false };
    }

    if (pOther === 'AD') {
      setPointLabel('40', 1, state);
      setPointLabel('40', 2, state);
      state.deuceMode = null;
      return { wonGame: false, usedGolden: false };
    }

    if (pAward === '40') {
      resetPoints(state);
      return { wonGame: true, usedGolden: false };
    }

    const next = POINT_NEXT[pAward];
    if (next) {
      setPointLabel(next, awardingTeam, state);
      if (pointLabel(1, state) === '40' && pointLabel(2, state) === '40') {
        state.deuceMode = null;
      }
      return { wonGame: false, usedGolden: false };
    }

    resetPoints(state);
    return { wonGame: true, usedGolden: false };
  }

  function applyTieBreakPoint(awardingTeam, state) {
    let t1 = parseInt(state.team1Points, 10) || 0;
    let t2 = parseInt(state.team2Points, 10) || 0;
    if (awardingTeam === 1) t1 += 1;
    else t2 += 1;
    state.team1Points = String(t1);
    state.team2Points = String(t2);
    const maxScore = Math.max(t1, t2);
    const minScore = Math.min(t1, t2);
    if (maxScore >= 7 && maxScore - minScore >= 2) {
      resetPoints(state);
      return true;
    }
    return false;
  }

  function tryCloseSet(state) {
    const g1 = state.team1Games;
    const g2 = state.team2Games;
    const helpers = snapshotHelpers(state);
    const setsAlreadyComplete = helpers.team1SetsWon + helpers.team2SetsWon;
    const isLastSet = setsAlreadyComplete >= helpers.setsToWin * 2 - 2;

    const complete = isCompleteSet(g1, g2, isLastSet, state.matchCategory);
    const classicComplete =
      (Math.max(g1, g2) === 6 && Math.min(g1, g2) <= 4) ||
      (Math.max(g1, g2) === 7 && (Math.min(g1, g2) === 5 || Math.min(g1, g2) === 6)) ||
      (isLastSet && Math.max(g1, g2) >= 8 && Math.abs(g1 - g2) === 2);

    if (!complete && !classicComplete) return false;

    state.team1SetScores.push(g1);
    state.team2SetScores.push(g2);
    state.team1Games = 0;
    state.team2Games = 0;
    state.isTieBreak = false;
    resetPoints(state);
    return true;
  }

  function tryCloseMatch(state) {
    const won = setsWon(
      state.team1SetScores,
      state.team2SetScores,
      state.numberOfSets,
      state.matchCategory
    );
    const setsToWin = state.numberOfSets === 5 ? 3 : 2;
    if (won.team1 >= setsToWin || won.team2 >= setsToWin) {
      state.matchDecided = true;
      return true;
    }
    return false;
  }

  function apply(awardingTeam, snapshot, deuceModeOverride) {
    if (awardingTeam !== 1 && awardingTeam !== 2) {
      throw new Error('awardingTeam must be 1 or 2');
    }
    const before = cloneSnapshot(snapshot);
    const state = cloneSnapshot(snapshot);
    let wonGame = false;
    let wonSet = false;
    let wonMatch = false;
    let usedGolden = false;

    if (state.matchDecided) {
      return { before, after: state, wonGame: false, wonSet: false, wonMatch: false, isGoldenPoint: false };
    }

    if (state.isTieBreak) {
      wonGame = applyTieBreakPoint(awardingTeam, state);
    } else {
      const result = applyRegularPoint(awardingTeam, state, deuceModeOverride);
      wonGame = result.wonGame;
      usedGolden = result.usedGolden;
    }

    const wasTieBreak = before.isTieBreak;

    if (wonGame) {
      if (awardingTeam === 1) state.team1Games += 1;
      else state.team2Games += 1;
      state.deuceMode = null;
      wonSet = tryCloseSet(state);
      if (wonSet) {
        wonMatch = tryCloseMatch(state);
      } else {
        state.isTieBreak = state.team1Games === 6 && state.team2Games === 6;
        if (state.isTieBreak) {
          state.team1Points = '0';
          state.team2Points = '0';
        }
      }
    }

    const Serve = global.LiveServeRotation;
    if (Serve) {
      if (wasTieBreak) {
        Serve.advanceAfterTieBreakPoint(state, wonGame);
      } else if (wonGame) {
        if (state.isTieBreak) {
          Serve.seedTieBreakEntry(state);
        } else if (!wonMatch) {
          Serve.advanceAfterRegularGame(state);
        }
      }
    }

    return {
      before,
      after: state,
      wonGame,
      wonSet,
      wonMatch,
      isGoldenPoint: usedGolden
    };
  }

  function needsDeuceModeChoice(snapshot) {
    return snapshotHelpers(snapshot).isDeuce && !snapshot.deuceMode;
  }

  global.LiveScoreEngine = {
    SLOTS,
    nameOnly,
    normalizeMatchCategory,
    slotTeam,
    slotIndex,
    slotPartner,
    makeSlot,
    isCompleteSet,
    setsWon,
    initialSnapshot,
    cloneSnapshot,
    snapshotHelpers,
    apply,
    needsDeuceModeChoice
  };
})(typeof window !== 'undefined' ? window : globalThis);

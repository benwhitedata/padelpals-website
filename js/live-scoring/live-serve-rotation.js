/**
 * Tennis/padel doubles serve rotation for live scoring.
 * Port of LiveServeRotation.swift.
 */
(function (global) {
  'use strict';

  const Engine = () => global.LiveScoreEngine;

  function regularServer(gameIndex, first, second) {
    if (gameIndex <= 0) return first;
    if (gameIndex === 1) return second;
    const Eng = Engine();
    const servingTeamSlot = gameIndex % 2 === 0 ? first : second;
    const serveTurnForTeam = Math.floor(gameIndex / 2);
    const index = (Eng.slotIndex(servingTeamSlot) + serveTurnForTeam) % 2;
    return Eng.makeSlot(Eng.slotTeam(servingTeamSlot), index) || servingTeamSlot;
  }

  function tieBreakServer(pointIndex, first, second) {
    const Eng = Engine();
    const order = [first, second, Eng.slotPartner(first), Eng.slotPartner(second)];
    if (pointIndex <= 0) return order[0];
    const block = Math.floor((pointIndex - 1) / 2);
    const serverIdx = (1 + block) % 4;
    return order[serverIdx];
  }

  function needsServeChoice(snapshot) {
    if (snapshot.matchDecided) return false;
    const helpers = Engine().snapshotHelpers(snapshot);
    if (snapshot.isTieBreak) {
      const played = helpers.tieBreakPointsPlayed;
      if (!snapshot.tieBreakFirstServer) return true;
      if (played >= 1 && !snapshot.tieBreakSecondServer) return true;
      return !snapshot.currentServer;
    }
    return !snapshot.currentServer;
  }

  function chooseServer(slot, snapshot) {
    const Eng = Engine();
    if (snapshot.isTieBreak) {
      const played = Eng.snapshotHelpers(snapshot).tieBreakPointsPlayed;
      if (played === 0) {
        snapshot.tieBreakFirstServer = slot;
        if (
          !snapshot.tieBreakSecondServer ||
          Eng.slotTeam(snapshot.tieBreakSecondServer) === Eng.slotTeam(slot)
        ) {
          const otherTeam = Eng.slotTeam(slot) === 1 ? 2 : 1;
          snapshot.tieBreakSecondServer = Eng.makeSlot(otherTeam, 0);
        }
        snapshot.currentServer = slot;
        return;
      }
      if (played === 1) {
        snapshot.tieBreakSecondServer = slot;
        snapshot.currentServer = slot;
        return;
      }
      snapshot.currentServer = slot;
      return;
    }

    const gameIndex = Eng.snapshotHelpers(snapshot).currentGameIndex;
    snapshot.currentServer = slot;
    if (gameIndex === 0) {
      snapshot.setFirstServer = slot;
      if (
        !snapshot.setSecondServer ||
        Eng.slotTeam(snapshot.setSecondServer) === Eng.slotTeam(slot)
      ) {
        const otherTeam = Eng.slotTeam(slot) === 1 ? 2 : 1;
        snapshot.setSecondServer = Eng.makeSlot(otherTeam, 0);
      }
    } else if (gameIndex === 1) {
      snapshot.setSecondServer = slot;
    }
  }

  function advanceAfterRegularGame(snapshot) {
    if (snapshot.isTieBreak) {
      seedTieBreakEntry(snapshot);
      return;
    }

    const first = snapshot.setFirstServer;
    const second = snapshot.setSecondServer;
    if (!first || !second) {
      snapshot.currentServer = null;
      return;
    }

    if (
      snapshot.team1Games === 0 &&
      snapshot.team2Games === 0 &&
      snapshot.team1SetScores.length > 0
    ) {
      const prevGames =
        (snapshot.team1SetScores[snapshot.team1SetScores.length - 1] || 0) +
        (snapshot.team2SetScores[snapshot.team2SetScores.length - 1] || 0);
      const next = regularServer(prevGames, first, second);
      const nextSecond = regularServer(prevGames + 1, first, second);
      snapshot.setFirstServer = next;
      snapshot.setSecondServer = nextSecond;
      snapshot.currentServer = next;
      return;
    }

    snapshot.currentServer = regularServer(
      Engine().snapshotHelpers(snapshot).currentGameIndex,
      first,
      second
    );
  }

  function seedTieBreakEntry(snapshot) {
    snapshot.tieBreakFirstServer = null;
    snapshot.tieBreakSecondServer = null;
    const first = snapshot.setFirstServer;
    const second = snapshot.setSecondServer;
    if (first && second) {
      const suggested = regularServer(
        Engine().snapshotHelpers(snapshot).currentGameIndex,
        first,
        second
      );
      snapshot.tieBreakFirstServer = suggested;
      const otherTeam = Engine().slotTeam(suggested) === 1 ? 2 : 1;
      snapshot.tieBreakSecondServer = Engine().makeSlot(otherTeam, 0);
      snapshot.currentServer = suggested;
    } else {
      snapshot.currentServer = null;
    }
  }

  function advanceAfterTieBreakPoint(snapshot, wonGame) {
    if (wonGame) {
      snapshot.tieBreakFirstServer = null;
      snapshot.tieBreakSecondServer = null;
      if (!snapshot.isTieBreak) {
        advanceAfterRegularGame(snapshot);
      } else {
        snapshot.currentServer = null;
      }
      return;
    }

    const first = snapshot.tieBreakFirstServer;
    if (!first) {
      snapshot.currentServer = null;
      return;
    }
    const played = Engine().snapshotHelpers(snapshot).tieBreakPointsPlayed;
    if (played >= 1 && !snapshot.tieBreakSecondServer) {
      snapshot.currentServer = null;
      return;
    }
    const second = snapshot.tieBreakSecondServer;
    if (!second) {
      snapshot.currentServer = null;
      return;
    }
    snapshot.currentServer = tieBreakServer(played, first, second);
  }

  function syncCurrentServer(snapshot) {
    if (snapshot.isTieBreak) {
      const first = snapshot.tieBreakFirstServer;
      if (!first) {
        snapshot.currentServer = null;
        return;
      }
      const played = Engine().snapshotHelpers(snapshot).tieBreakPointsPlayed;
      if (played === 0) {
        snapshot.currentServer = first;
        return;
      }
      const second = snapshot.tieBreakSecondServer;
      if (!second) {
        snapshot.currentServer = null;
        return;
      }
      snapshot.currentServer = tieBreakServer(played, first, second);
      return;
    }
    const first = snapshot.setFirstServer;
    if (!first) {
      snapshot.currentServer = null;
      return;
    }
    const second = snapshot.setSecondServer;
    const gameIndex = Engine().snapshotHelpers(snapshot).currentGameIndex;
    if (second) {
      snapshot.currentServer = regularServer(gameIndex, first, second);
    } else if (gameIndex === 0) {
      snapshot.currentServer = first;
    } else {
      snapshot.currentServer = null;
    }
  }

  global.LiveServeRotation = {
    regularServer,
    tieBreakServer,
    needsServeChoice,
    chooseServer,
    advanceAfterRegularGame,
    seedTieBreakEntry,
    advanceAfterTieBreakPoint,
    syncCurrentServer
  };
})(typeof window !== 'undefined' ? window : globalThis);

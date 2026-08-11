/**
 * Live scoring overlay UI — scorer + results (Summary | Match log).
 * Mirrors iOS LiveScoringView / LivePointLogView behaviour.
 */
(function (global) {
  'use strict';

  const SHOTS_SIMPLE = ['serve', 'return', 'groundstroke', 'volley', 'overhead', 'lob'];
  const SHOTS_DETAIL = [
    'serve',
    'return',
    'smash',
    'tap_out',
    'bandeja',
    'vibora',
    'volley',
    'drop_volley',
    'groundstroke',
    'lob',
    'chiquita',
    'bajada'
  ];
  const SHOT_TITLES = {
    serve: 'Serve',
    return: 'Return',
    groundstroke: 'Groundstroke',
    volley: 'Volley',
    drop_volley: 'Drop volley',
    overhead: 'Overhead',
    smash: 'Smash',
    tap_out: 'Tap-out',
    bandeja: 'Bandeja',
    vibora: 'Vibora',
    lob: 'Lob',
    chiquita: 'Chiquita',
    bajada: 'Bajada'
  };
  const SIDE_ALLOWED = new Set([
    'groundstroke',
    'volley',
    'drop_volley',
    'lob',
    'chiquita',
    'bajada',
    'return'
  ]);
  const GLASS_ALLOWED = new Set([
    'groundstroke',
    'lob',
    'chiquita',
    'bajada',
    'volley',
    'drop_volley'
  ]);
  const ERROR_FINISHES = [
    { id: 'net', title: 'Net' },
    { id: 'out', title: 'Out' },
    { id: 'wide', title: 'Wide' },
    { id: 'double_bounce', title: 'Double bounce' }
  ];

  function composeReason(shot, side, offGlass, errorFinish) {
    if (!shot) return errorFinish ? errorFinish.title : '';
    const parts = [];
    if (SIDE_ALLOWED.has(shot) && side) {
      parts.push(side.title + ' ' + SHOT_TITLES[shot].toLowerCase());
    } else {
      parts.push(SHOT_TITLES[shot]);
    }
    if (offGlass && GLASS_ALLOWED.has(shot)) parts.push('Off the glass');
    if (errorFinish) parts.push(errorFinish.title);
    return parts.join(' · ');
  }

  const SHOT_MODE_KEY = 'liveScoring.shotTagMode';

  function loadShotMode() {
    try {
      const raw = localStorage.getItem(SHOT_MODE_KEY);
      return raw === 'detail' ? 'detail' : 'simple';
    } catch (e) {
      return 'simple';
    }
  }

  function saveShotMode(mode) {
    try {
      localStorage.setItem(SHOT_MODE_KEY, mode);
    } catch (e) {
      /* ignore */
    }
  }

  const state = {
    match: null,
    session: null,
    points: [],
    snapshot: null,
    isLoading: false,
    isSaving: false,
    errorMessage: null,
    elapsedMs: 0,
    selectedDeuceMode: null,
    pendingDraft: null,
    isReadOnly: false,
    /** 'completed' | 'abandoned' | null — checkpoint gate */
    finishedRecoveryKind: null,
    timerId: null,
    reasonMode: loadShotMode(),
    reasonShot: null,
    reasonSide: null,
    reasonGlass: false,
    reasonFinish: null,
    reasonNotes: '',
    resultsTab: 'summary',
    overlayMode: 'scorer', // scorer | results
    editingPoint: null,
    servePickerRequired: false,
    reasonPatternTab: 'errors',
    reasonPlayerFilterId: null
  };

  function el(id) {
    return document.getElementById(id);
  }

  function ensureDom() {
    if (el('liveScoringOverlay')) return;
    const root = document.createElement('div');
    root.id = 'liveScoringOverlay';
    root.className = 'ls-overlay';
    root.hidden = true;
    root.innerHTML = `
      <div class="ls-shell" role="dialog" aria-modal="true" aria-labelledby="lsTitle">
        <header class="ls-header">
          <button type="button" class="ls-btn-text" id="lsCloseBtn">Close</button>
          <h2 id="lsTitle">Live scoring</h2>
          <button type="button" class="ls-btn-text" id="lsMenuBtn" aria-label="Menu">Menu</button>
        </header>
        <div class="ls-body" id="lsBody"></div>
        <div class="ls-menu" id="lsMenu" hidden>
          <button type="button" data-action="results">Live results</button>
          <button type="button" data-action="adjust-clock">Adjust clock</button>
          <button type="button" data-action="undo">Undo last point</button>
          <button type="button" data-action="end">End session</button>
          <button type="button" data-action="abandon" class="ls-danger">Abandon session</button>
        </div>
        <div class="ls-sheet" id="lsSheet" hidden></div>
        <div class="ls-toast" id="lsToast" hidden></div>
      </div>
    `;
    document.body.appendChild(root);

    el('lsCloseBtn').addEventListener('click', onClose);
    el('lsMenuBtn').addEventListener('click', () => {
      const menu = el('lsMenu');
      menu.hidden = !menu.hidden;
    });
    el('lsMenu').addEventListener('click', onMenuAction);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') pauseIfRunning();
    });
    window.addEventListener('pagehide', () => {
      pauseIfRunning();
    });
  }

  function showToast(msg) {
    const t = el('lsToast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      t.hidden = true;
    }, 3200);
  }

  function formatElapsed(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function recomputeElapsed() {
    if (!state.session) {
      state.elapsedMs = 0;
      return;
    }
    state.elapsedMs = global.MatchLiveScoringService.elapsedMsFor(state.session);
  }

  function minimumAdjustableElapsedMs() {
    const last = [...state.points].reverse().find((p) => !p.is_undone) || state.points[state.points.length - 1];
    return last ? last.elapsed_ms || 0 : 0;
  }

  function startTimer() {
    stopTimer();
    state.timerId = setInterval(() => {
      recomputeElapsed();
      const clock = el('lsClock');
      if (clock) clock.textContent = formatElapsed(state.elapsedMs);
    }, 250);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function isPaused() {
    return state.session?.status === 'paused';
  }

  function isActive() {
    const s = state.session?.status;
    return s === 'in_progress' || s === 'paused';
  }

  function isFinishedRecovery() {
    return state.finishedRecoveryKind === 'abandoned' || state.finishedRecoveryKind === 'completed';
  }

  function needsDeuceChoice() {
    return (
      global.LiveScoreEngine.needsDeuceModeChoice(state.snapshot) &&
      !state.selectedDeuceMode &&
      !(state.session && state.session.golden_point_at_deuce)
    );
  }

  function needsServeChoice() {
    return global.LiveServeRotation.needsServeChoice(state.snapshot);
  }

  function canAwardPoint() {
    return (
      isActive() &&
      !isPaused() &&
      !state.isReadOnly &&
      !needsServeChoice() &&
      !needsDeuceChoice() &&
      !state.isSaving
    );
  }

  function isScoringFrozen() {
    return isPaused() || !isActive() || state.isReadOnly;
  }

  function effectiveDeuceMode() {
    if (state.selectedDeuceMode) return state.selectedDeuceMode;
    if (state.session?.golden_point_at_deuce) return 'golden';
    return state.snapshot?.deuceMode || null;
  }

  function displayName(slot) {
    const Eng = global.LiveScoreEngine;
    const names =
      Eng.slotTeam(slot) === 1
        ? state.session?.team1_player_names || state.match?.team1?.players
        : state.session?.team2_player_names || state.match?.team2?.players;
    const idx = Eng.slotIndex(slot);
    return Eng.nameOnly((names && names[idx]) || 'Player ' + (Eng.slotTeam(slot) === 1 ? idx + 1 : idx + 3));
  }

  function playerIdFor(slot) {
    const Eng = global.LiveScoreEngine;
    const ids =
      Eng.slotTeam(slot) === 1
        ? state.session?.team1_player_ids
        : state.session?.team2_player_ids;
    return ids && ids[Eng.slotIndex(slot)];
  }

  function setScoreLine() {
    const s = state.snapshot;
    const h = global.LiveScoreEngine.snapshotHelpers(s);
    const pairs = (s.team1SetScores || [])
      .map((a, i) => a + '–' + (s.team2SetScores[i] || 0))
      .join('  ');
    return {
      sets: h.team1SetsWon + ' – ' + h.team2SetsWon,
      games: s.team1Games + ' – ' + s.team2Games,
      points: s.team1Points + ' – ' + s.team2Points,
      pairs,
      isTB: s.isTieBreak
    };
  }

  function hideSheet() {
    const sheet = el('lsSheet');
    if (sheet) {
      sheet.hidden = true;
      sheet.innerHTML = '';
    }
  }

  function showSheet(html) {
    const sheet = el('lsSheet');
    sheet.innerHTML = html;
    sheet.hidden = false;
  }

  function render() {
    ensureDom();
    const body = el('lsBody');
    const menuBtn = el('lsMenuBtn');
    const title = el('lsTitle');

    if (state.overlayMode === 'results') {
      title.textContent = 'Live results';
      menuBtn.hidden = true;
      body.innerHTML = renderResults();
      bindResults();
      return;
    }

    title.textContent = 'Live scoring';
    menuBtn.hidden = state.isReadOnly && !isFinishedRecovery();

    if (state.isLoading && !state.session) {
      body.innerHTML = `<div class="ls-loading"><div class="spinner-border text-light" role="status"></div><p>Starting live scoring…</p></div>`;
      return;
    }

    if (state.isReadOnly && isFinishedRecovery()) {
      body.innerHTML = renderFinishedGate();
      bindGate();
      return;
    }

    body.innerHTML = renderScorer();
    bindScorer();
  }

  function renderFinishedGate() {
    const kind = state.finishedRecoveryKind;
    const title = kind === 'abandoned' ? 'Session abandoned' : 'Live scoring checkpoint';
    const blurb =
      kind === 'abandoned'
        ? 'Points already logged stay available. You can continue this session later or delete it.'
        : 'A completed live scoring session exists for this match. Resume from the checkpoint, view results, or delete and start again.';
    const resumeLabel = kind === 'abandoned' ? 'Continue session' : 'Resume session';
    return `
      <div class="ls-gate">
        <h3>${title}</h3>
        <p>${blurb}</p>
        ${state.errorMessage ? `<p class="ls-error">${escapeHtml(state.errorMessage)}</p>` : ''}
        <div class="ls-gate-actions">
          <button type="button" class="ls-btn ls-btn-primary" id="lsContinueFinished">${resumeLabel}</button>
          <button type="button" class="ls-btn" id="lsViewResultsGate">View results</button>
          <button type="button" class="ls-btn ls-btn-danger" id="lsDeleteFinished">Delete session</button>
          <button type="button" class="ls-btn" id="lsGateClose">Close</button>
        </div>
      </div>`;
  }

  function renderScorer() {
    const score = setScoreLine();
    const frozen = isScoringFrozen();
    const server = state.snapshot?.currentServer;
    const t1 = (state.session?.team1_player_names || state.match.team1.players || [])
      .map(global.LiveScoreEngine.nameOnly)
      .join(' & ');
    const t2 = (state.session?.team2_player_names || state.match.team2.players || [])
      .map(global.LiveScoreEngine.nameOnly)
      .join(' & ');

    return `
      ${state.errorMessage ? `<div class="ls-error-banner">${escapeHtml(state.errorMessage)}</div>` : ''}
      <div class="ls-clock-row">
        <button type="button" class="ls-clock ls-clock-btn" id="lsClock" title="Adjust clock" ${
          isActive() && !state.isReadOnly ? '' : 'disabled'
        }>${formatElapsed(state.elapsedMs)}</button>
        ${
          isActive() && !state.isReadOnly
            ? isPaused()
              ? `<button type="button" class="ls-btn ls-btn-primary" id="lsResumeBtn">Resume</button>`
              : `<button type="button" class="ls-btn" id="lsPauseBtn">Pause</button>`
            : ''
        }
      </div>
      ${isPaused() ? `<div class="ls-pause-banner">Paused — scoring frozen</div>` : ''}
      <div class="ls-scoreboard">
        <div class="ls-teams">
          <div class="ls-team"><span class="ls-team-label">${escapeHtml(t1)}</span></div>
          <div class="ls-team ls-team-right"><span class="ls-team-label">${escapeHtml(t2)}</span></div>
        </div>
        <div class="ls-score-grid">
          <div class="ls-score-cell"><span class="ls-score-label">Sets</span><strong>${score.sets}</strong></div>
          <div class="ls-score-cell"><span class="ls-score-label">Games</span><strong>${score.games}</strong></div>
          <div class="ls-score-cell"><span class="ls-score-label">${score.isTB ? 'TB' : 'Points'}</span><strong>${score.points}</strong></div>
        </div>
        ${score.pairs ? `<div class="ls-set-pairs">${escapeHtml(score.pairs)}</div>` : ''}
      </div>
      <div class="ls-serve-row">
        <span class="ls-serve-chip">${server ? 'Serving: ' + escapeHtml(displayName(server)) : 'Serve not set'}</span>
        ${
          !state.isReadOnly && isActive()
            ? `<button type="button" class="ls-btn-text" id="lsChangeServe"${frozen && !needsServeChoice() ? ' disabled' : ''}>Change</button>`
            : ''
        }
      </div>
      ${
        needsDeuceChoice()
          ? `<div class="ls-deuce-banner">
              <p>40–40 — choose how to finish the game</p>
              <button type="button" class="ls-btn ls-btn-primary" data-deuce="golden">Golden point</button>
              <button type="button" class="ls-btn" data-deuce="advantage">Advantage</button>
            </div>`
          : ''
      }
      ${
        needsServeChoice() && !state.isReadOnly
          ? `<div class="ls-deuce-banner"><p>${servePromptTitle()}</p><button type="button" class="ls-btn ls-btn-primary" id="lsPickServe">Choose server</button></div>`
          : ''
      }
      <div class="ls-players ${frozen ? 'ls-frozen' : ''}">
        ${renderPlayerRows(frozen)}
      </div>
      <div class="ls-skip-row">
        <button type="button" class="ls-btn ls-btn-wide" id="lsSkipBtn" ${canAwardPoint() ? '' : 'disabled'}>Skip — award to a pair</button>
      </div>
      ${state.isSaving ? `<div class="ls-saving">Saving…</div>` : ''}
    `;
  }

  function servePromptTitle() {
    const s = state.snapshot;
    if (s.isTieBreak) {
      const played = global.LiveScoreEngine.snapshotHelpers(s).tieBreakPointsPlayed;
      if (!s.tieBreakFirstServer || played === 0) return 'Who serves the first tie-break point?';
      if (!s.tieBreakSecondServer || played === 1) return 'Who serves the next two tie-break points?';
      return 'Change tie-break server';
    }
    return 'Who serves this game?';
  }

  function renderPlayerRows(frozen) {
    return global.LiveScoreEngine.SLOTS.map((slot) => {
      const team = global.LiveScoreEngine.slotTeam(slot);
      return `
        <div class="ls-player-row" data-team="${team}">
          <span class="ls-player-name">${escapeHtml(displayName(slot))}</span>
          <div class="ls-player-actions">
            <button type="button" class="ls-btn ls-btn-winner" data-winner="${slot}" ${canAwardPoint() ? '' : 'disabled'}>Winner</button>
            <button type="button" class="ls-btn ls-btn-error" data-error="${slot}" ${canAwardPoint() ? '' : 'disabled'}>Error</button>
          </div>
        </div>`;
    }).join('');
  }

  function bindGate() {
    el('lsViewResultsGate')?.addEventListener('click', () => openResults());
    el('lsGateClose')?.addEventListener('click', () => closeOverlay());
    el('lsContinueFinished')?.addEventListener('click', async () => {
      await continueFinished();
    });
    el('lsDeleteFinished')?.addEventListener('click', () => {
      if (
        !confirm(
          'Delete this live scoring session? All logged points will be removed. This cannot be undone.'
        )
      ) {
        return;
      }
      deleteFinishedAndRestart();
    });
  }

  function bindScorer() {
    el('lsPauseBtn')?.addEventListener('click', () => pause());
    el('lsResumeBtn')?.addEventListener('click', () => resume());
    el('lsClock')?.addEventListener('click', () => {
      if (isActive() && !state.isReadOnly) openAdjustClock();
    });
    el('lsChangeServe')?.addEventListener('click', () => openServePicker());
    el('lsPickServe')?.addEventListener('click', () => openServePicker());
    el('lsSkipBtn')?.addEventListener('click', () => openSkipSheet());

    document.querySelectorAll('[data-deuce]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedDeuceMode = btn.getAttribute('data-deuce');
        state.snapshot.deuceMode = state.selectedDeuceMode;
        render();
      });
    });

    document.querySelectorAll('[data-winner]').forEach((btn) => {
      btn.addEventListener('click', () => beginWinner(btn.getAttribute('data-winner')));
    });
    document.querySelectorAll('[data-error]').forEach((btn) => {
      btn.addEventListener('click', () => beginError(btn.getAttribute('data-error')));
    });
  }

  function onMenuAction(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    el('lsMenu').hidden = true;
    const action = btn.getAttribute('data-action');
    if (action === 'results') openResults();
    else if (action === 'adjust-clock') openAdjustClock();
    else if (action === 'undo') undoLast();
    else if (action === 'end') confirmEnd(false);
    else if (action === 'abandon') confirmEnd(true);
  }

  async function onClose() {
    await pauseIfRunning();
    if (state.overlayMode === 'results' && state.match) {
      state.overlayMode = 'scorer';
      render();
      return;
    }
    closeOverlay();
  }

  function closeOverlay() {
    stopTimer();
    hideSheet();
    const overlay = el('liveScoringOverlay');
    if (overlay) overlay.hidden = true;
    document.body.classList.remove('ls-open');
    state.match = null;
    state.session = null;
    state.points = [];
  }

  async function pauseIfRunning() {
    if (state.session?.status === 'in_progress' && !state.isReadOnly) {
      await pause(true);
    }
  }

  async function pause(silent) {
    if (!state.session || state.session.status !== 'in_progress') return;
    state.pendingDraft = null;
    hideSheet();
    state.isSaving = true;
    try {
      state.session = await global.MatchLiveScoringService.pause(state.session);
      stopTimer();
      recomputeElapsed();
    } catch (e) {
      stopTimer();
      state.session = { ...state.session, status: 'paused', paused_at: new Date().toISOString() };
      recomputeElapsed();
      if (!silent) state.errorMessage = e.message;
    } finally {
      state.isSaving = false;
      render();
    }
  }

  async function resume() {
    if (!state.session || state.session.status !== 'paused') return;
    state.isSaving = true;
    try {
      state.session = await global.MatchLiveScoringService.resume(state.session);
      recomputeElapsed();
      startTimer();
      state.errorMessage = null;
    } catch (e) {
      state.errorMessage = e.message;
    } finally {
      state.isSaving = false;
      render();
    }
  }

  function openServePicker() {
    const slots = global.LiveScoreEngine.SLOTS;
    showSheet(`
      <div class="ls-sheet-inner">
        <h3>${escapeHtml(servePromptTitle())}</h3>
        <div class="ls-serve-grid">
          ${slots
            .map(
              (slot) =>
                `<button type="button" class="ls-btn ls-btn-wide" data-pick-serve="${slot}">${escapeHtml(displayName(slot))}</button>`
            )
            .join('')}
        </div>
        <button type="button" class="ls-btn" id="lsSheetCancel">Cancel</button>
      </div>`);
    el('lsSheetCancel').addEventListener('click', () => {
      hideSheet();
      const noServer = !state.snapshot?.currentServer && !state.snapshot?.setFirstServer;
      if ((!state.points || state.points.length === 0) && noServer) {
        closeOverlay();
        return;
      }
      render();
    });
    document.querySelectorAll('[data-pick-serve]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const slot = btn.getAttribute('data-pick-serve');
        global.LiveServeRotation.chooseServer(slot, state.snapshot);
        hideSheet();
        try {
          await global.MatchLiveScoringService.updateSnapshot(state.snapshot, state.session.id);
        } catch (e) {
          state.errorMessage = e.message;
        }
        render();
      });
    });
  }

  function openAdjustClock() {
    if (!isActive() || state.isReadOnly) return;
    const minMs = minimumAdjustableElapsedMs();
    const current = Math.max(state.elapsedMs, minMs);
    const totalSec = Math.floor(current / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    showSheet(`
      <div class="ls-sheet-inner">
        <h3>Adjust clock</h3>
        <p class="ls-muted">Set the session clock. It can’t be earlier than the last saved point (${formatElapsed(minMs)}).</p>
        <div class="ls-clock-adjust">
          <label>Minutes <input type="number" id="lsAdjMin" min="0" max="599" value="${mins}"></label>
          <label>Seconds <input type="number" id="lsAdjSec" min="0" max="59" value="${secs}"></label>
        </div>
        <p class="ls-error" id="lsAdjError" hidden></p>
        <div class="ls-reason-actions">
          <button type="button" class="ls-btn" id="lsSheetCancel">Cancel</button>
          <button type="button" class="ls-btn ls-btn-primary" id="lsAdjSave">Set clock</button>
        </div>
      </div>`);
    el('lsSheetCancel').addEventListener('click', hideSheet);
    el('lsAdjSave').addEventListener('click', async () => {
      const m = parseInt(el('lsAdjMin').value, 10) || 0;
      const s = parseInt(el('lsAdjSec').value, 10) || 0;
      const proposed = (m * 60 + s) * 1000;
      const err = el('lsAdjError');
      if (proposed < minMs) {
        err.hidden = false;
        err.textContent = 'Choose a time at or after ' + formatElapsed(minMs) + '.';
        return;
      }
      state.isSaving = true;
      try {
        state.session = await global.MatchLiveScoringService.setElapsedMs(
          proposed,
          state.session,
          minMs
        );
        recomputeElapsed();
        hideSheet();
        state.errorMessage = null;
      } catch (e) {
        err.hidden = false;
        err.textContent = e.message;
      } finally {
        state.isSaving = false;
        render();
      }
    });
  }

  function openSkipSheet() {
    showSheet(`
      <div class="ls-sheet-inner">
        <h3>Award point to a pair</h3>
        <button type="button" class="ls-btn ls-btn-wide" data-team-award="1">${escapeHtml(
          (state.session?.team1_player_names || []).map(global.LiveScoreEngine.nameOnly).join(' & ')
        )}</button>
        <button type="button" class="ls-btn ls-btn-wide" data-team-award="2">${escapeHtml(
          (state.session?.team2_player_names || []).map(global.LiveScoreEngine.nameOnly).join(' & ')
        )}</button>
        <button type="button" class="ls-btn" id="lsSheetCancel">Cancel</button>
      </div>`);
    el('lsSheetCancel').addEventListener('click', hideSheet);
    document.querySelectorAll('[data-team-award]').forEach((btn) => {
      btn.addEventListener('click', () => {
        beginTeamAward(Number(btn.getAttribute('data-team-award')));
      });
    });
  }

  function beginWinner(slot) {
    if (!canAwardPoint()) return;
    const playerId = playerIdFor(slot);
    if (!playerId) return;
    state.pendingDraft = {
      awardingTeam: global.LiveScoreEngine.slotTeam(slot),
      attribution: 'winner',
      playerId,
      playerSlot: slot,
      serverSlot: state.snapshot.currentServer,
      isGoldenPoint:
        effectiveDeuceMode() === 'golden' &&
        global.LiveScoreEngine.snapshotHelpers(state.snapshot).isDeuce,
      reason: ''
    };
    openReasonSheet();
  }

  function beginError(slot) {
    if (!canAwardPoint()) return;
    const playerId = playerIdFor(slot);
    if (!playerId) return;
    const team = global.LiveScoreEngine.slotTeam(slot);
    state.pendingDraft = {
      awardingTeam: team === 1 ? 2 : 1,
      attribution: 'error',
      playerId,
      playerSlot: slot,
      serverSlot: state.snapshot.currentServer,
      isGoldenPoint:
        effectiveDeuceMode() === 'golden' &&
        global.LiveScoreEngine.snapshotHelpers(state.snapshot).isDeuce,
      reason: ''
    };
    openReasonSheet();
  }

  function beginTeamAward(team) {
    if (!canAwardPoint()) return;
    state.pendingDraft = {
      awardingTeam: team,
      attribution: 'team_award',
      playerId: null,
      playerSlot: null,
      serverSlot: state.snapshot.currentServer,
      isGoldenPoint:
        effectiveDeuceMode() === 'golden' &&
        global.LiveScoreEngine.snapshotHelpers(state.snapshot).isDeuce,
      reason: ''
    };
    openReasonSheet();
  }

  function openReasonSheet() {
    state.reasonMode = loadShotMode();
    state.reasonShot = null;
    state.reasonSide = null;
    state.reasonGlass = false;
    state.reasonFinish = null;
    state.reasonNotes = '';
    state.editingPoint = null;
    renderReasonSheet();
  }

  function renderReasonSheet() {
    const isError = state.pendingDraft?.attribution === 'error';
    const shots = state.reasonMode === 'simple' ? SHOTS_SIMPLE : SHOTS_DETAIL;
    const showSide = state.reasonShot && SIDE_ALLOWED.has(state.reasonShot);
    const showGlass = state.reasonShot && GLASS_ALLOWED.has(state.reasonShot);
    const detailClass = state.reasonMode === 'detail' ? ' ls-sheet-detail' : '';

    showSheet(`
      <div class="ls-sheet-inner ls-reason-sheet${detailClass}">
        <h3>${isError ? 'Error details' : 'Winner details'} <span class="ls-optional">(optional)</span></h3>
        <div class="ls-seg">
          <button type="button" class="ls-seg-btn ${state.reasonMode === 'simple' ? 'active' : ''}" data-mode="simple">Simple</button>
          <button type="button" class="ls-seg-btn ${state.reasonMode === 'detail' ? 'active' : ''}" data-mode="detail">Detail</button>
        </div>
        <div class="ls-shot-grid ${state.reasonMode === 'detail' ? 'ls-shot-grid-detail' : ''}">
          ${shots
            .map(
              (s) =>
                `<button type="button" class="ls-shot ${state.reasonShot === s ? 'active' : ''}" data-shot="${s}">${SHOT_TITLES[s]}</button>`
            )
            .join('')}
        </div>
        ${
          showSide
            ? `<div class="ls-seg">
                <button type="button" class="ls-seg-btn ${state.reasonSide === 'forehand' ? 'active' : ''}" data-side="forehand">Forehand</button>
                <button type="button" class="ls-seg-btn ${state.reasonSide === 'backhand' ? 'active' : ''}" data-side="backhand">Backhand</button>
              </div>`
            : ''
        }
        ${
          showGlass
            ? `<label class="ls-toggle"><input type="checkbox" id="lsGlass" ${state.reasonGlass ? 'checked' : ''}> Off the glass</label>`
            : ''
        }
        ${
          isError
            ? `<div class="ls-finish-chips">
                ${ERROR_FINISHES.map(
                  (f) =>
                    `<button type="button" class="ls-chip ${state.reasonFinish === f.id ? 'active' : ''}" data-finish="${f.id}">${f.title}</button>`
                ).join('')}
              </div>`
            : ''
        }
        <label class="ls-notes-label">Notes</label>
        <textarea id="lsReasonNotes" rows="2" placeholder="Optional notes">${escapeHtml(state.reasonNotes)}</textarea>
        <div class="ls-reason-actions">
          <button type="button" class="ls-btn" id="lsReasonCancel">Cancel</button>
          <button type="button" class="ls-btn ls-btn-primary" id="lsSavePoint">Save point</button>
        </div>
      </div>`);

    const syncNotesFromComposer = () => {
      const finish = ERROR_FINISHES.find((f) => f.id === state.reasonFinish) || null;
      const side = state.reasonSide
        ? { title: state.reasonSide === 'forehand' ? 'Forehand' : 'Backhand' }
        : null;
      const composed = composeReason(state.reasonShot, side, state.reasonGlass, finish);
      state.reasonNotes = composed;
      const ta = el('lsReasonNotes');
      if (ta) ta.value = composed;
    };

    document.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.reasonMode = btn.getAttribute('data-mode');
        saveShotMode(state.reasonMode);
        state.reasonShot = null;
        renderReasonSheet();
      });
    });
    document.querySelectorAll('[data-shot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.reasonShot = btn.getAttribute('data-shot');
        if (!SIDE_ALLOWED.has(state.reasonShot)) state.reasonSide = null;
        if (!GLASS_ALLOWED.has(state.reasonShot)) state.reasonGlass = false;
        syncNotesFromComposer();
        renderReasonSheet();
      });
    });
    document.querySelectorAll('[data-side]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.reasonSide = btn.getAttribute('data-side');
        syncNotesFromComposer();
        renderReasonSheet();
      });
    });
    document.querySelectorAll('[data-finish]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-finish');
        state.reasonFinish = state.reasonFinish === id ? null : id;
        syncNotesFromComposer();
        renderReasonSheet();
      });
    });
    el('lsGlass')?.addEventListener('change', (e) => {
      state.reasonGlass = e.target.checked;
      syncNotesFromComposer();
    });
    el('lsReasonNotes')?.addEventListener('input', (e) => {
      state.reasonNotes = e.target.value;
    });
    el('lsReasonCancel').addEventListener('click', () => {
      state.pendingDraft = null;
      hideSheet();
    });
    el('lsSavePoint').addEventListener('click', () => confirmPendingPoint());
  }

  async function confirmPendingPoint() {
    if (!state.pendingDraft || !state.session) return;
    state.isSaving = true;
    render();
    const draft = { ...state.pendingDraft };
    draft.reason = (el('lsReasonNotes')?.value || state.reasonNotes || '').trim();

    const helpers = global.LiveScoreEngine.snapshotHelpers(state.snapshot);
    const deuceOverride = helpers.isDeuce ? effectiveDeuceMode() || 'advantage' : null;
    const outcome = global.LiveScoreEngine.apply(
      draft.awardingTeam,
      state.snapshot,
      deuceOverride
    );
    draft.isGoldenPoint = outcome.isGoldenPoint;

    try {
      recomputeElapsed();
      const result = await global.MatchLiveScoringService.appendPoint(
        state.session,
        draft,
        outcome,
        state.elapsedMs
      );
      state.session = result.session;
      state.snapshot = outcome.after;
      state.points.push(result.point);
      state.pendingDraft = null;
      hideSheet();
      if (!outcome.after.isDeuce) state.selectedDeuceMode = null;
      state.errorMessage = null;
      if (needsServeChoice()) openServePicker();
      if (outcome.wonMatch) {
        showToast('Match decided — you can end the session when ready.');
      }
    } catch (e) {
      state.errorMessage = e.message;
    } finally {
      state.isSaving = false;
      render();
    }
  }

  async function undoLast() {
    if (!state.session || state.isReadOnly) return;
    state.isSaving = true;
    try {
      const result = await global.MatchLiveScoringService.undoLastPoint(state.session);
      state.session = result.session;
      state.snapshot = result.session.score_snapshot;
      global.LiveServeRotation.syncCurrentServer(state.snapshot);
      state.points = result.points;
      state.selectedDeuceMode = state.snapshot.deuceMode || null;
      state.errorMessage = null;
      if (needsServeChoice()) openServePicker();
    } catch (e) {
      state.errorMessage = e.message;
    } finally {
      state.isSaving = false;
      render();
    }
  }

  function confirmEnd(abandon) {
    const msg = abandon
      ? 'Points already logged stay available. You can continue this session later or delete it.'
      : 'The point log is saved. This does not change the match result score.';
    if (!confirm(msg)) return;
    endSession(abandon);
  }

  async function endSession(abandon) {
    if (!state.session) return;
    state.isSaving = true;
    stopTimer();
    try {
      if (abandon) {
        state.session = await global.MatchLiveScoringService.abandon(
          state.session,
          state.snapshot
        );
      } else {
        state.session = await global.MatchLiveScoringService.complete(
          state.session,
          state.snapshot
        );
      }
      openResults();
    } catch (e) {
      state.errorMessage = e.message;
      render();
    } finally {
      state.isSaving = false;
    }
  }

  async function continueFinished() {
    if (
      !state.session ||
      (state.session.status !== 'abandoned' && state.session.status !== 'completed')
    ) {
      return;
    }
    state.isSaving = true;
    try {
      state.session = await global.MatchLiveScoringService.continueFinishedSession(
        state.session
      );
      state.isReadOnly = false;
      state.finishedRecoveryKind = null;
      state.snapshot = state.session.score_snapshot;
      global.LiveServeRotation.syncCurrentServer(state.snapshot);
      state.points = await global.MatchLiveScoringService.fetchPoints(state.session.id);
      recomputeElapsed();
      stopTimer();
      state.errorMessage = null;
      if (needsServeChoice()) openServePicker();
    } catch (e) {
      state.errorMessage = e.message;
    } finally {
      state.isSaving = false;
      render();
    }
  }

  async function deleteFinishedAndRestart() {
    if (
      !state.session ||
      (state.session.status !== 'abandoned' && state.session.status !== 'completed')
    ) {
      return;
    }
    state.isSaving = true;
    try {
      await global.MatchLiveScoringService.deleteSession(state.session);
      state.isReadOnly = false;
      state.finishedRecoveryKind = null;
      state.session = null;
      state.points = [];
      state.snapshot = global.LiveScoreEngine.initialSnapshot(
        state.match.numberOfSets === 5 ? 5 : 3,
        state.match.matchCategory
      );
      const created = await global.MatchLiveScoringService.startSession(state.match);
      state.session = created;
      state.snapshot = created.score_snapshot;
      state.points = [];
      recomputeElapsed();
      startTimer();
      state.errorMessage = null;
      render();
      openServePicker();
    } catch (e) {
      state.errorMessage = e.message;
      render();
    } finally {
      state.isSaving = false;
    }
  }

  function openResults() {
    state.overlayMode = 'results';
    state.resultsTab = 'summary';
    hideSheet();
    el('lsMenu').hidden = true;
    render();
  }

  function renderResults() {
    const summary = global.LiveScoringAnalytics.build(state.session, state.points);
    return `
      <div class="ls-results">
        <button type="button" class="ls-btn-text ls-back" id="lsResultsBack">← Back</button>
        <div class="ls-seg">
          <button type="button" class="ls-seg-btn ${state.resultsTab === 'summary' ? 'active' : ''}" data-rtab="summary">Summary</button>
          <button type="button" class="ls-seg-btn ${state.resultsTab === 'log' ? 'active' : ''}" data-rtab="log">Match log</button>
        </div>
        ${
          state.resultsTab === 'summary'
            ? renderSummary(summary)
            : renderMatchLog(summary)
        }
      </div>`;
  }

  function renderSummary(summary) {
    const ranks = global.LiveScoringAnalytics.reasonRanks(
      state.points,
      state.reasonPlayerFilterId
    );
    const isErrors = state.reasonPatternTab !== 'winners';
    const rows = isErrors ? ranks.topErrorReasons : ranks.topWinnerReasons;
    const total = isErrors ? ranks.totalTaggedErrors : ranks.totalTaggedWinners;
    const maxCount = rows.reduce(
      (max, s) => Math.max(max, isErrors ? s.errors : s.winners),
      0
    );
    const emptyCopy = isErrors ? 'No error notes yet' : 'No winner notes yet';
    const barClass = isErrors ? 'ls-reason-bar-error' : 'ls-reason-bar-winner';

    return `
      <div class="ls-summary">
        <div class="ls-summary-head">
          <div>${escapeHtml(summary.team1Names)}</div>
          <div class="ls-summary-score">${escapeHtml(summary.setScoreLine)}</div>
          <div>${escapeHtml(summary.team2Names)}</div>
        </div>
        <p class="ls-muted">${escapeHtml(summary.statusLabel)} · ${escapeHtml(summary.durationLabel)}</p>
        <p>Points won: ${summary.team1PointsWon} – ${summary.team2PointsWon} (${summary.totalPoints} total)${
          summary.goldenPointCount ? ' · ' + summary.goldenPointCount + ' golden' : ''
        }</p>
        <h4 class="ls-section-title">Player breakdown</h4>
        <div class="ls-player-stats">
          ${summary.players
            .map(
              (p) => `
            <div class="ls-stat-row">
              <strong>${escapeHtml(p.displayName)}</strong>
              <span>W ${p.winners}</span>
              <span>E ${p.errors}</span>
              <span>Net ${p.winners - p.errors}</span>
              <span>Srv ${p.serves}</span>
              ${p.goldenPointsWon ? `<span>GP ${p.goldenPointsWon}</span>` : ''}
            </div>`
            )
            .join('')}
        </div>
        <div class="ls-reason-patterns">
          <h4 class="ls-section-title">Reason patterns</h4>
          <p class="ls-muted ls-reason-caption">Based on notes tagged when each point was saved.</p>
          <label class="ls-reason-player">
            <span>Player</span>
            <select id="lsReasonPlayer">
              <option value="" ${!state.reasonPlayerFilterId ? 'selected' : ''}>All players</option>
              ${summary.players
                .map(
                  (p) =>
                    `<option value="${escapeHtml(p.playerId)}" ${
                      state.reasonPlayerFilterId === p.playerId ? 'selected' : ''
                    }>${escapeHtml(p.displayName)}</option>`
                )
                .join('')}
            </select>
          </label>
          <div class="ls-seg">
            <button type="button" class="ls-seg-btn ${isErrors ? 'active' : ''}" data-reason-tab="errors">Errors</button>
            <button type="button" class="ls-seg-btn ${!isErrors ? 'active' : ''}" data-reason-tab="winners">Winners</button>
          </div>
          ${
            rows.length === 0
              ? `<p class="ls-muted ls-reason-empty">${emptyCopy}</p>`
              : `<div class="ls-reason-list">
                  ${rows
                    .map((stat, index) => {
                      const count = isErrors ? stat.errors : stat.winners;
                      const width = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                      return `<div class="ls-reason-row">
                        <div class="ls-reason-meta">
                          <span class="ls-reason-rank">${index + 1}</span>
                          <span class="ls-reason-label">${escapeHtml(stat.label)}</span>
                          <span class="ls-reason-count ${isErrors ? 'is-error' : 'is-winner'}">${count}</span>
                        </div>
                        <div class="ls-reason-track"><div class="ls-reason-bar ${barClass}" style="width:${width}%"></div></div>
                      </div>`;
                    })
                    .join('')}
                </div>`
          }
        </div>
      </div>`;
  }

  function renderMatchLog(summary) {
    if (!summary.games.length) {
      return `<p class="ls-muted">No points logged yet.</p>`;
    }
    return `
      <div class="ls-log">
        ${summary.games
          .map(
            (g) => `
          <div class="ls-log-group">
            <h4>${escapeHtml(g.title)}${g.wonByTeam ? ' · Pair ' + g.wonByTeam : ''}</h4>
            ${g.points
              .map((p) => {
                const attrClass =
                  p.attribution === 'winner'
                    ? 'ls-attr-winner'
                    : p.attribution === 'error'
                      ? 'ls-attr-error'
                      : 'ls-attr-team';
                const who = p.player_slot
                  ? displayName(p.player_slot)
                  : 'Pair ' + p.awarding_team;
                const label =
                  p.attribution === 'winner'
                    ? 'Winner'
                    : p.attribution === 'error'
                      ? 'Error'
                      : 'Award';
                return `<button type="button" class="ls-log-point ${attrClass}" data-edit-point="${p.id}">
                  <span class="ls-log-seq">#${p.sequence}</span>
                  <span>${escapeHtml(label)} · ${escapeHtml(who)}</span>
                  <span class="ls-log-score">${p.team1_points_after}–${p.team2_points_after}</span>
                  ${p.is_golden_point ? '<span class="ls-golden">GP</span>' : ''}
                  ${p.reason ? `<div class="ls-log-reason">${escapeHtml(p.reason)}</div>` : ''}
                </button>`;
              })
              .join('')}
          </div>`
          )
          .join('')}
      </div>`;
  }

  function bindResults() {
    el('lsResultsBack')?.addEventListener('click', () => {
      if (state.isReadOnly) {
        if (isFinishedRecovery()) {
          state.overlayMode = 'scorer';
          render();
          return;
        }
        closeOverlay();
        return;
      }
      state.overlayMode = 'scorer';
      render();
    });
    document.querySelectorAll('[data-rtab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.resultsTab = btn.getAttribute('data-rtab');
        render();
      });
    });
    document.querySelectorAll('[data-edit-point]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-point');
        const point = state.points.find((p) => String(p.id) === String(id));
        if (point) openEditPoint(point);
      });
    });
    el('lsReasonPlayer')?.addEventListener('change', (e) => {
      state.reasonPlayerFilterId = e.target.value || null;
      render();
    });
    document.querySelectorAll('[data-reason-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.reasonPatternTab = btn.getAttribute('data-reason-tab');
        render();
      });
    });
  }

  function openEditPoint(point) {
    state.editingPoint = point;
    state.reasonMode = loadShotMode();
    state.reasonShot = null;
    state.reasonSide = null;
    state.reasonGlass = false;
    state.reasonFinish = null;
    state.reasonNotes = point.reason || '';
    let attribution = point.attribution;
    let playerSlot = point.player_slot || null;
    let awardingTeam = point.awarding_team;

    const renderEdit = () => {
      const shots = state.reasonMode === 'simple' ? SHOTS_SIMPLE : SHOTS_DETAIL;
      const showSide = state.reasonShot && SIDE_ALLOWED.has(state.reasonShot);
      const showGlass = state.reasonShot && GLASS_ALLOWED.has(state.reasonShot);
      const detailClass = state.reasonMode === 'detail' ? ' ls-sheet-detail' : '';
      showSheet(`
        <div class="ls-sheet-inner ls-reason-sheet${detailClass}">
          <h3>Edit point #${point.sequence}</h3>
          <p class="ls-muted">${formatElapsed(point.elapsed_ms || 0)}</p>
          <p class="ls-notes-label">Who?</p>
          <div class="ls-edit-players">
            ${global.LiveScoreEngine.SLOTS.map((slot) => {
              const selected = playerSlot === slot && attribution !== 'team_award';
              return `<div class="ls-edit-player ${selected ? 'selected' : ''}">
                <div class="ls-player-name">${escapeHtml(displayName(slot))}</div>
                <div class="ls-player-actions">
                  <button type="button" class="ls-btn ls-btn-winner ${selected && attribution === 'winner' ? 'active' : ''}" data-edit-attr="winner" data-slot="${slot}">Winner</button>
                  <button type="button" class="ls-btn ls-btn-error ${selected && attribution === 'error' ? 'active' : ''}" data-edit-attr="error" data-slot="${slot}">Error</button>
                </div>
              </div>`;
            }).join('')}
          </div>
          <button type="button" class="ls-btn ls-btn-wide ${attribution === 'team_award' ? 'ls-btn-primary' : ''}" id="lsEditTeamAward">Point to pair (no player)</button>
          ${
            attribution === 'team_award'
              ? `<div class="ls-seg">
                  <button type="button" class="ls-seg-btn ${awardingTeam === 1 ? 'active' : ''}" data-edit-team="1">${escapeHtml(
                    (state.session.team1_player_names || []).map(global.LiveScoreEngine.nameOnly).join(' & ')
                  )}</button>
                  <button type="button" class="ls-seg-btn ${awardingTeam === 2 ? 'active' : ''}" data-edit-team="2">${escapeHtml(
                    (state.session.team2_player_names || []).map(global.LiveScoreEngine.nameOnly).join(' & ')
                  )}</button>
                </div>`
              : ''
          }
          <p class="ls-notes-label">Detail (optional)</p>
          <div class="ls-seg">
            <button type="button" class="ls-seg-btn ${state.reasonMode === 'simple' ? 'active' : ''}" data-mode="simple">Simple</button>
            <button type="button" class="ls-seg-btn ${state.reasonMode === 'detail' ? 'active' : ''}" data-mode="detail">Detail</button>
          </div>
          <div class="ls-shot-grid ${state.reasonMode === 'detail' ? 'ls-shot-grid-detail' : ''}">
            ${shots
              .map(
                (s) =>
                  `<button type="button" class="ls-shot ${state.reasonShot === s ? 'active' : ''}" data-shot="${s}">${SHOT_TITLES[s]}</button>`
              )
              .join('')}
          </div>
          ${
            showSide
              ? `<div class="ls-seg">
                  <button type="button" class="ls-seg-btn ${state.reasonSide === 'forehand' ? 'active' : ''}" data-side="forehand">Forehand</button>
                  <button type="button" class="ls-seg-btn ${state.reasonSide === 'backhand' ? 'active' : ''}" data-side="backhand">Backhand</button>
                </div>`
              : ''
          }
          ${
            showGlass
              ? `<label class="ls-toggle"><input type="checkbox" id="lsGlass" ${state.reasonGlass ? 'checked' : ''}> Off the glass</label>`
              : ''
          }
          <label class="ls-notes-label">Notes</label>
          <textarea id="lsReasonNotes" rows="2">${escapeHtml(state.reasonNotes)}</textarea>
          <div class="ls-reason-actions">
            <button type="button" class="ls-btn" id="lsReasonCancel">Cancel</button>
            <button type="button" class="ls-btn ls-btn-primary" id="lsSaveEditPoint">Save point</button>
          </div>
        </div>`);

      const syncNotes = () => {
        const side = state.reasonSide
          ? { title: state.reasonSide === 'forehand' ? 'Forehand' : 'Backhand' }
          : null;
        const composed = composeReason(state.reasonShot, side, state.reasonGlass, null);
        if (composed) {
          state.reasonNotes = composed;
          const ta = el('lsReasonNotes');
          if (ta) ta.value = composed;
        }
      };

      document.querySelectorAll('[data-edit-attr]').forEach((btn) => {
        btn.addEventListener('click', () => {
          attribution = btn.getAttribute('data-edit-attr');
          playerSlot = btn.getAttribute('data-slot');
          awardingTeam =
            attribution === 'error'
              ? global.LiveScoreEngine.slotTeam(playerSlot) === 1
                ? 2
                : 1
              : global.LiveScoreEngine.slotTeam(playerSlot);
          renderEdit();
        });
      });
      el('lsEditTeamAward')?.addEventListener('click', () => {
        attribution = 'team_award';
        playerSlot = null;
        renderEdit();
      });
      document.querySelectorAll('[data-edit-team]').forEach((btn) => {
        btn.addEventListener('click', () => {
          awardingTeam = Number(btn.getAttribute('data-edit-team'));
          renderEdit();
        });
      });
      document.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.reasonMode = btn.getAttribute('data-mode');
          saveShotMode(state.reasonMode);
          state.reasonShot = null;
          renderEdit();
        });
      });
      document.querySelectorAll('[data-shot]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const shot = btn.getAttribute('data-shot');
          state.reasonShot = state.reasonShot === shot ? null : shot;
          if (!state.reasonShot || !SIDE_ALLOWED.has(state.reasonShot)) state.reasonSide = null;
          if (!state.reasonShot || !GLASS_ALLOWED.has(state.reasonShot)) state.reasonGlass = false;
          syncNotes();
          renderEdit();
        });
      });
      document.querySelectorAll('[data-side]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.reasonSide = btn.getAttribute('data-side');
          syncNotes();
          renderEdit();
        });
      });
      el('lsGlass')?.addEventListener('change', (e) => {
        state.reasonGlass = e.target.checked;
        syncNotes();
      });
      el('lsReasonNotes')?.addEventListener('input', (e) => {
        state.reasonNotes = e.target.value;
      });
      el('lsReasonCancel').addEventListener('click', () => {
        state.editingPoint = null;
        hideSheet();
      });
      el('lsSaveEditPoint').addEventListener('click', async () => {
        const canSave =
          (attribution === 'team_award' && (awardingTeam === 1 || awardingTeam === 2)) ||
          ((attribution === 'winner' || attribution === 'error') && playerSlot);
        if (!canSave) {
          showToast('Choose a player or pair for this point.');
          return;
        }
        state.isSaving = true;
        try {
          const draft = {
            awardingTeam,
            attribution,
            playerId:
              attribution === 'team_award' ? null : playerIdFor(playerSlot),
            playerSlot: attribution === 'team_award' ? null : playerSlot,
            serverSlot: point.server_slot || null,
            isGoldenPoint: !!point.is_golden_point,
            reason: (el('lsReasonNotes')?.value || state.reasonNotes || '').trim()
          };
          const result = await global.MatchLiveScoringService.replacePoint(
            state.session,
            point.id,
            draft
          );
          state.session = result.session;
          state.points = result.points;
          state.snapshot = result.session.score_snapshot;
          global.LiveServeRotation.syncCurrentServer(state.snapshot);
          state.editingPoint = null;
          hideSheet();
          state.errorMessage = null;
          state.overlayMode = 'results';
          state.resultsTab = 'log';
          render();
        } catch (e) {
          state.errorMessage = e.message;
          showToast(e.message);
        } finally {
          state.isSaving = false;
        }
      });
    };

    renderEdit();
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function bootstrap() {
    state.isLoading = true;
    state.errorMessage = null;
    state.isReadOnly = false;
    state.finishedRecoveryKind = null;
    state.overlayMode = 'scorer';
    render();

    const Svc = global.MatchLiveScoringService;
    const Eng = global.LiveScoreEngine;
    try {
      const matchId = state.match.id;
      const category = Eng.normalizeMatchCategory(state.match.matchCategory);
      const existing = await Svc.fetchActiveOrLatest(matchId, category);

      if (existing && (existing.status === 'in_progress' || existing.status === 'paused')) {
        await attachResumable(existing);
        state.isLoading = false;
        render();
        if (needsServeChoice()) openServePicker();
        return;
      }

      if (
        existing &&
        (await Svc.sessionHasCapturedData(existing)) &&
        (existing.status === 'abandoned' || existing.status === 'completed')
      ) {
        await attachReadOnly(existing);
        state.finishedRecoveryKind = existing.status;
        state.isLoading = false;
        render();
        return;
      }

      const created = await Svc.startSession(state.match);
      state.session = created;
      state.snapshot = created.score_snapshot;
      state.points = [];
      recomputeElapsed();
      startTimer();
      state.isLoading = false;
      render();
      openServePicker();
    } catch (e) {
      if (e.code === 'sessionAbandoned' || e.code === 'sessionAlreadyCaptured') {
        const latest = await Svc.fetchLatestSession(
          state.match.id,
          state.match.matchCategory
        ).catch(() => null);
        if (latest) {
          await attachReadOnly(latest);
          state.finishedRecoveryKind =
            latest.status === 'abandoned' ? 'abandoned' : 'completed';
        }
      } else {
        state.errorMessage = e.message || global.MatchLiveScoringService.ERRORS.invalidResponse;
      }
      state.isLoading = false;
      render();
    }
  }

  async function attachResumable(existing) {
    state.session = existing;
    state.snapshot = existing.score_snapshot;
    global.LiveServeRotation.syncCurrentServer(state.snapshot);
    state.points = await global.MatchLiveScoringService.fetchPoints(existing.id);
    recomputeElapsed();
    if (existing.status === 'in_progress') startTimer();
  }

  async function attachReadOnly(existing) {
    state.isReadOnly = true;
    state.session = existing;
    state.snapshot = existing.score_snapshot;
    global.LiveServeRotation.syncCurrentServer(state.snapshot);
    state.points = await global.MatchLiveScoringService.fetchPoints(existing.id);
    recomputeElapsed();
    stopTimer();
  }

  async function openLiveScoring(match) {
    ensureDom();
    if (!match || !match.id) {
      showToast('Match not found.');
      return;
    }
    try {
      await global.MatchLiveScoringService.rosterSnapshot(match);
    } catch (e) {
      alert(e.message || global.MatchLiveScoringService.ERRORS.incompleteRoster);
      return;
    }

    state.match = {
      ...match,
      matchCategory: global.LiveScoreEngine.normalizeMatchCategory(match.matchCategory),
      numberOfSets: match.numberOfSets === 5 ? 5 : 3
    };
    state.session = null;
    state.points = [];
    state.snapshot = global.LiveScoreEngine.initialSnapshot(
      state.match.numberOfSets,
      state.match.matchCategory
    );
    state.selectedDeuceMode = null;
    state.pendingDraft = null;
    state.overlayMode = 'scorer';

    const overlay = el('liveScoringOverlay');
    overlay.hidden = false;
    document.body.classList.add('ls-open');
    await bootstrap();
  }

  async function openLiveResults(match) {
    ensureDom();
    if (!match || !match.id) return;
    state.match = {
      ...match,
      matchCategory: global.LiveScoreEngine.normalizeMatchCategory(match.matchCategory),
      numberOfSets: match.numberOfSets === 5 ? 5 : 3
    };
    const overlay = el('liveScoringOverlay');
    overlay.hidden = false;
    document.body.classList.add('ls-open');
    state.isLoading = true;
    state.overlayMode = 'results';
    render();
    try {
      const existing = await global.MatchLiveScoringService.fetchActiveOrLatest(
        match.id,
        state.match.matchCategory
      );
      if (!existing) {
        state.errorMessage = 'No live scoring session found for this match.';
        state.isLoading = false;
        state.overlayMode = 'scorer';
        state.isReadOnly = true;
        state.finishedRecoveryKind = null;
        render();
        showToast(state.errorMessage);
        return;
      }
      await attachReadOnly(existing);
      state.finishedRecoveryKind =
        existing.status === 'abandoned' || existing.status === 'completed'
          ? existing.status
          : null;
      state.isLoading = false;
      state.overlayMode = 'results';
      render();
    } catch (e) {
      state.errorMessage = e.message;
      state.isLoading = false;
      showToast(e.message);
      closeOverlay();
    }
  }

  /** Update match detail modal buttons for the given match context. */
  async function refreshMatchDetailActions(match, container) {
    if (!container || !match) return;
    let actions = container.querySelector('#liveScoringActions');
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'liveScoringActions';
      actions.className = 'live-scoring-actions mt-3';
      container.appendChild(actions);
    }

    const Svc = global.MatchLiveScoringService;
    const fullRoster = Svc.hasFullRoster(match);
    let userId = null;
    let isAdmin = global.userIsAdmin === true;
    try {
      const client = global.getOrCreateSupabaseClient?.();
      const { data } = await client.auth.getSession();
      userId = data?.session?.user?.id || null;
    } catch (e) {
      /* ignore */
    }

    const canParticipate = Svc.canUserParticipate(match, userId, isAdmin);
    let hasSession = false;
    try {
      if (userId) {
        const existing = await Svc.fetchActiveOrLatest(
          match.id,
          global.LiveScoreEngine.normalizeMatchCategory(match.matchCategory)
        );
        hasSession = !!existing;
      }
    } catch (e) {
      /* RLS / network — hide results quietly */
    }

    const disabledReason = !fullRoster
      ? 'Live scoring needs all four players filled in before you can start.'
      : !userId
        ? 'Sign in to use live scoring.'
        : !canParticipate
          ? 'Only match participants can use live scoring.'
          : '';

    actions.innerHTML = `
      <div class="d-grid gap-2">
        <button type="button" class="btn btn-warning" id="btnLiveScoring" ${
          fullRoster && canParticipate && userId ? '' : 'disabled'
        }>
          <i class="fas fa-stopwatch me-1"></i> Live scoring
        </button>
        <button type="button" class="btn btn-outline-light" id="btnLiveResults" ${
          hasSession && userId ? '' : 'disabled'
        }>
          <i class="fas fa-list-ol me-1"></i> Live results
        </button>
        ${
          disabledReason
            ? `<small class="text-muted">${escapeHtml(disabledReason)}</small>`
            : ''
        }
      </div>`;

    actions.querySelector('#btnLiveScoring')?.addEventListener('click', () => {
      const modalEl = document.getElementById('matchDetailModal');
      const modal = modalEl && global.bootstrap ? global.bootstrap.Modal.getInstance(modalEl) : null;
      if (modal) modal.hide();
      openLiveScoring(match);
    });
    actions.querySelector('#btnLiveResults')?.addEventListener('click', () => {
      const modalEl = document.getElementById('matchDetailModal');
      const modal = modalEl && global.bootstrap ? global.bootstrap.Modal.getInstance(modalEl) : null;
      if (modal) modal.hide();
      openLiveResults(match);
    });
  }

  global.LiveScoringUI = {
    openLiveScoring,
    openLiveResults,
    refreshMatchDetailActions,
    /** Browser console smoke helpers */
    _state: state,
    _smoke: function smoke() {
      const Eng = global.LiveScoreEngine;
      const Serve = global.LiveServeRotation;
      let s = Eng.initialSnapshot(3, 'Regular');
      Serve.chooseServer('t1_0', s);
      for (let i = 0; i < 4; i++) s = Eng.apply(1, s).after;
      console.assert(s.team1Games === 1 && s.team1Points === '0', '0-15-30-40 game', s);
      s = Eng.initialSnapshot(3, 'Regular');
      Serve.chooseServer('t1_0', s);
      for (let i = 0; i < 3; i++) {
        s = Eng.apply(1, s).after;
        s = Eng.apply(2, s).after;
      }
      console.assert(Eng.snapshotHelpers(s).isDeuce, 'deuce');
      s = Eng.apply(1, s, 'golden').after;
      console.assert(s.team1Games === 1, 'golden wins game', s);
      s = Eng.initialSnapshot(3, 'Regular');
      s.team1Games = 6;
      s.team2Games = 5;
      s.team1Points = '0';
      s.team2Points = '40';
      s.setFirstServer = 't1_0';
      s.setSecondServer = 't2_0';
      s.currentServer = 't2_0';
      s = Eng.apply(2, s).after;
      console.assert(s.isTieBreak, 'TB at 6-6', s);
      for (let i = 0; i < 7; i++) s = Eng.apply(1, s).after;
      console.assert(s.team1SetScores[0] === 7 && s.team2SetScores[0] === 6, 'TB to 7-6', s);
      console.log('Live scoring smoke checks passed');
      return true;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);

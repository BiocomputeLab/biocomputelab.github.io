import { loadState, saveState, clearState } from './storage.js';
import {
  suggestDoubles,
  recordPartnerships,
  canFormMatch,
  availableMatchTypes,
  matchTypeLabel,
  buildMatchFromSelection,
} from './scheduler.js';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

let state = loadState();
let pendingMatch = null;
let reshuffleNonce = 0;
let selectedMatchType = 'auto';
let pickMode = 'suggested'; // suggested | manual
let manualSelectedIds = [];
let toastTimer = null;

const els = {
  sessionLabel: document.getElementById('sessionLabel'),
  courtsMeta: document.getElementById('courtsMeta'),
  courtGrid: document.getElementById('courtGrid'),
  playersMeta: document.getElementById('playersMeta'),
  playerList: document.getElementById('playerList'),
  playersEmpty: document.getElementById('playersEmpty'),
  gamesMeta: document.getElementById('gamesMeta'),
  gameList: document.getElementById('gameList'),
  gamesEmpty: document.getElementById('gamesEmpty'),
  addPlayerForm: document.getElementById('addPlayerForm'),
  playerName: document.getElementById('playerName'),
  startMatchBtn: document.getElementById('startMatchBtn'),
  startMatchHint: document.getElementById('startMatchHint'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsSheet: document.getElementById('settingsSheet'),
  settingsForm: document.getElementById('settingsForm'),
  sessionNameInput: document.getElementById('sessionNameInput'),
  courtCount: document.getElementById('courtCount'),
  courtCountOutput: document.getElementById('courtCountOutput'),
  courtMinus: document.getElementById('courtMinus'),
  courtPlus: document.getElementById('courtPlus'),
  gameMinutes: document.getElementById('gameMinutes'),
  preferMixed: document.getElementById('preferMixed'),
  resetSessionBtn: document.getElementById('resetSessionBtn'),
  matchSheet: document.getElementById('matchSheet'),
  matchIntro: document.getElementById('matchIntro'),
  matchPreview: document.getElementById('matchPreview'),
  matchTypeSelect: document.getElementById('matchTypeSelect'),
  matchCourtSelect: document.getElementById('matchCourtSelect'),
  closeMatchSheet: document.getElementById('closeMatchSheet'),
  reshuffleBtn: document.getElementById('reshuffleBtn'),
  confirmMatchBtn: document.getElementById('confirmMatchBtn'),
  modeSuggestedBtn: document.getElementById('modeSuggestedBtn'),
  modeManualBtn: document.getElementById('modeManualBtn'),
  suggestedControls: document.getElementById('suggestedControls'),
  manualControls: document.getElementById('manualControls'),
  manualPickList: document.getElementById('manualPickList'),
  manualHint: document.getElementById('manualHint'),
  toast: document.getElementById('toast'),
};

function persist() {
  state = saveState(state);
}

function showToast(message) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('show');
    setTimeout(() => {
      els.toast.hidden = true;
    }, 280);
  }, 2400);
}

function waitingPlayers() {
  return state.players.filter((p) => p.status === 'waiting');
}

function freeCourts() {
  return state.courts.filter((c) => c.status === 'free');
}

function activeGames() {
  return state.games.filter((g) => g.status === 'active');
}

function playerById(id) {
  return state.players.find((p) => p.id === id);
}

function selectedGender() {
  const select = document.getElementById('playerGender');
  return select?.value === 'female' ? 'female' : 'male';
}

function genderShort(gender) {
  return gender === 'female' ? 'F' : 'M';
}

function formatRemaining(freesAt) {
  if (!freesAt) return null;
  const ms = freesAt - Date.now();
  if (ms <= 0) return 'due now';
  const mins = Math.ceil(ms / 60000);
  return mins === 1 ? '~1 min left' : `~${mins} min left`;
}

function canStartMatch() {
  return canFormMatch(waitingPlayers()) && freeCourts().length >= 1;
}

function updateStartButton() {
  const waiting = waitingPlayers();
  const free = freeCourts().length;
  const avail = availableMatchTypes(waiting);
  const ok = avail.types.length > 0 && free >= 1;
  els.startMatchBtn.disabled = !ok;

  if (ok) {
    els.startMatchHint.textContent = `${avail.male}M · ${avail.female}F waiting · ${free} court${free === 1 ? '' : 's'} free`;
    return;
  }

  if (free < 1 && avail.types.length === 0) {
    els.startMatchHint.textContent = 'Need a valid lineup and a free court';
  } else if (free < 1) {
    els.startMatchHint.textContent = 'All courts busy — end a match first';
  } else if (avail.male + avail.female < 4) {
    els.startMatchHint.textContent = `Need more players (${avail.male}M · ${avail.female}F)`;
  } else {
    els.startMatchHint.textContent = `Need 2M+2F, 4M, or 4F`;
  }
}

function renderCourts() {
  const free = freeCourts().length;
  const playing = state.courts.length - free;
  els.courtsMeta.textContent = `${free} free · ${playing} playing`;

  els.courtGrid.replaceChildren();
  for (const court of state.courts) {
    const game = court.gameId ? state.games.find((g) => g.id === court.gameId) : null;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `court-tile ${court.status}`;
    el.dataset.courtId = court.id;

    const remaining = formatRemaining(court.freesAt);
    const detail = game
      ? `${matchTypeLabel(game.matchType)} · ${remaining || 'In progress'}`
      : 'Ready for doubles';

    el.innerHTML = `
      <span class="court-num">Court ${court.number}</span>
      <span class="court-status">${court.status === 'free' ? 'Free' : 'In play'}</span>
      <span class="court-detail">${detail}</span>
    `;

    if (court.status === 'free' && canStartMatch()) {
      el.addEventListener('click', () => openMatchSheet(court.id));
    } else if (court.status === 'playing' && game) {
      el.addEventListener('click', () => endGame(game.id));
    }

    els.courtGrid.appendChild(el);
  }
}

function renderPlayers() {
  const total = state.players.length;
  const waiting = waitingPlayers();
  const playing = total - waiting.length;
  const avail = availableMatchTypes(waiting);
  els.playersMeta.textContent =
    total === 0
      ? '0 present'
      : `${total} present · ${avail.male}M · ${avail.female}F waiting · ${playing} playing`;

  els.playersEmpty.hidden = total > 0;
  els.playerList.replaceChildren();

  const ordered = [...state.players].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'waiting' ? -1 : 1;
    return (a.gamesPlayed || 0) - (b.gamesPlayed || 0) || a.name.localeCompare(b.name);
  });

  for (const player of ordered) {
    const li = document.createElement('li');
    li.className = `player-row ${player.status}`;
    li.style.setProperty('--enter-delay', `${Math.min(ordered.indexOf(player) * 28, 280)}ms`);
    const g = player.gender === 'female' ? 'female' : 'male';

    li.innerHTML = `
      <button type="button" class="gender-badge ${g}" data-toggle-gender="${player.id}" aria-label="Toggle gender for ${escapeHtml(player.name)}, currently ${g}">
        ${genderShort(g)}
      </button>
      <div class="player-info">
        <span class="player-name">${escapeHtml(player.name)}</span>
        <span class="player-state">${player.status === 'playing' ? 'Playing' : 'Waiting'} · ${player.gamesPlayed || 0} game${(player.gamesPlayed || 0) === 1 ? '' : 's'}</span>
      </div>
      <button type="button" class="text-btn remove-player" data-id="${player.id}" aria-label="Remove ${escapeHtml(player.name)}" ${player.status === 'playing' ? 'disabled' : ''}>Remove</button>
    `;
    els.playerList.appendChild(li);
  }
}

function renderGames() {
  const games = activeGames();
  els.gamesMeta.textContent =
    games.length === 0 ? 'No matches yet' : `${games.length} match${games.length === 1 ? '' : 'es'} live`;
  els.gamesEmpty.hidden = games.length > 0;
  els.gameList.replaceChildren();

  for (const game of games) {
    const court = state.courts.find((c) => c.id === game.courtId);
    const teamA = game.teamA.map((id) => {
      const p = playerById(id);
      return p ? `${p.name} (${genderShort(p.gender)})` : '?';
    });
    const teamB = game.teamB.map((id) => {
      const p = playerById(id);
      return p ? `${p.name} (${genderShort(p.gender)})` : '?';
    });
    const remaining = formatRemaining(court?.freesAt);

    const card = document.createElement('article');
    card.className = 'game-card';
    card.innerHTML = `
      <header class="game-card-head">
        <h3>Court ${court?.number ?? '?'} · ${escapeHtml(matchTypeLabel(game.matchType))}</h3>
        <span>${remaining || 'In progress'}</span>
      </header>
      <div class="matchup">
        <div class="team">
          <span class="team-label">Side A</span>
          <span class="team-names">${teamA.map(escapeHtml).join(' & ')}</span>
        </div>
        <span class="vs" aria-hidden="true">vs</span>
        <div class="team">
          <span class="team-label">Side B</span>
          <span class="team-names">${teamB.map(escapeHtml).join(' & ')}</span>
        </div>
      </div>
      <button type="button" class="end-game-btn" data-game-id="${game.id}">Court free — end match</button>
    `;
    els.gameList.appendChild(card);
  }
}

function renderAll() {
  els.sessionLabel.textContent = state.sessionName || 'Club session';
  renderCourts();
  renderPlayers();
  renderGames();
  updateStartButton();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function addPlayer(name, gender) {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) return;

  const exists = state.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    showToast('That name is already on the list');
    return;
  }

  const g = gender === 'female' ? 'female' : 'male';
  state.players.push({
    id: uid(),
    name: trimmed,
    gender: g,
    status: 'waiting',
    gamesPlayed: 0,
    arrivedAt: Date.now(),
  });
  persist();
  renderAll();
  showToast(`${trimmed} (${genderShort(g)}) is waiting`);
}

function removePlayer(id) {
  const player = playerById(id);
  if (!player || player.status === 'playing') return;
  state.players = state.players.filter((p) => p.id !== id);
  persist();
  renderAll();
  showToast(`${player.name} removed`);
}

function togglePlayerGender(id) {
  const player = playerById(id);
  if (!player || player.status === 'playing') {
    if (player?.status === 'playing') showToast('End their match before changing gender');
    return;
  }
  player.gender = player.gender === 'female' ? 'male' : 'female';
  persist();
  renderAll();
  showToast(`${player.name} marked ${player.gender === 'female' ? 'female' : 'male'}`);
}

function suggestOptions() {
  return {
    reshuffleNonce,
    matchType: selectedMatchType,
    preferMixed: state.preferMixed !== false,
  };
}

function refreshMatchTypeOptions() {
  const avail = availableMatchTypes(waitingPlayers());
  const select = els.matchTypeSelect;
  for (const opt of select.options) {
    if (opt.value === 'auto') {
      opt.disabled = avail.types.length === 0;
      continue;
    }
    opt.disabled = !avail.types.includes(opt.value);
  }
  if (selectedMatchType !== 'auto' && !avail.types.includes(selectedMatchType)) {
    selectedMatchType = 'auto';
  }
  select.value = selectedMatchType;
}

function setPickMode(mode) {
  pickMode = mode === 'manual' ? 'manual' : 'suggested';
  els.modeSuggestedBtn.classList.toggle('is-active', pickMode === 'suggested');
  els.modeManualBtn.classList.toggle('is-active', pickMode === 'manual');
  els.modeSuggestedBtn.setAttribute('aria-selected', pickMode === 'suggested' ? 'true' : 'false');
  els.modeManualBtn.setAttribute('aria-selected', pickMode === 'manual' ? 'true' : 'false');
  els.suggestedControls.hidden = pickMode !== 'suggested';
  els.manualControls.hidden = pickMode !== 'manual';
  els.reshuffleBtn.textContent = pickMode === 'manual' ? 'Swap sides' : 'Reshuffle';

  if (pickMode === 'suggested') {
    els.matchIntro.textContent = 'Fair mix based on games played and who has already partnered.';
    refreshSuggestedMatch();
  } else {
    els.matchIntro.textContent = 'Choose any valid 4 waiting players, then start when the lineup looks right.';
    reshuffleNonce = 0;
    rebuildManualMatch();
    renderManualPickList();
  }
  updateConfirmEnabled();
}

function refreshSuggestedMatch() {
  refreshMatchTypeOptions();
  pendingMatch = suggestDoubles(waitingPlayers(), state.pairHistory, suggestOptions());
  renderMatchPreview();
  updateConfirmEnabled();
}

function selectedManualPlayers() {
  return manualSelectedIds.map((id) => playerById(id)).filter(Boolean);
}

function rebuildManualMatch() {
  pendingMatch = buildMatchFromSelection(selectedManualPlayers(), state.pairHistory, reshuffleNonce);
  renderMatchPreview();
  updateManualHint();
  updateConfirmEnabled();
}

function updateManualHint() {
  const n = manualSelectedIds.length;
  if (n < 4) {
    els.manualHint.textContent = `Selected ${n} of 4 · need a valid mixed (2M+2F) or same-gender set.`;
    return;
  }
  if (!pendingMatch) {
    els.manualHint.textContent = 'Those four can’t form mixed or same-gender doubles. Change the selection.';
    return;
  }
  els.manualHint.textContent = `${pendingMatch.label} ready · tap Swap sides for another pairing.`;
}

function renderManualPickList() {
  const waiting = waitingPlayers().sort((a, b) => a.name.localeCompare(b.name));
  els.manualPickList.replaceChildren();

  for (const player of waiting) {
    const selected = manualSelectedIds.includes(player.id);
    const atLimit = !selected && manualSelectedIds.length >= 4;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `manual-pick ${selected ? 'is-selected' : ''}`;
    btn.disabled = atLimit;
    btn.dataset.id = player.id;
    btn.innerHTML = `
      <span class="manual-pick-check" aria-hidden="true">${selected ? '✓' : ''}</span>
      <span>
        <span class="manual-pick-name">${escapeHtml(player.name)}</span>
        <span class="manual-pick-meta">${player.gamesPlayed || 0} game${(player.gamesPlayed || 0) === 1 ? '' : 's'}</span>
      </span>
      <span class="gender-badge ${player.gender === 'female' ? 'female' : 'male'}">${genderShort(player.gender)}</span>
    `;
    els.manualPickList.appendChild(btn);
  }
}

function toggleManualPlayer(id) {
  const idx = manualSelectedIds.indexOf(id);
  if (idx >= 0) {
    manualSelectedIds = manualSelectedIds.filter((x) => x !== id);
  } else if (manualSelectedIds.length < 4) {
    manualSelectedIds = [...manualSelectedIds, id];
  }
  reshuffleNonce = 0;
  rebuildManualMatch();
  renderManualPickList();
}

function updateConfirmEnabled() {
  els.confirmMatchBtn.disabled = !pendingMatch;
}

function openMatchSheet(preferredCourtId = null) {
  if (!canStartMatch()) {
    showToast('Need a mixed or same-gender lineup and a free court');
    return;
  }

  reshuffleNonce = 0;
  manualSelectedIds = [];
  pickMode = 'suggested';

  const frees = freeCourts();
  els.matchCourtSelect.replaceChildren();
  for (const court of frees) {
    const opt = document.createElement('option');
    opt.value = court.id;
    opt.textContent = `Court ${court.number}`;
    if (preferredCourtId && court.id === preferredCourtId) opt.selected = true;
    els.matchCourtSelect.appendChild(opt);
  }

  setPickMode('suggested');
  els.matchSheet.showModal();
}

function renderMatchPreview() {
  if (!pendingMatch) {
    els.matchPreview.innerHTML = `<p class="match-preview-empty">${
      pickMode === 'manual'
        ? 'Pick four players that make mixed or same-gender doubles.'
        : 'No lineup available for this match type.'
    }</p>`;
    return;
  }

  const { teamA, teamB, matchType, label, manual } = pendingMatch;
  els.matchPreview.innerHTML = `
    <div class="match-type-badge ${matchType || ''}">${escapeHtml(label || matchTypeLabel(matchType))}${manual ? ' · manual' : ''}</div>
    <div class="preview-sides">
      <div class="preview-team">
        <span class="team-label">Side A</span>
        ${teamA
          .map(
            (p) =>
              `<span class="chip"><span class="chip-gender ${p.gender}">${genderShort(p.gender)}</span>${escapeHtml(p.name)}</span>`
          )
          .join('')}
      </div>
      <span class="vs">vs</span>
      <div class="preview-team">
        <span class="team-label">Side B</span>
        ${teamB
          .map(
            (p) =>
              `<span class="chip"><span class="chip-gender ${p.gender}">${genderShort(p.gender)}</span>${escapeHtml(p.name)}</span>`
          )
          .join('')}
      </div>
    </div>
  `;
  const games = [...teamA, ...teamB].map((p) => p.gamesPlayed || 0);
  if (pickMode === 'suggested') {
    els.matchIntro.textContent = `${label || matchTypeLabel(matchType)} · players have ${Math.min(...games)}–${Math.max(...games)} games so far`;
  }
}

function confirmMatch() {
  if (!pendingMatch) {
    showToast(pickMode === 'manual' ? 'Select a valid set of 4 players first' : 'No lineup to start');
    return;
  }
  const courtId = els.matchCourtSelect.value;
  const court = state.courts.find((c) => c.id === courtId && c.status === 'free');
  if (!court) {
    showToast('That court is no longer free');
    return;
  }

  const ids = pendingMatch.playerIds;
  const stillWaiting = ids.every((id) => playerById(id)?.status === 'waiting');
  if (!stillWaiting) {
    showToast('Someone in this match is no longer waiting');
    els.matchSheet.close();
    return;
  }

  const teamA = pendingMatch.teamA.map((p) => p.id);
  const teamB = pendingMatch.teamB.map((p) => p.id);
  const gameId = uid();
  const freesAt = Date.now() + state.gameMinutes * 60 * 1000;

  state.games.push({
    id: gameId,
    courtId: court.id,
    matchType: pendingMatch.matchType || 'mens',
    teamA,
    teamB,
    playerIds: [...teamA, ...teamB],
    status: 'active',
    startedAt: Date.now(),
  });

  court.status = 'playing';
  court.gameId = gameId;
  court.freesAt = freesAt;

  for (const id of ids) {
    const p = playerById(id);
    if (p) p.status = 'playing';
  }

  state.pairHistory = recordPartnerships(state.pairHistory, teamA, teamB);
  const startedType = pendingMatch.matchType;
  pendingMatch = null;
  manualSelectedIds = [];
  persist();
  els.matchSheet.close();
  renderAll();
  showToast(`${matchTypeLabel(startedType)} on court ${court.number}`);
}

function endGame(gameId) {
  const game = state.games.find((g) => g.id === gameId && g.status === 'active');
  if (!game) return;

  game.status = 'done';
  game.endedAt = Date.now();

  for (const id of game.playerIds) {
    const p = playerById(id);
    if (p) {
      p.status = 'waiting';
      p.gamesPlayed = (p.gamesPlayed || 0) + 1;
    }
  }

  const court = state.courts.find((c) => c.id === game.courtId);
  if (court) {
    court.status = 'free';
    court.gameId = null;
    court.freesAt = null;
  }

  state.games = state.games.filter((g) => g.status === 'active');

  persist();
  renderAll();
  const courtLabel = court ? `Court ${court.number}` : 'Court';
  showToast(`${courtLabel} free again`);
}

function openSettings() {
  els.sessionNameInput.value = state.sessionName || '';
  els.courtCount.value = String(state.courtCount);
  els.courtCountOutput.textContent = String(state.courtCount);
  els.gameMinutes.value = String(state.gameMinutes || 15);
  els.preferMixed.checked = state.preferMixed !== false;
  els.settingsSheet.showModal();
}

function applyCourtCount(nextCount) {
  const count = Math.min(8, Math.max(1, nextCount));
  const playingOnDoomed = state.courts
    .slice(count)
    .filter((c) => c.status === 'playing');

  if (playingOnDoomed.length) {
    showToast('End matches on higher courts before reducing');
    return false;
  }

  state.courtCount = count;
  const existing = state.courts.slice(0, count);
  while (existing.length < count) {
    const n = existing.length + 1;
    existing.push({
      id: `court-${n}-${uid().slice(0, 6)}`,
      number: n,
      status: 'free',
      gameId: null,
      freesAt: null,
    });
  }
  existing.forEach((c, i) => {
    c.number = i + 1;
  });
  state.courts = existing;
  return true;
}

// —— Events ——
els.addPlayerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addPlayer(els.playerName.value, selectedGender());
  els.playerName.value = '';
  els.playerName.focus();
});

els.playerList.addEventListener('click', (e) => {
  const genderBtn = e.target.closest('[data-toggle-gender]');
  if (genderBtn) {
    togglePlayerGender(genderBtn.dataset.toggleGender);
    return;
  }
  const btn = e.target.closest('.remove-player');
  if (!btn || btn.disabled) return;
  removePlayer(btn.dataset.id);
});

els.gameList.addEventListener('click', (e) => {
  const btn = e.target.closest('.end-game-btn');
  if (!btn) return;
  endGame(btn.dataset.gameId);
});

els.startMatchBtn.addEventListener('click', () => openMatchSheet());

els.settingsBtn.addEventListener('click', openSettings);

els.courtMinus.addEventListener('click', () => {
  const next = Number(els.courtCount.value) - 1;
  if (next < 1) return;
  els.courtCount.value = String(next);
  els.courtCountOutput.textContent = String(next);
});

els.courtPlus.addEventListener('click', () => {
  const next = Number(els.courtCount.value) + 1;
  if (next > 8) return;
  els.courtCount.value = String(next);
  els.courtCountOutput.textContent = String(next);
});

els.settingsForm.addEventListener('submit', (e) => {
  const submitter = e.submitter;
  if (submitter?.value === 'cancel') return;

  e.preventDefault();
  state.sessionName = els.sessionNameInput.value.trim() || 'Club session';
  state.gameMinutes = Number(els.gameMinutes.value) || 15;
  state.preferMixed = !!els.preferMixed.checked;
  const ok = applyCourtCount(Number(els.courtCount.value));
  if (!ok) return;
  persist();
  els.settingsSheet.close();
  renderAll();
  showToast('Session updated');
});

els.resetSessionBtn.addEventListener('click', () => {
  const ok = window.confirm('Reset this session? All players, courts, and history will be cleared on this device.');
  if (!ok) return;
  state = clearState();
  persist();
  els.settingsSheet.close();
  renderAll();
  showToast('Fresh session ready');
});

els.closeMatchSheet.addEventListener('click', () => {
  pendingMatch = null;
  manualSelectedIds = [];
  els.matchSheet.close();
});

els.modeSuggestedBtn.addEventListener('click', () => setPickMode('suggested'));
els.modeManualBtn.addEventListener('click', () => setPickMode('manual'));

els.manualPickList.addEventListener('click', (e) => {
  const btn = e.target.closest('.manual-pick');
  if (!btn || btn.disabled) return;
  toggleManualPlayer(btn.dataset.id);
});

els.matchTypeSelect.addEventListener('change', () => {
  selectedMatchType = els.matchTypeSelect.value || 'auto';
  reshuffleNonce = 0;
  refreshSuggestedMatch();
  if (!pendingMatch) showToast('No lineup for that match type yet');
  els.matchPreview.classList.remove('pulse');
  void els.matchPreview.offsetWidth;
  els.matchPreview.classList.add('pulse');
});

els.reshuffleBtn.addEventListener('click', () => {
  if (pickMode === 'manual') {
    if (manualSelectedIds.length !== 4 || !pendingMatch) {
      showToast('Select 4 valid players first');
      return;
    }
    reshuffleNonce += 1;
    rebuildManualMatch();
  } else {
    reshuffleNonce += 1;
    refreshSuggestedMatch();
    if (!pendingMatch) {
      showToast('No alternate lineup');
      return;
    }
  }
  els.matchPreview.classList.remove('pulse');
  void els.matchPreview.offsetWidth;
  els.matchPreview.classList.add('pulse');
});

els.confirmMatchBtn.addEventListener('click', confirmMatch);

setInterval(() => {
  if (activeGames().length === 0) return;
  renderCourts();
  renderGames();
  updateStartButton();
}, 30000);

renderAll();

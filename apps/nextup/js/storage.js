const STORAGE_KEY = 'nextup.badminton.v1';

const defaultState = () => ({
  sessionName: 'Club session',
  courtCount: 2,
  gameMinutes: 15,
  preferMixed: true,
  players: [],
  courts: [],
  games: [],
  pairHistory: {},
  updatedAt: Date.now(),
});

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return hydrateCourts(defaultState());
    const parsed = JSON.parse(raw);
    return hydrateCourts({ ...defaultState(), ...parsed });
  } catch {
    return hydrateCourts(defaultState());
  }
}

export function saveState(state) {
  const payload = { ...state, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
  return hydrateCourts(defaultState());
}

function hydrateCourts(state) {
  const count = clamp(Number(state.courtCount) || 3, 1, 8);
  const existing = Array.isArray(state.courts) ? state.courts : [];
  const courts = [];

  for (let i = 0; i < count; i += 1) {
    const prev = existing[i];
    courts.push({
      id: prev?.id || `court-${i + 1}`,
      number: i + 1,
      status: prev?.status === 'playing' ? 'playing' : 'free',
      gameId: prev?.status === 'playing' ? prev.gameId || null : null,
      freesAt: prev?.freesAt || null,
    });
  }

  // Drop games on courts that no longer exist
  const courtIds = new Set(courts.map((c) => c.id));
  const games = (state.games || []).filter((g) => g.status === 'active' && courtIds.has(g.courtId));

  // Reconcile court.gameId
  for (const court of courts) {
    const game = games.find((g) => g.id === court.gameId);
    if (!game) {
      court.status = 'free';
      court.gameId = null;
      court.freesAt = null;
    }
  }

  // Players on missing games become waiting; normalize gender
  const activePlayerIds = new Set(games.flatMap((g) => g.playerIds));
  const players = (state.players || []).map((p) => ({
    ...p,
    gender: p.gender === 'female' || p.gender === 'male' ? p.gender : 'male',
    status: activePlayerIds.has(p.id) ? 'playing' : 'waiting',
  }));

  return {
    ...state,
    courtCount: count,
    preferMixed: state.preferMixed !== false,
    courts,
    games,
    players,
    pairHistory: state.pairHistory || {},
  };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

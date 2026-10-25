/**
 * Fair doubles mixer for club sessions.
 * Supports mixed (2M/2F with M+F pairs) and same-gender doubles.
 * Prefers players with fewer games and fewer repeated partnerships.
 */

function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function getPairCount(history, a, b) {
  return history[pairKey(a, b)] || 0;
}

function combinations(arr, k) {
  const out = [];
  const n = arr.length;
  if (k > n || k <= 0) return out;

  const idxs = Array.from({ length: k }, (_, i) => i);
  while (true) {
    out.push(idxs.map((i) => arr[i]));
    let i = k - 1;
    while (i >= 0 && idxs[i] === i + n - k) i -= 1;
    if (i < 0) break;
    idxs[i] += 1;
    for (let j = i + 1; j < k; j += 1) idxs[j] = idxs[j - 1] + 1;
  }
  return out;
}

function normalizeGender(g) {
  return g === 'female' || g === 'male' ? g : null;
}

function byGender(players) {
  const male = [];
  const female = [];
  for (const p of players) {
    const g = normalizeGender(p.gender);
    if (g === 'male') male.push(p);
    else if (g === 'female') female.push(p);
  }
  return { male, female };
}

function scoreTeaming(teaming, history) {
  const { teamA, teamB } = teaming;
  const partnerScore =
    getPairCount(history, teamA[0].id, teamA[1].id) +
    getPairCount(history, teamB[0].id, teamB[1].id);

  let opponentScore = 0;
  for (const p of teamA) {
    for (const q of teamB) {
      opponentScore += getPairCount(history, p.id, q.id) * 0.35;
    }
  }

  return partnerScore * 3 + opponentScore;
}

function scoreQuartetBase(quartet) {
  const gamesSum = quartet.reduce((s, p) => s + (p.gamesPlayed || 0), 0);
  const gamesSpread =
    Math.max(...quartet.map((p) => p.gamesPlayed || 0)) -
    Math.min(...quartet.map((p) => p.gamesPlayed || 0));
  return gamesSum * 4 + gamesSpread * 2.5;
}

function bestSameGenderTeaming(quartet, history) {
  const [a, b, c, d] = quartet;
  const options = [
    { teamA: [a, b], teamB: [c, d] },
    { teamA: [a, c], teamB: [b, d] },
    { teamA: [a, d], teamB: [b, c] },
  ];

  let best = null;
  let bestMix = Infinity;
  for (const teaming of options) {
    const mix = scoreTeaming(teaming, history);
    if (mix < bestMix) {
      bestMix = mix;
      best = teaming;
    }
  }
  return { teaming: best, mix: bestMix };
}

/** Mixed doubles: each side is one male + one female. */
function bestMixedTeaming(males, females, history) {
  const [m1, m2] = males;
  const [f1, f2] = females;
  const options = [
    { teamA: [m1, f1], teamB: [m2, f2] },
    { teamA: [m1, f2], teamB: [m2, f1] },
  ];

  let best = null;
  let bestMix = Infinity;
  for (const teaming of options) {
    const mix = scoreTeaming(teaming, history);
    if (mix < bestMix) {
      bestMix = mix;
      best = teaming;
    }
  }
  return { teaming: best, mix: bestMix };
}

function candidatePool(waiting, limit = 8) {
  const sorted = [...waiting].sort((a, b) => {
    const g = (a.gamesPlayed || 0) - (b.gamesPlayed || 0);
    if (g !== 0) return g;
    return (a.arrivedAt || 0) - (b.arrivedAt || 0);
  });

  if (sorted.length <= limit) return sorted;

  const cutoff = sorted[limit - 1].gamesPlayed || 0;
  const pool = sorted.filter((p) => (p.gamesPlayed || 0) <= cutoff);
  if (pool.length <= 12) return pool;
  return pool.slice(0, 12);
}

function matchTypeLabel(type) {
  if (type === 'mixed') return 'Mixed doubles';
  if (type === 'mens') return "Men's doubles";
  if (type === 'womens') return "Women's doubles";
  return 'Doubles';
}

function buildSameGenderCandidates(pool, gender, matchType, history) {
  const group = pool.filter((p) => normalizeGender(p.gender) === gender);
  if (group.length < 4) return [];

  const limited = candidatePool(group, 8);
  return combinations(limited, 4).map((q) => {
    const { teaming, mix } = bestSameGenderTeaming(q, history);
    return {
      matchType,
      teamA: teaming.teamA,
      teamB: teaming.teamB,
      playerIds: q.map((p) => p.id),
      score: scoreQuartetBase(q) + mix,
      mix,
      label: matchTypeLabel(matchType),
    };
  });
}

function buildMixedCandidates(pool, history) {
  const { male, female } = byGender(pool);
  if (male.length < 2 || female.length < 2) return [];

  const malePool = candidatePool(male, 6);
  const femalePool = candidatePool(female, 6);
  const out = [];

  for (const males of combinations(malePool, 2)) {
    for (const females of combinations(femalePool, 2)) {
      const quartet = [...males, ...females];
      const { teaming, mix } = bestMixedTeaming(males, females, history);
      out.push({
        matchType: 'mixed',
        teamA: teaming.teamA,
        teamB: teaming.teamB,
        playerIds: quartet.map((p) => p.id),
        score: scoreQuartetBase(quartet) + mix,
        mix,
        label: matchTypeLabel('mixed'),
      });
    }
  }
  return out;
}

/**
 * What match formats are possible with the current waiting pool?
 */
export function availableMatchTypes(waitingPlayers) {
  const waiting = waitingPlayers.filter((p) => p.status === 'waiting' && normalizeGender(p.gender));
  const { male, female } = byGender(waiting);
  const types = [];
  if (male.length >= 2 && female.length >= 2) types.push('mixed');
  if (male.length >= 4) types.push('mens');
  if (female.length >= 4) types.push('womens');
  return { types, male: male.length, female: female.length, waiting: waiting.length };
}

export function canFormMatch(waitingPlayers) {
  return availableMatchTypes(waitingPlayers).types.length > 0;
}

/**
 * Suggest a doubles match from waiting players.
 * @param {'auto'|'mixed'|'mens'|'womens'} [options.matchType]
 * @returns {object|null}
 */
export function suggestDoubles(waitingPlayers, pairHistory = {}, options = {}) {
  const {
    avoidIds = new Set(),
    reshuffleNonce = 0,
    matchType = 'auto',
    preferMixed = true,
  } = options;

  const waiting = waitingPlayers.filter(
    (p) => p.status === 'waiting' && !avoidIds.has(p.id) && normalizeGender(p.gender)
  );
  if (waiting.length < 4) return null;

  const pool = candidatePool(waiting, 10);
  let ranked = [];

  const want =
    matchType === 'auto'
      ? ['mixed', 'mens', 'womens']
      : [matchType];

  if (want.includes('mixed')) ranked = ranked.concat(buildMixedCandidates(pool, pairHistory));
  if (want.includes('mens')) {
    ranked = ranked.concat(buildSameGenderCandidates(pool, 'male', 'mens', pairHistory));
  }
  if (want.includes('womens')) {
    ranked = ranked.concat(buildSameGenderCandidates(pool, 'female', 'womens', pairHistory));
  }

  if (!ranked.length) return null;

  // Prefer mixed slightly when auto-picking
  if (matchType === 'auto' && preferMixed) {
    for (const c of ranked) {
      if (c.matchType === 'mixed') c.score -= 1.5;
    }
  }

  ranked.sort((a, b) => a.score - b.score);

  const index = Math.min(reshuffleNonce % Math.min(ranked.length, 8), ranked.length - 1);
  return ranked[index] || null;
}

/**
 * Build a match from exactly four manually chosen waiting players.
 * @param {object[]} selectedPlayers
 * @param {object} pairHistory
 * @param {number} [teamingNonce] cycle alternate valid teamings
 * @returns {object|null}
 */
export function buildMatchFromSelection(selectedPlayers, pairHistory = {}, teamingNonce = 0) {
  if (!selectedPlayers || selectedPlayers.length !== 4) return null;
  const players = selectedPlayers.filter((p) => p && normalizeGender(p.gender));
  if (players.length !== 4) return null;

  const { male, female } = byGender(players);
  let options = [];

  if (male.length === 2 && female.length === 2) {
    const [m1, m2] = male;
    const [f1, f2] = female;
    options = [
      { matchType: 'mixed', teamA: [m1, f1], teamB: [m2, f2] },
      { matchType: 'mixed', teamA: [m1, f2], teamB: [m2, f1] },
    ];
  } else if (male.length === 4) {
    const [a, b, c, d] = male;
    options = [
      { matchType: 'mens', teamA: [a, b], teamB: [c, d] },
      { matchType: 'mens', teamA: [a, c], teamB: [b, d] },
      { matchType: 'mens', teamA: [a, d], teamB: [b, c] },
    ];
  } else if (female.length === 4) {
    const [a, b, c, d] = female;
    options = [
      { matchType: 'womens', teamA: [a, b], teamB: [c, d] },
      { matchType: 'womens', teamA: [a, c], teamB: [b, d] },
      { matchType: 'womens', teamA: [a, d], teamB: [b, c] },
    ];
  } else {
    return null;
  }

  const scored = options
    .map((opt) => ({
      ...opt,
      mix: scoreTeaming(opt, pairHistory),
      label: matchTypeLabel(opt.matchType),
      playerIds: [...opt.teamA, ...opt.teamB].map((p) => p.id),
      manual: true,
    }))
    .sort((a, b) => a.mix - b.mix);

  const index = Math.min(teamingNonce % scored.length, scored.length - 1);
  const chosen = scored[index];
  return {
    matchType: chosen.matchType,
    teamA: chosen.teamA,
    teamB: chosen.teamB,
    playerIds: chosen.playerIds,
    score: chosen.mix,
    mix: chosen.mix,
    label: chosen.label,
    manual: true,
  };
}

export function selectionIsValid(selectedPlayers) {
  return !!buildMatchFromSelection(selectedPlayers, {}, 0);
}

export function recordPartnerships(pairHistory, teamAIds, teamBIds) {
  const next = { ...pairHistory };
  const bump = (a, b) => {
    const key = pairKey(a, b);
    next[key] = (next[key] || 0) + 1;
  };

  bump(teamAIds[0], teamAIds[1]);
  bump(teamBIds[0], teamBIds[1]);

  for (const a of teamAIds) {
    for (const b of teamBIds) bump(a, b);
  }

  return next;
}

export { pairKey, getPairCount, matchTypeLabel, normalizeGender, byGender };

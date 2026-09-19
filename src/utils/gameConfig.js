// ── Booster prices in TubeCoins (TC) ──────────────────────────────────────────
export const BOOSTER_PRICES = {
  decouverte: 4,   // 5 cartes • Tier 1 Starter
  gaming:     8,   // 5 cartes • Tier 2 Avancé
  viral:      14,  // 5 cartes • Tier 3 Élite
  standard:   6,   // 7 cartes • Tier 1 Starter
  culture:    12,  // 7 cartes • Tier 2 Avancé
  collector:  20,  // 7 cartes • Tier 3 Élite
  // Aliases for backward compatibility
  premium:    14,
  mythic:     20,
};

// ── Daily reward calculation ──────────────────────────────────────────────────
export function dailyRewardAmount(streak) {
  return Math.min(15, 5 + streak * 2); // 7 TC at streak 1 → 15 TC at streak 5+
}


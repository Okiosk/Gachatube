// ── Booster prices in TubeCoins (TC) ──────────────────────────────────────────
export const BOOSTER_PRICES = {
  decouverte: 3,   // 3 cartes, idéal pour débuter
  standard:   6,   // 5 cartes classiques équilibrées
  gaming:     10,  // 5 cartes axées Gaming, Esport & Défis
  culture:    10,  // 5 cartes axées Savoir, Vulgarisation & Cinéma
  viral:      14,  // 5 cartes à gros audimat & Rares boostées
  collector:  32,  // 6 cartes d'élite, foils garanties & chances mythiques
  // Aliases for backward compatibility
  premium:    14,
  mythic:     32,
};

// ── Daily reward calculation ──────────────────────────────────────────────────
export function dailyRewardAmount(streak) {
  return Math.min(15, 5 + streak * 2); // 7 TC at streak 1 → 15 TC at streak 5+
}


// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENT DEFINITIONS
// Each achievement has:
//   id, name, desc, emoji, reward (coins), check(statsSnapshot) → boolean
//
// Stats snapshot shape:
// {
//   packsOpened: number,
//   uniqueCards: number,
//   coins: number,
//   loginStreak: number,
//   rarityCount: { COMMUNE, PEU_COMMUNE, RARE, ULTRA_RARE, MYTHIQUE },
//   boostersOpened: { standard, premium, mythic }
// }
// ─────────────────────────────────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  // ── 1. COLLECTION & BOOSTER COUNT ──
  {
    id: 'first_pack',
    name: 'Premier Paquet',
    desc: 'Ouvre ton premier booster',
    emoji: '📦',
    reward: 2,
    category: 'Collection',
    check: (s) => s.packsOpened >= 1,
  },
  {
    id: 'packs_5',
    name: 'Accroc aux Cartes',
    desc: 'Ouvre 5 boosters',
    emoji: '🎁',
    reward: 3,
    category: 'Collection',
    check: (s) => s.packsOpened >= 5,
    progress: (s) => ({ current: s.packsOpened, max: 5 }),
  },
  {
    id: 'packs_25',
    name: 'Passionné',
    desc: 'Ouvre 25 boosters',
    emoji: '🎰',
    reward: 8,
    category: 'Collection',
    check: (s) => s.packsOpened >= 25,
    progress: (s) => ({ current: s.packsOpened, max: 25 }),
  },
  {
    id: 'packs_50',
    name: 'Ouvreur Expert',
    desc: 'Ouvre 50 boosters',
    emoji: '⚡',
    reward: 12,
    category: 'Collection',
    check: (s) => s.packsOpened >= 50,
    progress: (s) => ({ current: s.packsOpened, max: 50 }),
  },
  {
    id: 'packs_100',
    name: 'Incontrôlable',
    desc: 'Ouvre 100 boosters',
    emoji: '🌀',
    reward: 20,
    category: 'Collection',
    check: (s) => s.packsOpened >= 100,
    progress: (s) => ({ current: s.packsOpened, max: 100 }),
  },
  {
    id: 'packs_250',
    name: 'Dévoreur de Boosters',
    desc: 'Ouvre 250 boosters',
    emoji: '☄️',
    reward: 40,
    category: 'Collection',
    check: (s) => s.packsOpened >= 250,
    progress: (s) => ({ current: s.packsOpened, max: 250 }),
  },

  // ── 2. CARTES UNIQUES ──
  {
    id: 'cards_10',
    name: 'Débutant',
    desc: 'Obtiens 10 cartes uniques',
    emoji: '🃏',
    reward: 3,
    category: 'Collection',
    check: (s) => s.uniqueCards >= 10,
    progress: (s) => ({ current: s.uniqueCards, max: 10 }),
  },
  {
    id: 'cards_50',
    name: 'Collectionneur',
    desc: 'Obtiens 50 cartes uniques',
    emoji: '📚',
    reward: 8,
    category: 'Collection',
    check: (s) => s.uniqueCards >= 50,
    progress: (s) => ({ current: s.uniqueCards, max: 50 }),
  },
  {
    id: 'cards_100',
    name: 'Grand Collectionneur',
    desc: 'Obtiens 100 cartes uniques',
    emoji: '🏛️',
    reward: 15,
    category: 'Collection',
    check: (s) => s.uniqueCards >= 100,
    progress: (s) => ({ current: s.uniqueCards, max: 100 }),
  },
  {
    id: 'cards_200',
    name: 'Collectionneur Émérite',
    desc: 'Obtiens 200 cartes uniques',
    emoji: '🌟',
    reward: 25,
    category: 'Collection',
    check: (s) => s.uniqueCards >= 200,
    progress: (s) => ({ current: s.uniqueCards, max: 200 }),
  },
  {
    id: 'cards_500',
    name: 'L\'Archiviste Suprême',
    desc: 'Obtiens 500 cartes uniques',
    emoji: '🔮',
    reward: 50,
    category: 'Collection',
    check: (s) => s.uniqueCards >= 500,
    progress: (s) => ({ current: s.uniqueCards, max: 500 }),
  },

  // ── 3. RARETÉS ET HAUTS RANGS ──
  {
    id: 'first_rare',
    name: 'Chasse aux Rares',
    desc: 'Obtiens ta première carte Rare Saphir',
    emoji: '💙',
    reward: 2,
    category: 'Rareté',
    check: (s) => (s.rarityCount?.RARE || 0) >= 1,
  },
  {
    id: 'rares_10',
    name: 'Arsenal Saphir',
    desc: 'Possède 10 cartes Rares Saphir',
    emoji: '💎',
    reward: 6,
    category: 'Rareté',
    check: (s) => (s.rarityCount?.RARE || 0) >= 10,
    progress: (s) => ({ current: s.rarityCount?.RARE || 0, max: 10 }),
  },
  {
    id: 'first_ultra',
    name: 'Holographique !',
    desc: 'Obtiens ta première Ultra Rare Diamant',
    emoji: '💜',
    reward: 5,
    category: 'Rareté',
    check: (s) => (s.rarityCount?.ULTRA_RARE || 0) >= 1,
  },
  {
    id: 'ultras_5',
    name: 'Aura Cosmique',
    desc: 'Possède 5 cartes Ultra Rares Diamant',
    emoji: '✨',
    reward: 12,
    category: 'Rareté',
    check: (s) => (s.rarityCount?.ULTRA_RARE || 0) >= 5,
    progress: (s) => ({ current: s.rarityCount?.ULTRA_RARE || 0, max: 5 }),
  },
  {
    id: 'first_mythic',
    name: 'Légendaire !',
    desc: 'Obtiens ta première carte Mythique Prisme Noir',
    emoji: '⭐',
    reward: 15,
    category: 'Rareté',
    check: (s) => (s.rarityCount?.MYTHIQUE || 0) >= 1,
  },
  {
    id: 'mythics_3',
    name: 'Chasseur de Mythiques',
    desc: 'Possède 3 cartes Mythiques uniques',
    emoji: '👑',
    reward: 15,
    category: 'Rareté',
    check: (s) => (s.rarityCount?.MYTHIQUE || 0) >= 3,
    progress: (s) => ({ current: s.rarityCount?.MYTHIQUE || 0, max: 3 }),
  },
  {
    id: 'mythics_5',
    name: 'Constellation d\'Or',
    desc: 'Possède 5 cartes Mythiques uniques',
    emoji: '🌌',
    reward: 25,
    category: 'Rareté',
    check: (s) => (s.rarityCount?.MYTHIQUE || 0) >= 5,
    progress: (s) => ({ current: s.rarityCount?.MYTHIQUE || 0, max: 5 }),
  },
  {
    id: 'mythics_10',
    name: 'Panthéon Absolu',
    desc: 'Possède 10 cartes Mythiques uniques',
    emoji: '🏆',
    reward: 50,
    category: 'Rareté',
    check: (s) => (s.rarityCount?.MYTHIQUE || 0) >= 10,
    progress: (s) => ({ current: s.rarityCount?.MYTHIQUE || 0, max: 10 }),
  },

  // ── 4. FIDÉLITÉ & CONNEXION ──
  {
    id: 'streak_3',
    name: 'Fidèle',
    desc: 'Connecte-toi 3 jours de suite',
    emoji: '📅',
    reward: 5,
    category: 'Connexion',
    check: (s) => s.loginStreak >= 3,
    progress: (s) => ({ current: s.loginStreak, max: 3 }),
  },
  {
    id: 'streak_7',
    name: 'Assidu',
    desc: 'Connecte-toi 7 jours de suite',
    emoji: '🔥',
    reward: 15,
    category: 'Connexion',
    check: (s) => s.loginStreak >= 7,
    progress: (s) => ({ current: s.loginStreak, max: 7 }),
  },
  {
    id: 'streak_14',
    name: 'Fidélité d\'Acier',
    desc: 'Connecte-toi 14 jours de suite',
    emoji: '🛡️',
    reward: 25,
    category: 'Connexion',
    check: (s) => s.loginStreak >= 14,
    progress: (s) => ({ current: s.loginStreak, max: 14 }),
  },
  {
    id: 'streak_30',
    name: 'Légende Quotidienne',
    desc: 'Connecte-toi 30 jours de suite',
    emoji: '🎖️',
    reward: 50,
    category: 'Connexion',
    check: (s) => s.loginStreak >= 30,
    progress: (s) => ({ current: s.loginStreak, max: 30 }),
  },

  // ── 5. ÉCONOMIE & TUBECOINS ──
  {
    id: 'rich',
    name: 'Portefeuille Rempli',
    desc: 'Possède 50 TubeCoins en même temps',
    emoji: '💰',
    reward: 5,
    category: 'Économie',
    check: (s) => s.coins >= 50,
    progress: (s) => ({ current: s.coins, max: 50 }),
  },
  {
    id: 'coins_100',
    name: 'Banquier du Web',
    desc: 'Possède 100 TubeCoins en même temps',
    emoji: '🏦',
    reward: 12,
    category: 'Économie',
    check: (s) => s.coins >= 100,
    progress: (s) => ({ current: s.coins, max: 100 }),
  },
  {
    id: 'coins_250',
    name: 'Magnat de YouTube',
    desc: 'Possède 250 TubeCoins en même temps',
    emoji: '🪙',
    reward: 30,
    category: 'Économie',
    check: (s) => s.coins >= 250,
    progress: (s) => ({ current: s.coins, max: 250 }),
  },

  // ── 6. SPÉCIALITÉS DE BOOSTER ──
  {
    id: 'decouverte_open',
    name: 'Premier Pas',
    desc: 'Ouvre un Pack Découverte',
    emoji: '📦',
    reward: 2,
    category: 'Boutique',
    check: (s) => (s.boostersOpened?.decouverte || 0) >= 1,
  },
  {
    id: 'gaming_open',
    name: 'Gamer Invétéré',
    desc: 'Ouvre un Booster Gaming & Défis',
    emoji: '🎮',
    reward: 4,
    category: 'Boutique',
    check: (s) => (s.boostersOpened?.gaming || 0) >= 1,
  },
  {
    id: 'culture_open',
    name: 'Curieux Insatiable',
    desc: 'Ouvre un Booster Savoir & Récit',
    emoji: '💡',
    reward: 4,
    category: 'Boutique',
    check: (s) => (s.boostersOpened?.culture || 0) >= 1,
  },
  {
    id: 'viral_open',
    name: 'Chasseur de Buzz',
    desc: 'Ouvre un Booster Viral & Tendances',
    emoji: '🔥',
    reward: 6,
    category: 'Boutique',
    check: (s) => (s.boostersOpened?.viral || 0) >= 1,
  },
  {
    id: 'collector_open',
    name: 'L\'Élite Zénith',
    desc: 'Ouvre un Pack Zénith Noir & Or',
    emoji: '👑',
    reward: 10,
    category: 'Boutique',
    check: (s) => (s.boostersOpened?.collector || 0) >= 1,
  },

  // ── 7. BADGES DE CRÉATEURS ──
  {
    id: 'badge_1',
    name: 'Premier Médaillon',
    desc: 'Complète ta 1ère collection de chaîne',
    emoji: '🏅',
    reward: 5,
    category: 'Badges',
    check: (s) => (s.badgesEarned || 0) >= 1,
  },
  {
    id: 'badge_5',
    name: 'Fan Invétéré',
    desc: 'Obtiens 5 badges de chaînes',
    emoji: '⭐',
    reward: 10,
    category: 'Badges',
    check: (s) => (s.badgesEarned || 0) >= 5,
    progress: (s) => ({ current: s.badgesEarned || 0, max: 5 }),
  },
  {
    id: 'badge_10',
    name: 'Grand Fan',
    desc: 'Obtiens 10 badges de chaînes',
    emoji: '🌟',
    reward: 20,
    category: 'Badges',
    check: (s) => (s.badgesEarned || 0) >= 10,
    progress: (s) => ({ current: s.badgesEarned || 0, max: 10 }),
  },
  {
    id: 'badge_25',
    name: 'Complétiste',
    desc: 'Obtiens 25 badges de chaînes',
    emoji: '🏆',
    reward: 35,
    category: 'Badges',
    check: (s) => (s.badgesEarned || 0) >= 25,
    progress: (s) => ({ current: s.badgesEarned || 0, max: 25 }),
  },
  {
    id: 'badge_50',
    name: 'Maître Absolu de YouTube',
    desc: 'Obtiens 50 badges de chaînes',
    emoji: '🎖️',
    reward: 75,
    category: 'Badges',
    check: (s) => (s.badgesEarned || 0) >= 50,
    progress: (s) => ({ current: s.badgesEarned || 0, max: 50 }),
  },
];

/**
 * Check which achievements are newly unlocked.
 * @param {object} stats - Current stats snapshot
 * @param {object} alreadyUnlocked - Map of already unlocked achievement IDs
 * @returns {Array} Newly unlocked achievement objects
 */
export function checkNewAchievements(stats, alreadyUnlocked = {}) {
  return ACHIEVEMENTS.filter((a) => !alreadyUnlocked[a.id] && a.check(stats));
}

/**
 * Compute total coins reward for a list of achievements.
 */
export function computeReward(achievements) {
  return achievements.reduce((sum, a) => sum + (a.reward || 0), 0);
}

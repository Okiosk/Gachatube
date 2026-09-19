/**
 * Combat Engine & AI logic for GachaTube TCG Arena
 */

// AI Difficulties & Profiles
export const AI_DIFFICULTIES = [
  {
    id: 'easy',
    name: 'Apprenti Tipeee',
    title: 'Débutant • Créateur en herbe',
    emoji: '🥉',
    avatar: '🌱',
    reward: 1,
    rarityTarget: 'COMMUNE',
    description: 'Une IA débutante avec des cartes Communes faciles à contrer.',
    borderAccent: '#94a3b8',
    bgGradient: 'from-slate-900 to-slate-800',
  },
  {
    id: 'medium',
    name: 'Monteur Rythmé',
    title: 'Intermédiaire • Spécialiste du Cut',
    emoji: '🥈',
    avatar: '🎬',
    reward: 3,
    rarityTarget: 'PEU_COMMUNE',
    description: 'Une équipe de cartes dynamiques avec de bonnes attaques tactiques.',
    borderAccent: '#34d399',
    bgGradient: 'from-emerald-950 to-slate-900',
  },
  {
    id: 'hard',
    name: 'L\'Algorithme YouTube',
    title: 'Expert • Intelligence Prédictive',
    emoji: '🥇',
    avatar: '🤖',
    reward: 7,
    rarityTarget: 'RARE',
    description: 'L\'algorithme analyse tes faiblesses avec des cartes Rares et Holos.',
    borderAccent: '#38bdf8',
    bgGradient: 'from-sky-950 to-slate-900',
  },
  {
    id: 'boss',
    name: 'Le Boss des Tendances',
    title: 'Légendaire • Sommet de YouTube France',
    emoji: '👑',
    avatar: '🔥',
    reward: 15,
    rarityTarget: 'MYTHIQUE',
    description: 'Le maître suprême armé des vidéos les plus mythiques de l\'histoire !',
    borderAccent: '#f59e0b',
    bgGradient: 'from-amber-950 via-red-950 to-slate-950',
  },
];

// Special moves definitions based on rarity
export const ULTIMATE_MOVES = {
  COMMUNE: {
    name: 'Upload Régulier',
    desc: 'Inflige de lourds dégâts grâce à la régularité des sorties.',
    multiplier: 1.45,
    type: 'DAMAGE',
  },
  PEU_COMMUNE: {
    name: 'Miniature Putaclic',
    desc: 'Inflige des dégâts et étourdit la carte adverse pour 1 tour.',
    multiplier: 1.6,
    type: 'STUN',
  },
  RARE: {
    name: 'Feat Légendaire',
    desc: 'Attaque perçante ignorant 50% de la DEF et soigne 25% de ses PV max.',
    multiplier: 1.8,
    type: 'HEAL_PIERCE',
  },
  ULTRA_RARE: {
    name: 'Trending Mondial #1',
    desc: 'Coup dévastateur et recharge immédiatement 1 point de Buzz.',
    multiplier: 2.1,
    type: 'BUZZ_REFUND',
  },
  MYTHIQUE: {
    name: 'Masterclass Historique',
    desc: 'Coup viral titanesque brisant toute garde adverse.',
    multiplier: 2.5,
    type: 'NUKE',
  },
};

/**
 * Derive clean combat stats from card attributes
 */
export function createCombatCard(card, isPlayer = true, index = 0) {
  if (!card) return null;

  const views = Number(card.views) || 10000;
  const likes = Number(card.likes) || 1000;
  const comments = Number(card.comments) || 100;
  const rarity = card.rarity || 'COMMUNE';

  // Logarithmic base scaling to keep HP and ATK readable and balanced
  const maxHp = Math.round(280 + Math.log10(Math.max(views, 1000)) * 55);
  const atk = Math.round(55 + Math.log10(Math.max(likes, 100)) * 24);
  const def = Math.round(12 + Math.log10(Math.max(comments, 10)) * 10);

  const ultimate = ULTIMATE_MOVES[rarity] || ULTIMATE_MOVES.COMMUNE;

  return {
    id: `${isPlayer ? 'player' : 'ai'}-${card.id || card.video_id}-${index}-${Date.now()}`,
    baseCard: card,
    name: card.title || 'Vidéo Inconnue',
    channel: card.channel || 'Créateur',
    rarity: rarity,
    thumbnailUrl: card.thumbnail_url || `https://img.youtube.com/vi/${card.video_id}/hqdefault.jpg`,
    maxHp,
    hp: maxHp,
    atk,
    def,
    buzz: 0,
    maxBuzz: 3,
    isStunned: false,
    isShielded: false,
    isPlayer,
    ultimate,
  };
}

/**
 * Calculate damage for a standard attack
 */
export function calculateAttackDamage(attacker, defender) {
  const baseDamage = attacker.atk;
  const effectiveDef = defender.isShielded ? defender.def * 2.2 : defender.def;
  
  // Base formula: ATK minus a portion of DEF, with slight random variance (+- 10%)
  const variance = 0.9 + Math.random() * 0.2;
  const rawDamage = Math.max(20, (baseDamage - effectiveDef * 0.45) * variance);

  // Critical hit roll: 15% chance for 1.5x damage
  const isCrit = Math.random() < 0.15;
  const damage = Math.round(isCrit ? rawDamage * 1.5 : rawDamage);

  return {
    damage,
    isCrit,
    absorbed: defender.isShielded,
  };
}

/**
 * Execute an ultimate move
 */
export function calculateUltimateDamage(attacker, defender) {
  const ult = attacker.ultimate || ULTIMATE_MOVES.COMMUNE;
  let effectiveDef = defender.def * 0.4;

  if (ult.type === 'HEAL_PIERCE' || ult.type === 'NUKE') {
    effectiveDef = 0; // ignores defense
  }

  const rawDamage = Math.max(50, (attacker.atk * ult.multiplier - effectiveDef));
  const damage = Math.round(rawDamage * (0.95 + Math.random() * 0.15));

  let healAmount = 0;
  let applyStun = false;
  let buzzRefund = 0;

  if (ult.type === 'HEAL_PIERCE') {
    healAmount = Math.round(attacker.maxHp * 0.25);
  } else if (ult.type === 'STUN') {
    applyStun = true;
  } else if (ult.type === 'BUZZ_REFUND') {
    buzzRefund = 1;
  }

  return {
    damage,
    healAmount,
    applyStun,
    buzzRefund,
    ultName: ult.name,
    ultDesc: ult.desc,
  };
}

/**
 * Generate an AI team based on selected difficulty using available pool or fallback data
 */
export function generateAiTeam(difficultyId, allAvailableCards = []) {
  const diff = AI_DIFFICULTIES.find(d => d.id === difficultyId) || AI_DIFFICULTIES[0];

  // If we have cards passed from DB/API, filter by appropriate rarity
  let pool = [];
  if (allAvailableCards.length > 0) {
    if (diff.id === 'easy') {
      pool = allAvailableCards.filter(c => c.rarity === 'COMMUNE' || c.rarity === 'PEU_COMMUNE');
    } else if (diff.id === 'medium') {
      pool = allAvailableCards.filter(c => c.rarity === 'PEU_COMMUNE' || c.rarity === 'RARE');
    } else if (diff.id === 'hard') {
      pool = allAvailableCards.filter(c => c.rarity === 'RARE' || c.rarity === 'ULTRA_RARE');
    } else if (diff.id === 'boss') {
      pool = allAvailableCards.filter(c => c.rarity === 'ULTRA_RARE' || c.rarity === 'MYTHIQUE');
    }
  }

  // Fallback to whatever cards are available if pool is too small
  if (pool.length < 3) {
    pool = allAvailableCards.length >= 3 ? allAvailableCards : FALLBACK_AI_CARDS;
  }

  // Shuffle and pick 3 cards
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selectedCards = shuffled.slice(0, 3);

  return selectedCards.map((c, i) => createCombatCard(c, false, i));
}

/**
 * Simple AI turn decision
 * Chooses: 'ULTIMATE' (if buzz=3), 'DEFEND' (if low HP), 'ATTACK', or 'SWITCH'
 */
export function decideAiAction(aiActiveCard, aiBench, playerActiveCard) {
  // If stunned, cannot act
  if (aiActiveCard.isStunned) {
    return { type: 'STUNNED' };
  }

  // 1. If Buzz is at max, 85% chance to unleash Ultimate
  if (aiActiveCard.buzz >= aiActiveCard.maxBuzz) {
    if (Math.random() < 0.9) {
      return { type: 'ULTIMATE' };
    }
  }

  // 2. If HP is critically low (< 22%) and bench has healthy card, 45% chance to switch or defend
  const hpPercent = (aiActiveCard.hp / aiActiveCard.maxHp) * 100;
  const aliveBench = aiBench.filter(c => c.hp > 0);

  if (hpPercent < 25 && aliveBench.length > 0 && Math.random() < 0.45) {
    // Pick the healthiest bench card
    const bestBench = [...aliveBench].sort((a, b) => b.hp - a.hp)[0];
    return { type: 'SWITCH', targetId: bestBench.id };
  }

  // 3. 25% chance to defend if not already shielded and player has high buzz
  if (!aiActiveCard.isShielded && playerActiveCard.buzz >= 2 && Math.random() < 0.35) {
    return { type: 'DEFEND' };
  }

  // Default: Attack!
  return { type: 'ATTACK' };
}

// Emergency fallback cards if DB cards haven't loaded yet
export const FALLBACK_AI_CARDS = [
  {
    id: 9991,
    title: 'KAIZEN : 1 an pour gravir l\'Everest !',
    channel: 'Inoxtag',
    views: 45000000,
    likes: 2200000,
    comments: 85000,
    rarity: 'MYTHIQUE',
    thumbnail_url: 'https://img.youtube.com/vi/wrFsapf0Enk/hqdefault.jpg',
  },
  {
    id: 9992,
    title: 'MISTER V - RAP VS RÉALITÉ 2',
    channel: 'Mister V',
    views: 44000000,
    likes: 1800000,
    comments: 65000,
    rarity: 'MYTHIQUE',
    thumbnail_url: 'https://img.youtube.com/vi/OSmSNK7Rano/hqdefault.jpg',
  },
  {
    id: 9993,
    title: 'QUI EST L\'IMPOSTEUR ? (ft Eric & Ramzy)',
    channel: 'Squeezie',
    views: 22000000,
    likes: 950000,
    comments: 28000,
    rarity: 'ULTRA_RARE',
    thumbnail_url: 'https://img.youtube.com/vi/lbLj5Yb6SAE/hqdefault.jpg',
  },
  {
    id: 9994,
    title: 'On teste les PIRES objets de Wish !',
    channel: 'Joyca',
    views: 8500000,
    likes: 420000,
    comments: 12000,
    rarity: 'RARE',
    thumbnail_url: 'https://img.youtube.com/vi/vRAPfDSmBGM/hqdefault.jpg',
  },
];

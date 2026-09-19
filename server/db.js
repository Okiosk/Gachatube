import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'youtube_france_10000.db');

export const db = new DatabaseSync(dbPath);

// Initialize schema with UNIQUE video_id and harvest_state table
db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    channel TEXT NOT NULL,
    views INTEGER NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    thumbnail_url TEXT NOT NULL,
    rarity TEXT NOT NULL DEFAULT 'COMMUNE',
    category TEXT NOT NULL DEFAULT 'Général',
    score REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS harvest_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS channels_metadata (
    channel TEXT PRIMARY KEY,
    channel_url TEXT,
    avatar_url TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    handle TEXT,
    channel_url TEXT,
    avatar_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_channels_name ON channels (name);
  CREATE INDEX IF NOT EXISTS idx_videos_rarity ON videos (rarity);
  CREATE INDEX IF NOT EXISTS idx_videos_views ON videos (views DESC);
  CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos (channel);
  CREATE INDEX IF NOT EXISTS idx_videos_score ON videos (score DESC);
`);

/**
 * Get count of real videos in the database
 */
export function getTotalVideosCount() {
  const row = db.prepare('SELECT count(*) as count FROM videos').get();
  return row ? row.count : 0;
}

/**
 * Get state value from harvest_state
 */
export function getHarvestState(key, defaultValue = null) {
  const row = db.prepare('SELECT value FROM harvest_state WHERE key = ?').get(key);
  return row ? row.value : defaultValue;
}

/**
 * Set state value in harvest_state
 */
export function setHarvestState(key, value) {
  db.prepare(`
    INSERT INTO harvest_state (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, String(value));
}

/**
 * Recalculate rarities dynamically across all real videos in the database
 * Strict percentile tiers:
 * - Top 1% (min 1): MYTHIQUE
 * - Next 5%: ULTRA_RARE
 * - Next 15%: RARE
 * - Next 30%: PEU_COMMUNE
 * - Remaining: COMMUNE
 */
export function recalculateRarities() {
  const total = getTotalVideosCount();
  if (total === 0) return;

  const rows = db.prepare('SELECT id, views, likes, comments FROM videos ORDER BY (views + likes * 25 + comments * 100) DESC').all();

  const mythicCutoff = Math.max(1, Math.floor(total * 0.01));
  const ultraCutoff = Math.max(mythicCutoff + 1, Math.floor(total * 0.06));
  const rareCutoff = Math.max(ultraCutoff + 1, Math.floor(total * 0.21));
  const uncommonCutoff = Math.max(rareCutoff + 1, Math.floor(total * 0.51));

  const updateStmt = db.prepare('UPDATE videos SET rarity = ?, score = ? WHERE id = ?');

  db.exec('BEGIN TRANSACTION;');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const score = row.views + (row.likes * 25) + (row.comments * 100);
    let rarity = 'COMMUNE';

    if (i < mythicCutoff) {
      rarity = 'MYTHIQUE';
    } else if (i < ultraCutoff) {
      rarity = 'ULTRA_RARE';
    } else if (i < rareCutoff) {
      rarity = 'RARE';
    } else if (i < uncommonCutoff) {
      rarity = 'PEU_COMMUNE';
    }

    updateStmt.run(rarity, score, row.id);
  }
  db.exec('COMMIT;');
}

/**
 * Open a 10-card booster pack from real videos
 * Adapts gracefully whether there are 10, 100, 1,000 or 10,000 real videos
 */
export function drawBoosterPack() {
  const total = getTotalVideosCount();
  if (total === 0) {
    return { isGodPack: false, cards: [] };
  }

  // If we have fewer than 10 videos total, take whatever is available
  if (total < 10) {
    const cards = db.prepare('SELECT * FROM videos ORDER BY RANDOM() LIMIT ?').all(total);
    return { isGodPack: false, cards };
  }

  // Attempt standard distribution
  const commons = db.prepare(`SELECT * FROM videos WHERE rarity = 'COMMUNE' ORDER BY RANDOM() LIMIT 6`).all();
  const uncommons = db.prepare(`SELECT * FROM videos WHERE rarity = 'PEU_COMMUNE' ORDER BY RANDOM() LIMIT 2`).all();
  let rare = db.prepare(`SELECT * FROM videos WHERE rarity = 'RARE' ORDER BY RANDOM() LIMIT 1`).get();

  // Climax 10th slot
  const roll = Math.random();
  let specialRarity = 'RARE';
  if (roll < 0.08) {
    specialRarity = 'MYTHIQUE';
  } else if (roll < 0.25) {
    specialRarity = 'ULTRA_RARE';
  }

  let special = db.prepare(`SELECT * FROM videos WHERE rarity = ? ORDER BY RANDOM() LIMIT 1`).get(specialRarity);
  if (!special) {
    special = db.prepare(`SELECT * FROM videos WHERE rarity IN ('ULTRA_RARE', 'MYTHIQUE', 'RARE') ORDER BY RANDOM() LIMIT 1`).get();
  }
  if (!rare) {
    rare = db.prepare(`SELECT * FROM videos ORDER BY RANDOM() LIMIT 1`).get();
  }

  let pack = [...commons, ...uncommons, rare, special].filter(Boolean);

  // If any slot was empty (e.g. not enough cards of a specific rarity yet), fill up to 10 with random real cards
  if (pack.length < 10) {
    const existingIds = pack.map(c => c.id).join(',');
    const remainingCount = 10 - pack.length;
    const fillers = db.prepare(`SELECT * FROM videos ${existingIds ? `WHERE id NOT IN (${existingIds})` : ''} ORDER BY RANDOM() LIMIT ?`).all(remainingCount);
    pack = [...pack, ...fillers];
  }

  return {
    isGodPack: false,
    cards: pack.slice(0, 10)
  };
}

const BOOSTER_SERVER_CONFIG = {
  decouverte: { cardCount: 5, tier: 1 },
  gaming:     { cardCount: 5, tier: 2, categories: ['Gaming', 'Humour', 'Divertissement'] },
  viral:      { cardCount: 5, tier: 3 },
  premium:    { cardCount: 5, tier: 3 },

  standard:   { cardCount: 7, tier: 1 },
  culture:    { cardCount: 7, tier: 2, categories: ['Savoir', 'Storytelling', 'Culte', 'Actualités'] },
  collector:  { cardCount: 7, tier: 3 },
  mythic:     { cardCount: 7, tier: 3 },
};

function rollRarityForTier(tier) {
  const roll = Math.random() * 100;
  if (tier === 1) {
    if (roll < 0.2) return 'MYTHIQUE';
    if (roll < 2.0) return 'ULTRA_RARE';
    if (roll < 8.0) return 'RARE';
    if (roll < 32.0) return 'PEU_COMMUNE';
    return 'COMMUNE';
  } else if (tier === 2) {
    if (roll < 1.5) return 'MYTHIQUE';
    if (roll < 7.0) return 'ULTRA_RARE';
    if (roll < 22.0) return 'RARE';
    if (roll < 55.0) return 'PEU_COMMUNE';
    return 'COMMUNE';
  } else {
    // tier === 3
    if (roll < 5.0) return 'MYTHIQUE';
    if (roll < 19.0) return 'ULTRA_RARE';
    if (roll < 45.0) return 'RARE';
    if (roll < 80.0) return 'PEU_COMMUNE';
    return 'COMMUNE';
  }
}

/**
 * Open a booster pack by type — supports two trios (5 cards & 7 cards) with increasing probability tiers
 * @param {'decouverte'|'standard'|'viral'|'gaming'|'culture'|'collector'|'premium'|'mythic'} type
 */
export function drawBoosterPackByType(type = 'standard') {
  const cfg = BOOSTER_SERVER_CONFIG[type] || BOOSTER_SERVER_CONFIG.standard;
  const targetCount = cfg.cardCount;
  const tier = cfg.tier;

  const total = getTotalVideosCount();
  if (total === 0) return { isGodPack: false, cards: [] };

  if (total < targetCount) {
    const cards = db.prepare('SELECT * FROM videos ORDER BY RANDOM() LIMIT ?').all(total);
    return { isGodPack: false, cards };
  }

  const pack = [];
  const pickedIds = new Set();

  for (let i = 0; i < targetCount; i++) {
    const rarity = rollRarityForTier(tier);
    let card = null;

    const notInClause = pickedIds.size > 0 
      ? `AND id NOT IN (${Array.from(pickedIds).join(',')})` 
      : '';

    // Thematic boost if category specified
    if (cfg.categories && cfg.categories.length > 0) {
      const placeholders = cfg.categories.map(() => '?').join(',');
      card = db.prepare(`
        SELECT * FROM videos 
        WHERE rarity = ? AND category IN (${placeholders}) ${notInClause}
        ORDER BY RANDOM() LIMIT 1
      `).get(rarity, ...cfg.categories);
    }

    // Standard draw by rolled rarity
    if (!card) {
      card = db.prepare(`
        SELECT * FROM videos 
        WHERE rarity = ? ${notInClause}
        ORDER BY RANDOM() LIMIT 1
      `).get(rarity);
    }

    // Fallback to any remaining unpicked card
    if (!card) {
      card = db.prepare(`
        SELECT * FROM videos 
        WHERE 1=1 ${notInClause}
        ORDER BY RANDOM() LIMIT 1
      `).get();
    }

    if (card) {
      pickedIds.add(card.id);
      pack.push(card);
    }
  }

  return { isGodPack: false, cards: pack };
}


/**
 * Get paginated list of cards with search & filters
 */
export function getCards({ page = 1, limit = 24, search = '', channel = '', rarity = '', category = '', sortBy = 'views', sortOrder = 'desc' }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search && search.trim()) {
    conditions.push('(title LIKE ? OR channel LIKE ?)');
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  if (channel && channel !== 'ALL') {
    conditions.push('channel = ?');
    params.push(channel);
  }

  if (rarity && rarity !== 'ALL') {
    conditions.push('rarity = ?');
    params.push(rarity);
  }

  if (category && category !== 'ALL') {
    conditions.push('category = ?');
    params.push(category);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const validSortColumns = ['views', 'likes', 'comments', 'score', 'title', 'id'];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'views';
  const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const countQuery = `SELECT count(*) as total FROM videos ${whereClause}`;
  const totalRow = db.prepare(countQuery).get(...params);
  const total = totalRow ? totalRow.total : 0;

  const dataQuery = `SELECT * FROM videos ${whereClause} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
  const cards = db.prepare(dataQuery).all(...params, limit, offset);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.max(1, Math.ceil(total / limit)),
    cards
  };
}

/**
 * Get card by ID
 */
export function getCardById(id) {
  return db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
}

/**
 * Get global database statistics
 */
export function getStats() {
  const total = getTotalVideosCount();
  const rarityRows = db.prepare(`SELECT rarity, count(*) as count FROM videos GROUP BY rarity`).all();
  const topChannels = db.prepare(`SELECT channel, count(*) as video_count, sum(views) as total_views FROM videos GROUP BY channel ORDER BY total_views DESC LIMIT 15`).all();
  const mostViewed = db.prepare(`SELECT * FROM videos ORDER BY views DESC LIMIT 5`).all();
  const lastHarvest = getHarvestState('last_harvest_time', 'Jamais');

  const rarityStats = {
    COMMUNE: 0,
    PEU_COMMUNE: 0,
    RARE: 0,
    ULTRA_RARE: 0,
    MYTHIQUE: 0
  };
  for (const r of rarityRows) {
    rarityStats[r.rarity] = r.count;
  }

  return {
    totalVideos: total,
    rarityStats,
    topChannels,
    mostViewed,
    lastHarvest
  };
}

/**
 * Save or update channel metadata (URL and avatar)
 */
export function saveChannelMetadata(channel, channelUrl, avatarUrl) {
  if (!channel) return;
  db.prepare(`
    INSERT INTO channels_metadata (channel, channel_url, avatar_url, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(channel) DO UPDATE SET
      channel_url = COALESCE(excluded.channel_url, channels_metadata.channel_url),
      avatar_url = COALESCE(excluded.avatar_url, channels_metadata.avatar_url),
      updated_at = CURRENT_TIMESTAMP
  `).run(channel, channelUrl || null, avatarUrl || null);
}

/**
 * Get all unique channels with metadata (avatar, channel URL, count)
 */
export function getChannelsList() {
  return db.prepare(`
    SELECT 
      COALESCE(c.name, v.channel) as channel, 
      COUNT(v.id) as count,
      COALESCE(c.channel_url, m.channel_url) as channel_url,
      COALESCE(c.avatar_url, m.avatar_url) as avatar_url
    FROM channels c
    LEFT JOIN videos v ON v.channel = c.name
    LEFT JOIN channels_metadata m ON m.channel = c.name
    GROUP BY c.name
    ORDER BY count DESC, c.name ASC
  `).all();
}

/**
 * Wipe all data from videos table
 */
export function wipeAllVideos() {
  db.exec('DELETE FROM videos;');
  db.exec('DELETE FROM harvest_state;');
  console.log('🧹 Base de données vidéos entièrement purgée.');
}

// ─────────────────────────────────────────────────────────────────────────────
// 30 INITIAL FAMOUS FRENCH YOUTUBE CHANNELS (VERIFIED LINKS & AVATARS)
// ─────────────────────────────────────────────────────────────────────────────
export function slugifyChannel(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_');
}

export const INITIAL_30_CHANNELS = [
  {
    name: 'Squeezie',
    handle: '@Squeezie',
    channel_url: 'https://www.youtube.com/@Squeezie',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_mPZvx-xk6pbAYdC7G8jUZzgCNDDTg1ZfF0_Lwd8UpJT4M=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Tibo InShape',
    handle: '@TiboInShape',
    channel_url: 'https://www.youtube.com/@TiboInShape',
    avatar_url: 'https://yt3.googleusercontent.com/MXKYsX4ryzhIwTLMwBUvx6eoWMcaF-gsHO_PLidZMEKyFj-eKyg9u0IykU8uh7ejCAS9omOlyP8=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Cyprien',
    handle: '@cyprien',
    channel_url: 'https://www.youtube.com/@cyprien',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_kKiE1Vpd2RZMv057AzKdHBtqkL7ksZhZ4Huwfbr9ngUyU=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Norman',
    handle: '@NormanFaitDesVideos',
    channel_url: 'https://www.youtube.com/@NormanFaitDesVideos',
    avatar_url: 'https://yt3.googleusercontent.com/6DAgneBRFbtYqCZRBcw26JpmyKT4CNcU36GZ-OGwOvVbNBkTewuBxmZSnot22FPQecPDxf1LZbc=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Michou',
    handle: '@Michou',
    channel_url: 'https://www.youtube.com/@Michou',
    avatar_url: 'https://yt3.googleusercontent.com/AbT6_C0E4bzscwpKqfdeMg6wTCuo_5pP9lkeqcLBFtqbgJsf8GaRGBAUnf7ZuNwEuiTHA7fI=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Inoxtag',
    handle: '@inoxtag',
    channel_url: 'https://www.youtube.com/@inoxtag',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_nBv_ScBglsYmGLCeX8gG5E7_rC-p9M0I4hQAcEMaHjJa4=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Amixem',
    handle: '@Amixem',
    channel_url: 'https://www.youtube.com/@Amixem',
    avatar_url: 'https://yt3.googleusercontent.com/mkxR4YNTUBJAjuq020488wM8yHSCZ4Kwn0etJyYyGTL86LnEiIzu5uhw8EwmPpRxavKYXyQ4Hmk=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Joyca',
    handle: '@Joyca',
    channel_url: 'https://www.youtube.com/@Joyca',
    avatar_url: 'https://yt3.googleusercontent.com/F5R-8dCR4OsDu1Rs_2RE20e6LUNFDJW6VemSqToit8XvdfoSj1DXJXb0Dc4aT_YEv-5TsFCF=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Mcfly et Carlito',
    handle: '@LeFatShow',
    channel_url: 'https://www.youtube.com/@LeFatShow',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_kSPG3h89eFoHhkLFYl_VQ6OkFpLCfpZUSuIWkRJt0sI-E=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Mister V',
    handle: '@mistervofficial',
    channel_url: 'https://www.youtube.com/@mistervofficial',
    avatar_url: 'https://yt3.googleusercontent.com/9waBvH5yP5jTNSGZ-n9Na5ldf3vnzmFOEjv6PUEuCiaRkfffk50GpF6nkDleoapVrR22Uupm8Lc=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'HugoDécrypte',
    handle: '@hugodecrypteactus',
    channel_url: 'https://www.youtube.com/@hugodecrypteactus',
    avatar_url: 'https://yt3.googleusercontent.com/doPajjcwkXA71S2WCZsvhXSGapCsp46InwN9048iQa327OXZwxXvXJCY3FnGL6BpymL4k9jATA=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Mastu',
    handle: '@Mastu',
    channel_url: 'https://www.youtube.com/@Mastu',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_kcL_PnNz1KEjLIQ7veCTq_0Vv7tktG0oth4M0_NZp8PRw=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Seb la Frite',
    handle: '@SEBFRIT',
    channel_url: 'https://www.youtube.com/@SEBFRIT',
    avatar_url: 'https://yt3.googleusercontent.com/rvhrWfq5r2kSDFm8FWblEvHEaC-sMHFkcO2cci0Dmkp3TIAMXbGXp97nW27orkfv0Qd5auCC1A=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Joueur Du Grenier',
    handle: '@joueurdugrenier',
    channel_url: 'https://www.youtube.com/@joueurdugrenier',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_l5M7wAHM9QledrlSHNomrm8tV-pTAyzUiFtL7iSVFUIA=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Pierre Croce',
    handle: '@pierrecroce',
    channel_url: 'https://www.youtube.com/@pierrecroce',
    avatar_url: 'https://yt3.googleusercontent.com/nITpEppzrNhVmiOCzBsmwQdjzaJ-qJnz4KKwqhbfXgTxdAkKP8ITAz3dlmdIOLPnm4nyxBdbOA=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Wankil Studio',
    handle: '@wankilfr',
    channel_url: 'https://www.youtube.com/@wankilfr',
    avatar_url: 'https://yt3.googleusercontent.com/e8DYeGKwyaDgSc8AUmIvGdGsGU_c-_2ceQCb7qkbZZzZ7R5bppKMpL2vnlaIwS04O1Jx4kzd-Q=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Nota Bene',
    handle: '@notabenemovies',
    channel_url: 'https://www.youtube.com/@notabenemovies',
    avatar_url: 'https://yt3.googleusercontent.com/14yJywmBpZLujps3kbe32_WRi46fZomUBtbnUH4gNh92LMQU0u81K-Y-j433em0AWnBVpP64-Q=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Dr Nozman',
    handle: '@DrNozman',
    channel_url: 'https://www.youtube.com/@DrNozman',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_kP-ty6rj41GP6Sddyux8oU5DJu9DLc9feo1bQq27az7XQ=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Trash',
    handle: '@Trash',
    channel_url: 'https://www.youtube.com/@Trash',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_l5icC2DHPjaDA9XI077SmNdVVavo0Ekac9vKXDO5DqDBo=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Poisson Fécond',
    handle: '@poissonfecond42',
    channel_url: 'https://www.youtube.com/@poissonfecond42',
    avatar_url: 'https://yt3.googleusercontent.com/_Ns0Bzk-GB5brYu7UNGolj6ndKMUI-sRHX-USdQV9vqN9WI5ZPiqHt1P3wtiahqbQsiWIKG4vps=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'ScienceEtonnante',
    handle: '@ScienceEtonnante',
    channel_url: 'https://www.youtube.com/@ScienceEtonnante',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_kzU96H3Lq6fihVVFNWXUEFaidERMvSqyMwn0f455Gi4w=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Feldup',
    handle: '@Feldup',
    channel_url: 'https://www.youtube.com/@Feldup',
    avatar_url: 'https://yt3.googleusercontent.com/ytc/AIdro_lOrU0Hx8dg6T_x4P1cFJC2voEwSILEzXgy3pXg71FmiPg=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'FastGoodCuisine',
    handle: '@FastGoodCuisine',
    channel_url: 'https://www.youtube.com/@FastGoodCuisine',
    avatar_url: 'https://yt3.googleusercontent.com/gHkSCYBk4J1lJp3C0bmoh3GDtMsUnXNZEX9IUBzL9GElxRITRJK5s8rU3DINZjEuP3vluRhYnqY=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Jojol',
    handle: '@jojol',
    channel_url: 'https://www.youtube.com/@jojol',
    avatar_url: 'https://yt3.googleusercontent.com/LynLoLgkMKW3yJ-jx8FwJxAGfPBXnp_RPYJTdkZKag6qhvf68UxGPU1epcREv2o6Kb4YB2178rg=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Sofyan',
    handle: '@sofyan',
    channel_url: 'https://www.youtube.com/@sofyan',
    avatar_url: 'https://yt3.googleusercontent.com/p5MQAaAbMe1lcCNQwqCiswpbmbjfJI2UXqX36ho1QMeb5DCtmWqEYviknT0ORNpZzGvRrVEokw=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'GMK',
    handle: '@gmk01',
    channel_url: 'https://www.youtube.com/@gmk01',
    avatar_url: 'https://yt3.googleusercontent.com/dUPQNmo-biSznsRa11lPuU4LMJIMCfGYspvm0eDwxh0poHr7-0BoLSc0Sx6bvW2LTUk5m1nMWg=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Gotaga',
    handle: '@Gotaga',
    channel_url: 'https://www.youtube.com/@Gotaga',
    avatar_url: 'https://yt3.googleusercontent.com/FQXhwoYYE7tmVnX54Lkp6qDgFbgSpCoTou-yRqcaxwbKRTDEwjpwjH3yFB55nK_p9MinEAvPCm8=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'ZeratoR',
    handle: '@ZeratoR',
    channel_url: 'https://www.youtube.com/@ZeratoR',
    avatar_url: 'https://yt3.googleusercontent.com/0PL7Wid85D5gVRbv2h0FgYrC4H5WPNA0BVya-vmuvz4HuJXgOiB32A7xNXlGulHF7i19WPNpvRs=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Domingo',
    handle: '@pa.domingo',
    channel_url: 'https://www.youtube.com/@pa.domingo',
    avatar_url: 'https://yt3.googleusercontent.com/6ni5eiKLZZKaN8fVy63KsXlV5girNU23Zb-rmFKN8AmOdVCRx9w0iXsX90LFqsRc4UqQJZMl=s176-c-k-c0x00ffffff-no-rj'
  },
  {
    name: 'Natoo',
    handle: '@Natooyt',
    channel_url: 'https://www.youtube.com/@Natooyt',
    avatar_url: 'https://yt3.googleusercontent.com/ZpHD9MhNPhlayZ4wVNTX2r5ovCCDgsaQabX_PithFmRrctUR0mZroFmqaWweOnIqAhdXYFSn2g=s176-c-k-c0x00ffffff-no-rj'
  }
];

export function seedInitialChannels() {
  const countRow = db.prepare('SELECT count(*) as count FROM channels').get();
  if (countRow && countRow.count >= 30) return;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO channels (name, handle, channel_url, avatar_url)
    VALUES (?, ?, ?, ?)
  `);
  db.exec('BEGIN TRANSACTION;');
  for (const ch of INITIAL_30_CHANNELS) {
    insert.run(ch.name, ch.handle || null, ch.channel_url || null, ch.avatar_url || null);
    if (ch.channel_url || ch.avatar_url) {
      saveChannelMetadata(ch.name, ch.channel_url, ch.avatar_url);
    }
  }
  db.exec('COMMIT;');
  console.log('[Database] 30 chaînes YouTube françaises pré-remplies avec avatars vérifiés.');
}

export function wipeAndSeed30Channels() {
  db.exec('DELETE FROM videos;');
  db.exec('DELETE FROM channels;');
  db.exec('DELETE FROM harvest_state;');
  const insert = db.prepare(`
    INSERT INTO channels (name, handle, channel_url, avatar_url)
    VALUES (?, ?, ?, ?)
  `);
  db.exec('BEGIN TRANSACTION;');
  for (const ch of INITIAL_30_CHANNELS) {
    insert.run(ch.name, ch.handle || null, ch.channel_url || null, ch.avatar_url || null);
    if (ch.channel_url || ch.avatar_url) {
      saveChannelMetadata(ch.name, ch.channel_url, ch.avatar_url);
    }
  }
  db.exec('COMMIT;');
  recalculateRarities();
  console.log('[Database] Base réinitialisée : 30 chaînes créées avec avatars et liens vérifiés, vidéos vidées.');
}

// Run initial seed on load
seedInitialChannels();

export function getAdminChannels() {
  return db.prepare(`
    SELECT 
      c.id,
      c.name,
      c.handle,
      c.channel_url,
      c.avatar_url,
      c.created_at,
      COUNT(v.id) as video_count
    FROM channels c
    LEFT JOIN videos v ON v.channel = c.name
    GROUP BY c.id
    ORDER BY c.name COLLATE NOCASE ASC
  `).all();
}

export function addChannel(name, channelUrl = null) {
  const cleanName = (name || '').trim();
  if (!cleanName) throw new Error('Le nom de la chaîne ne peut pas être vide.');
  let handle = null;
  let url = channelUrl;
  if (cleanName.startsWith('@')) {
    handle = cleanName;
    url = `https://www.youtube.com/${cleanName}`;
  } else if (cleanName.startsWith('http')) {
    url = cleanName;
    const match = cleanName.match(/youtube\.com\/(@[^\/\?]+)/);
    if (match) handle = match[1];
  }
  const stmt = db.prepare(`
    INSERT INTO channels (name, handle, channel_url)
    VALUES (?, ?, ?)
  `);
  const info = stmt.run(cleanName, handle, url);
  return { id: info.lastInsertRowid, name: cleanName, handle, channel_url: url, video_count: 0 };
}

export function deleteChannel(id) {
  const channelRow = db.prepare('SELECT name FROM channels WHERE id = ?').get(id);
  if (!channelRow) return false;
  db.prepare('DELETE FROM channels WHERE id = ?').run(id);
  db.prepare('DELETE FROM videos WHERE channel = ?').run(channelRow.name);
  recalculateRarities();
  return true;
}

export function updateChannelMetadata(name, channelUrl, avatarUrl) {
  db.prepare(`
    UPDATE channels 
    SET 
      channel_url = COALESCE(?, channel_url),
      avatar_url = COALESCE(?, avatar_url)
    WHERE name = ?
  `).run(channelUrl || null, avatarUrl || null, name);
  
  saveChannelMetadata(name, channelUrl, avatarUrl);
}

export function getIncompleteChannels(limit = null) {
  const sql = `
    SELECT 
      c.id,
      c.name,
      c.handle,
      c.channel_url,
      c.avatar_url,
      COUNT(v.id) as video_count
    FROM channels c
    LEFT JOIN videos v ON v.channel = c.name
    GROUP BY c.id
    HAVING video_count < 30
    ORDER BY video_count ASC, c.id ASC
    ${limit ? `LIMIT ${parseInt(limit, 10)}` : ''}
  `;
  return db.prepare(sql).all();
}

export function getChannelVideoCount(channelName) {
  const row = db.prepare('SELECT count(*) as cnt FROM videos WHERE channel = ?').get(channelName);
  return row ? row.cnt : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT-SIDE API FALLBACK FOR STATIC HOSTING (GITHUB PAGES)
// ─────────────────────────────────────────────────────────────────────────────
// When running without a Node.js backend (e.g. on GitHub Pages), this module
// intercepts /api/* calls and responds using exported JSON data and client-side
// booster pack simulation.
// ─────────────────────────────────────────────────────────────────────────────

let cachedCards = null;
let cachedChannels = null;
let cachedStats = null;

function getBaseDataPath() {
  if (typeof window === 'undefined') return './data/';
  const path = window.location.pathname;
  if (path.endsWith('/')) {
    return `${path}data/`;
  }
  const dir = path.substring(0, path.lastIndexOf('/') + 1);
  return `${dir}data/`;
}

async function loadData() {
  const dataDir = getBaseDataPath();

  if (!cachedCards) {
    try {
      const res = await window._originalFetch(`${dataDir}cards.json`);
      if (res.ok) {
        cachedCards = await res.json();
      }
    } catch (e) {
      console.warn('Could not load static cards.json', e);
      cachedCards = [];
    }
  }

  if (!cachedChannels) {
    try {
      const res = await window._originalFetch(`${dataDir}channels.json`);
      if (res.ok) {
        cachedChannels = await res.json();
      }
    } catch (e) {
      console.warn('Could not load static channels.json', e);
      cachedChannels = [];
    }
  }

  if (!cachedStats) {
    try {
      const res = await window._originalFetch(`${dataDir}stats.json`);
      if (res.ok) {
        cachedStats = await res.json();
      }
    } catch (e) {
      console.warn('Could not load static stats.json', e);
      cachedStats = null;
    }
  }
}

const BOOSTER_TIER_CONFIG = {
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

function drawBoosterPackClient(type = 'standard') {
  const cfg = BOOSTER_TIER_CONFIG[type] || BOOSTER_TIER_CONFIG.standard;
  const targetCount = cfg.cardCount;
  const tier = cfg.tier;

  const pool = cachedCards || [];
  if (pool.length === 0) return { isGodPack: false, cards: [] };

  const pack = [];
  const pickedIds = new Set();

  for (let i = 0; i < targetCount; i++) {
    const rarity = rollRarityForTier(tier);
    let candidates = pool.filter((c) => !pickedIds.has(c.id));

    // Thematic category filter if applicable
    if (cfg.categories && cfg.categories.length > 0) {
      const thematic = candidates.filter((c) => c.rarity === rarity && cfg.categories.includes(c.category));
      if (thematic.length > 0) {
        const picked = thematic[Math.floor(Math.random() * thematic.length)];
        pickedIds.add(picked.id);
        pack.push(picked);
        continue;
      }
    }

    // Standard draw by rolled rarity
    const byRarity = candidates.filter((c) => c.rarity === rarity);
    if (byRarity.length > 0) {
      const picked = byRarity[Math.floor(Math.random() * byRarity.length)];
      pickedIds.add(picked.id);
      pack.push(picked);
      continue;
    }

    // Fallback to any remaining unpicked card
    if (candidates.length > 0) {
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      pickedIds.add(picked.id);
      pack.push(picked);
    }
  }

  return {
    isGodPack: false,
    cards: pack,
  };
}

function handleCardsQuery(url) {
  const params = new URL(url, window.location.href).searchParams;
  const page = parseInt(params.get('page') || '1', 10);
  const limit = parseInt(params.get('limit') || '24', 10);
  const search = (params.get('search') || '').trim().toLowerCase();
  const channel = params.get('channel') || '';
  const rarity = params.get('rarity') || '';
  const category = params.get('category') || '';
  const sortBy = params.get('sortBy') || 'views';
  const sortOrder = params.get('sortOrder') || 'desc';

  let list = [...(cachedCards || [])];

  if (search) {
    list = list.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(search)) ||
        (c.channel && c.channel.toLowerCase().includes(search))
    );
  }

  if (channel && channel !== 'ALL') {
    list = list.filter((c) => c.channel === channel);
  }

  if (rarity && rarity !== 'ALL') {
    list = list.filter((c) => c.rarity === rarity);
  }

  if (category && category !== 'ALL') {
    list = list.filter((c) => c.category === category);
  }

  list.sort((a, b) => {
    let va = a[sortBy] ?? 0;
    let vb = b[sortBy] ?? 0;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();

    if (va < vb) return sortOrder === 'asc' ? -1 : 1;
    if (va > vb) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const total = list.length;
  const offset = (page - 1) * limit;
  const paginated = list.slice(offset, offset + limit);

  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    cards: paginated,
  };
}

/**
 * Intercept fetch calls to /api/* and provide static fallback when offline / on GitHub Pages
 */
export function initClientApiFallback() {
  if (typeof window === 'undefined') return;
  if (window._originalFetch) return; // already initialized

  window._originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';

    if (!url.includes('/api/')) {
      return window._originalFetch(input, init);
    }

    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.port === '5173');

    if (isLocalhost) {
      try {
        const response = await window._originalFetch(input, init);
        const contentType = response.headers.get('content-type') || '';

        // If response is valid JSON (backend is running), return it directly!
        if (response.ok && contentType.includes('application/json')) {
          return response;
        }
      } catch (err) {
        // Backend not running — fall through to client mock
      }
    }

    // Ensure static data is loaded
    await loadData();

    // 1. /api/channels
    if (url.includes('/api/channels')) {
      return new Response(JSON.stringify(cachedChannels || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. /api/stats
    if (url.includes('/api/stats')) {
      return new Response(JSON.stringify(cachedStats || {}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. /api/booster/open
    if (url.includes('/api/booster/open')) {
      const parsedUrl = new URL(url, window.location.href);
      const type = parsedUrl.searchParams.get('type') || 'standard';
      const result = drawBoosterPackClient(type);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. /api/cards
    if (url.includes('/api/cards')) {
      const result = handleCardsQuery(url);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Admin endpoints fallback
    if (url.includes('/api/admin/')) {
      return new Response(JSON.stringify({ status: 'ok', message: 'Mode statique GitHub Pages' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generic fallback
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

import { 
  db, 
  setHarvestState, 
  getHarvestState, 
  recalculateRarities, 
  getTotalVideosCount, 
  saveChannelMetadata,
  getIncompleteChannels,
  getChannelVideoCount,
  updateChannelMetadata
} from './db.js';

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Status tracking for Admin UI
let isHarvesting = false;
let shouldStop = false;
let harvestStatus = {
  isHarvesting: false,
  currentChannel: null,
  currentIndex: 0,
  totalChannels: 0,
  addedThisSession: 0,
  logs: [],
  startedAt: null,
  finishedAt: null,
};

export function getHarvesterStatus() {
  return {
    ...harvestStatus,
    isHarvesting,
    totalVideosInDb: getTotalVideosCount(),
    lastHarvestTime: getHarvestState('last_harvest_time', 'Aucune'),
    lastBatchAdded: getHarvestState('last_harvest_batch_added', '0'),
  };
}

export function stopHarvest() {
  if (isHarvesting) {
    shouldStop = true;
    addHarvestLog('Arrêt demandé par l\'utilisateur...');
    return true;
  }
  return false;
}

function addHarvestLog(msg) {
  const time = new Date().toLocaleTimeString('fr-FR');
  const line = `[${time}] ${msg}`;
  console.log(`[Harvester] ${msg}`);
  harvestStatus.logs.push(line);
  if (harvestStatus.logs.length > 200) {
    harvestStatus.logs.shift();
  }
}

/**
 * Parse YouTube view strings into integers
 */
export function extractViews(input) {
  let text = '';
  if (typeof input === 'string') {
    text = input;
  } else if (input && typeof input === 'object') {
    text =
      input.viewText ||
      input?.viewCountText?.simpleText ||
      input?.viewCountText?.runs?.map((r) => r.text).join('') ||
      input?.shortViewCountText?.simpleText ||
      input?.shortViewCountText?.runs?.map((r) => r.text).join('') ||
      '';
  }

  if (!text) return 0;

  const cleaned = text.replace(/[\s\u202f\u00a0]/g, '').replace(/,/g, '.');

  let match = cleaned.match(/([\d\.]+)M/i);
  if (match) return Math.round(parseFloat(match[1]) * 1_000_000);

  match = cleaned.match(/([\d\.]+)k/i);
  if (match) return Math.round(parseFloat(match[1]) * 1_000);

  match = cleaned.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);

  return 0;
}

/**
 * Extract unified video metadata from either videoRenderer or lockupViewModel
 */
export function extractVideoFromItem(item) {
  if (item?.richItemRenderer?.content?.videoRenderer) {
    const vr = item.richItemRenderer.content.videoRenderer;
    return {
      videoId: vr.videoId,
      title: vr.title?.runs?.[0]?.text || '',
      views: extractViews(vr),
      thumbnailUrl: `https://img.youtube.com/vi/${vr.videoId}/hqdefault.jpg`,
    };
  }

  if (item?.richItemRenderer?.content?.lockupViewModel) {
    const lvm = item.richItemRenderer.content.lockupViewModel;
    const videoId = lvm.contentId;
    if (!videoId) return null;

    const meta = lvm.metadata?.lockupMetadataViewModel;
    const title = meta?.title?.content || '';
    const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
    const parts = rows[0]?.metadataParts || [];
    const viewText = parts[0]?.text?.content || '';

    return {
      videoId,
      title,
      views: extractViews(viewText),
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  return null;
}

/**
 * Fetch the channel's own popular-videos page and return raw video objects + apiKey + continuation token
 */
async function fetchChannelPopularVideos(handle) {
  const url = `https://www.youtube.com/${handle}/videos?view=0&sort=p`;
  const res = await fetch(url, {
    headers: {
      ...FETCH_HEADERS,
      'Cookie': 'SOCS=CAESEwgDEgk2ODEzNjY1MjQaAmZyIAEaBgiA_LyaBg;',
    }
  });
  if (res.status === 429) {
    throw Object.assign(new Error('Rate limited par YouTube'), { isRateLimit: true });
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);

  const html = await res.text();

  const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const apiKey = keyMatch ? keyMatch[1] : null;

  const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s);
  if (!match) return { rawVideos: [], continuationToken: null, apiKey, detectedAvatar: null };

  let data;
  try { data = JSON.parse(match[1]); } catch { return { rawVideos: [], continuationToken: null, apiKey, detectedAvatar: null }; }

  const rawVideos = [];
  let continuationToken = null;

  // Extract avatar from channel header or channelMetadata
  let detectedAvatar = null;
  try {
    const header = data?.header?.pageHeaderRenderer || data?.header?.c4TabbedHeaderRenderer;
    const thumbs = header?.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources ||
                   header?.avatar?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources ||
                   header?.avatar?.thumbnails ||
                   data?.metadata?.channelMetadataRenderer?.avatar?.thumbnails || [];
    if (thumbs.length > 0) detectedAvatar = thumbs[thumbs.length - 1].url.replace(/=s\d+-/, '=s176-');
  } catch {}

  // Navigate to the Videos tab content
  try {
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    let videoTab = tabs.find(t => t?.tabRenderer?.selected && t?.tabRenderer?.content?.richGridRenderer);
    if (!videoTab) videoTab = tabs.find(t => t?.tabRenderer?.content?.richGridRenderer);

    const contents = videoTab?.tabRenderer?.content?.richGridRenderer?.contents || [];
    for (const item of contents) {
      const v = extractVideoFromItem(item);
      if (v?.videoId) rawVideos.push(v);

      // Continuation token for pagination
      const contToken = item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      if (contToken) continuationToken = contToken;
    }
  } catch (parseErr) {
    console.warn('[Harvester] Error parsing channel page:', parseErr.message);
  }

  return { rawVideos, continuationToken, apiKey, detectedAvatar };
}

/**
 * Fetch InnerTube continuation for a channel's browse
 */
async function fetchChannelBrowseContinuation(apiKey, token) {
  try {
    const postUrl = `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`;
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...FETCH_HEADERS },
      body: JSON.stringify({
        context: {
          client: { clientName: 'WEB', clientVersion: '2.20240315.00.00', hl: 'fr', gl: 'FR' },
        },
        continuation: token,
      }),
    });

    if (!res.ok) return { rawVideos: [], nextToken: null };
    const data = await res.json();
    const rawVideos = [];
    let nextToken = null;

    const actions = data.onResponseReceivedActions || [];
    for (const a of actions) {
      const items = a.appendContinuationItemsAction?.continuationItems || [];
      for (const item of items) {
        const v = extractVideoFromItem(item);
        if (v?.videoId) rawVideos.push(v);

        const contToken = item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
        if (contToken) nextToken = contToken;
      }
    }
    return { rawVideos, nextToken };
  } catch (err) {
    console.warn('[Harvester] Browse continuation error:', err.message);
    return { rawVideos: [], nextToken: null };
  }
}

/**
 * Harvest up to 30 most viewed videos for a specific YouTube channel
 */
export async function harvestChannelVideos(channel) {
  const channelName = channel.name;
  const handle = channel.handle;
  
  if (!handle) {
    addHarvestLog(`⚠️ "${channelName}" n'a pas de handle YouTube. Ignorée.`);
    return { added: 0, totalForChannel: 0 };
  }

  const currentCount = getChannelVideoCount(channelName);
  const remainingNeeded = 30 - currentCount;

  if (remainingNeeded <= 0) {
    addHarvestLog(`"${channelName}" a déjà 30 vidéos en base. Ignorée.`);
    return { added: 0, totalForChannel: currentCount };
  }

  addHarvestLog(`Collecte pour "${channelName}" (${handle}) [${currentCount}/30]...`);

  // Fetch the channel's popular videos directly from their own page
  let { rawVideos, continuationToken, apiKey, detectedAvatar } = await fetchChannelPopularVideos(handle);

  // Get more via continuation if needed
  if (apiKey && continuationToken && rawVideos.length < 30) {
    await delay(400 + Math.random() * 300);
    const cont = await fetchChannelBrowseContinuation(apiKey, continuationToken);
    rawVideos.push(...cont.rawVideos);
    if (cont.nextToken && rawVideos.length < 30) {
      await delay(400 + Math.random() * 300);
      const cont2 = await fetchChannelBrowseContinuation(apiKey, cont.nextToken);
      rawVideos.push(...cont2.rawVideos);
    }
  }

  // Update avatar if found
  if (detectedAvatar) {
    updateChannelMetadata(channelName, channel.channel_url, detectedAvatar);
  }

  addHarvestLog(`  → ${rawVideos.length} vidéos trouvées sur la page de ${channelName}`);

  // Deduplicate videos
  const seenIds = new Set();
  const toInsert = [];

  for (const vid of rawVideos) {
    if (!vid?.videoId || seenIds.has(vid.videoId)) continue;
    seenIds.add(vid.videoId);
    toInsert.push(vid);
  }

  // Sort by views DESC — most popular first
  toInsert.sort((a, b) => b.views - a.views);

  const insertStmt = db.prepare(`
    INSERT INTO videos (video_id, title, channel, views, likes, comments, thumbnail_url, category, rarity, score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(video_id) DO UPDATE SET
      views = excluded.views,
      score = excluded.score
  `);

  let added = 0;
  for (const vid of toInsert) {
    const currentNow = getChannelVideoCount(channelName);
    if (currentNow >= 30) break;

    const existing = db.prepare('SELECT id FROM videos WHERE video_id = ?').get(vid.videoId);

    const likes = Math.floor(vid.views * (0.035 + Math.random() * 0.020));
    const comments = Math.floor(vid.views * (0.001 + Math.random() * 0.002));
    const score = vid.views + (likes * 25) + (comments * 100);

    insertStmt.run(
      vid.videoId,
      vid.title,
      channelName,
      vid.views,
      likes,
      comments,
      vid.thumbnailUrl,
      'Divertissement',
      'COMMUNE',
      score
    );

    if (!existing) added++;
  }

  const finalCount = getChannelVideoCount(channelName);
  addHarvestLog(`"${channelName}" terminé : +${added} vidéos ajoutées (total : ${finalCount}/30).`);
  return { added, totalForChannel: finalCount };
}

/**
 * Start harvesting a batch of channels (by count or specific channel)
 */
export async function startChannelHarvestBatch({ channelCount = null, channelId = null } = {}) {
  if (isHarvesting) {
    throw new Error('Une collecte est déjà en cours.');
  }

  let targetChannels = [];

  if (channelId) {
    const ch = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);
    if (!ch) throw new Error(`Chaîne avec l'ID ${channelId} introuvable.`);
    targetChannels = [ch];
  } else {
    // Get incomplete channels (< 30 videos)
    const limit = channelCount ? parseInt(channelCount, 10) : null;
    targetChannels = getIncompleteChannels(limit);
  }

  if (targetChannels.length === 0) {
    return {
      success: true,
      message: 'Toutes les chaînes ont déjà atteint leur quota de 30 vidéos.',
      addedTotal: 0,
      totalVideos: getTotalVideosCount(),
    };
  }

  isHarvesting = true;
  shouldStop = false;
  harvestStatus = {
    isHarvesting: true,
    currentChannel: null,
    currentIndex: 0,
    totalChannels: targetChannels.length,
    addedThisSession: 0,
    logs: [],
    startedAt: new Date().toLocaleTimeString('fr-FR'),
    finishedAt: null,
  };

  addHarvestLog(`🚀 Début de la collecte pour ${targetChannels.length} chaîne(s)...`);

  let addedTotal = 0;

  try {
    for (let i = 0; i < targetChannels.length; i++) {
      if (shouldStop) {
        addHarvestLog('🛑 Collecte interrompue par l\'utilisateur.');
        break;
      }

      const ch = targetChannels[i];
      harvestStatus.currentChannel = ch.name;
      harvestStatus.currentIndex = i + 1;

      try {
        const { added } = await harvestChannelVideos(ch);
        addedTotal += added;
        harvestStatus.addedThisSession = addedTotal;
      } catch (err) {
        if (err.isRateLimit) {
          addHarvestLog(`⚠️ Limite de requêtes YouTube atteinte. Pause obligatoire.`);
          break;
        }
        addHarvestLog(`Erreur sur "${ch.name}": ${err.message}`);
      }

      // Friendly throttle between channels (800ms - 1500ms)
      if (i < targetChannels.length - 1 && !shouldStop) {
        await delay(800 + Math.random() * 700);
      }
    }

    addHarvestLog('Recalcul des raretés de toutes les cartes en base...');
    recalculateRarities();

    const totalNow = getTotalVideosCount();
    setHarvestState('last_harvest_time', new Date().toLocaleString('fr-FR'));
    setHarvestState('last_harvest_batch_added', addedTotal);

    addHarvestLog(`✅ Collecte terminée ! +${addedTotal} vidéos ajoutées. Total en base : ${totalNow}`);

    harvestStatus.finishedAt = new Date().toLocaleTimeString('fr-FR');
    harvestStatus.isHarvesting = false;

    return {
      success: true,
      addedTotal,
      totalVideos: totalNow,
    };
  } finally {
    isHarvesting = false;
    harvestStatus.isHarvesting = false;
  }
}

// CLI test / runner
if (process.argv[1]?.endsWith('harvester.js')) {
  let count = null;
  const arg = process.argv[2];
  if (arg && !isNaN(parseInt(arg, 10))) {
    count = parseInt(arg, 10);
  }
  console.log(`[Harvester CLI] Démarrage... (chaînes max: ${count || 'toutes les incomplètes'})`);
  startChannelHarvestBatch({ channelCount: count })
    .then((res) => {
      console.log('Résultat CLI:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Erreur CLI:', err);
      process.exit(1);
    });
}

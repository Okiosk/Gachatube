import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { 
  db,
  drawBoosterPack, 
  drawBoosterPackByType, 
  getCards, 
  getCardById, 
  getStats, 
  getChannelsList, 
  getHarvestState,
  getAdminChannels,
  addChannel,
  deleteChannel,
  wipeAllVideos,
  getTotalVideosCount,
  updateChannelMetadata
} from './db.js';
import { 
  startChannelHarvestBatch, 
  stopHarvest, 
  getHarvesterStatus 
} from './harvester.js';
import { enrichChannelsBatch } from './channelEnricher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// SVG initials fallback for channels without an avatar URL
app.get('/api/avatar/:channelName', (req, res) => {
  const channelName = decodeURIComponent(req.params.channelName || '');
  const initials = channelName.slice(0, 2).toUpperCase() || 'YT';
  const charCode = channelName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = (charCode * 37) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="176" height="176" viewBox="0 0 176 176">
    <rect width="176" height="176" rx="88" fill="hsl(${hue},60%,35%)"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="64" font-weight="900">${initials}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Database global stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Open a booster pack (supports ?type=decouverte|standard|viral|gaming|culture|collector|premium|mythic)
app.get('/api/booster/open', (req, res) => {
  try {
    const validTypes = ['decouverte', 'standard', 'viral', 'gaming', 'culture', 'collector', 'premium', 'mythic'];
    const type = validTypes.includes(req.query.type)
      ? req.query.type
      : 'standard';
    const boosterResult = drawBoosterPackByType(type);
    res.json(boosterResult);
  } catch (err) {
    console.error('Error opening booster:', err);
    res.status(500).json({ error: "Erreur lors de l'ouverture du booster" });
  }
});

// Search & paginate through the real cards
app.get('/api/cards', (req, res) => {
  try {
    const {
      page = 1,
      limit = 24,
      search = '',
      channel = '',
      rarity = '',
      category = '',
      sortBy = 'views',
      order = 'desc'
    } = req.query;

    const result = getCards({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      channel,
      rarity,
      category,
      sortBy,
      order
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching cards:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des cartes' });
  }
});

// Get a single card by ID
app.get('/api/cards/:id', (req, res) => {
  try {
    const card = getCardById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Carte introuvable' });
    }
    res.json(card);
  } catch (err) {
    console.error('Error fetching card:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la carte' });
  }
});

// Get channels list with metadata (avatar, URL, count)
app.get('/api/channels', (req, res) => {
  try {
    const channels = getChannelsList();
    res.json(channels);
  } catch (err) {
    console.error('Error fetching channels:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des chaînes' });
  }
});

// Enrich missing channel metadata (URL & avatar) from YouTube
let isEnrichingChannels = false;
app.post('/api/channels/enrich', async (req, res) => {
  if (isEnrichingChannels) {
    return res.status(409).json({ error: 'Un enrichissement des chaînes est déjà en cours.' });
  }

  const limit = parseInt(req.body.limit || req.query.limit || 50, 10);
  isEnrichingChannels = true;

  try {
    const result = await enrichChannelsBatch(limit);
    res.json(result);
  } catch (err) {
    console.error('Error enriching channels:', err);
    res.status(500).json({ error: "Erreur lors de l'enrichissement des chaînes", details: err.message });
  } finally {
    isEnrichingChannels = false;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Get all channels for admin (with video counts, avatars, etc.)
app.get('/api/admin/channels', (req, res) => {
  try {
    const channels = getAdminChannels();
    res.json({
      channels,
      totalChannels: channels.length,
      totalVideos: getTotalVideosCount(),
    });
  } catch (err) {
    console.error('Error fetching admin channels:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des chaînes admin' });
  }
});

// Add a new channel (auto-resolves name, handle, avatar from URL)
app.post('/api/admin/channels', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: "L'URL de la chaîne YouTube est requise." });
    }
    const channelUrl = url.trim();
    
    // Extract handle from URL
    const handleMatch = channelUrl.match(/youtube\.com\/(@[^\/\?]+)/);
    if (!handleMatch) {
      return res.status(400).json({ error: "URL invalide. Format attendu: https://www.youtube.com/@handle" });
    }
    const handle = handleMatch[1];
    
    // Fetch the channel page to get name + avatar
    const FETCH_HEADERS = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    };
    
    let channelName = handle.replace('@', '');
    let avatarUrl = null;
    
    try {
      const pageRes = await fetch(`https://www.youtube.com/${handle}/about`, { headers: FETCH_HEADERS });
      if (pageRes.ok) {
        const html = await pageRes.text();
        
        // Extract channel name
        const nameMatch = html.match(/"title":"([^"]+)","navigationEndpoint"/) ||
                          html.match(/"channelMetadataRenderer":.*?"title":"([^"]+)"/) ||
                          html.match(/<title>([^<]+) - YouTube<\/title>/);
        if (nameMatch) channelName = nameMatch[1].trim();
        
        // Extract avatar URL and official channel title from ytInitialData
        const dataMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s);
        if (dataMatch) {
          try {
            const data = JSON.parse(dataMatch[1]);

            if (data?.metadata?.channelMetadataRenderer?.title) {
              channelName = data.metadata.channelMetadataRenderer.title.trim();
            } else if (data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.title?.dynamicTextViewModel?.text?.content) {
              channelName = data.header.pageHeaderRenderer.content.pageHeaderViewModel.title.dynamicTextViewModel.text.content.trim();
            }

            const header = data?.header?.pageHeaderRenderer || data?.header?.c4TabbedHeaderRenderer;
            const thumbs = header?.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources ||
                           header?.avatar?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources ||
                           header?.avatar?.thumbnails ||
                           data?.metadata?.channelMetadataRenderer?.avatar?.thumbnails ||
                           [];
            if (thumbs.length > 0) {
              avatarUrl = thumbs[thumbs.length - 1].url.replace(/=s\d+-/, '=s176-');
            }
          } catch {}
        }

        // Try meta og:image as fallback
        if (!avatarUrl) {
          const metaMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
          if (metaMatch) avatarUrl = metaMatch[1];
        }
      }
    } catch (fetchErr) {
      console.warn('[AddChannel] Could not fetch channel page:', fetchErr.message);
    }
    
    // Save to DB with all resolved info
    const stmt = db.prepare(`
      INSERT INTO channels (name, handle, channel_url, avatar_url)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        handle = excluded.handle,
        channel_url = excluded.channel_url,
        avatar_url = COALESCE(excluded.avatar_url, channels.avatar_url)
    `);
    const info = stmt.run(channelName, handle, channelUrl, avatarUrl);
    if (avatarUrl) {
      updateChannelMetadata(channelName, channelUrl, avatarUrl);
    }
    
    res.json({ success: true, channel: { id: info.lastInsertRowid, name: channelName, handle, channel_url: channelUrl, avatar_url: avatarUrl } });
  } catch (err) {
    console.error('Error adding channel:', err);
    res.status(400).json({ error: err.message || "Erreur lors de l'ajout de la chaîne" });
  }
});

// Delete a channel
app.delete('/api/admin/channels/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = deleteChannel(id);
    if (!success) {
      return res.status(404).json({ error: 'Chaîne introuvable' });
    }
    res.json({ success: true, message: 'Chaîne et ses vidéos supprimées avec succès' });
  } catch (err) {
    console.error('Error deleting channel:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de la chaîne' });
  }
});

// Trigger harvester batch
app.post('/api/admin/harvest', async (req, res) => {
  const status = getHarvesterStatus();
  if (status.isHarvesting) {
    return res.status(409).json({ error: 'Une collecte est déjà en cours d\'exécution.' });
  }

  const { channelCount, channelId } = req.body;

  // Run asynchronously so UI is not blocked
  startChannelHarvestBatch({ channelCount, channelId }).catch((err) => {
    console.error('[Harvester Background Error]', err);
  });

  res.json({ 
    success: true, 
    message: 'Collecte démarrée en arrière-plan.',
    status: getHarvesterStatus() 
  });
});

// Stop harvester
app.post('/api/admin/harvest/stop', (req, res) => {
  const stopped = stopHarvest();
  res.json({ success: stopped, message: stopped ? 'Arrêt demandé' : 'Aucune collecte en cours' });
});

// Get live harvester status
app.get('/api/admin/harvest/status', (req, res) => {
  res.json(getHarvesterStatus());
});

// Reset / wipe all videos in DB
app.post('/api/admin/reset-videos', (req, res) => {
  try {
    wipeAllVideos();
    res.json({ success: true, message: 'Base de données des vidéos vidée avec succès.', totalVideos: 0 });
  } catch (err) {
    console.error('Error wiping videos:', err);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation des vidéos' });
  }
});

// Legacy / general harvest status endpoint
app.get('/api/harvest/status', (req, res) => {
  res.json(getHarvesterStatus());
});

// Legacy harvest trigger
app.post('/api/harvest', (req, res) => {
  const status = getHarvesterStatus();
  if (status.isHarvesting) {
    return res.status(409).json({ error: 'Une collecte est déjà en cours.' });
  }
  startChannelHarvestBatch().catch((e) => console.error(e));
  res.json({ success: true, message: 'Collecte démarrée en arrière-plan.' });
});

// Serve frontend static build if dist exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`🚀 GachaTube Server running on http://localhost:${PORT}`);
});

import { db, saveChannelMetadata } from './db.js';

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Connection: 'close',
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch and extract official channel URL and avatar for a given YouTube channel name
 */
export async function enrichSingleChannel(channelName, retries = 2) {
  if (!channelName) return null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await delay(1000 * attempt);
      }

      // Search with channel filter (sp=EgIQAg%3D%3D) for exact channel match
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(channelName)}&sp=EgIQAg%3D%3D`;
      const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(12000) });
      if (!res.ok) {
        if (attempt < retries) continue;
        return null;
      }

      const html = await res.text();
      const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
      if (!match) {
        if (attempt < retries) continue;
        return null;
      }

      const data = JSON.parse(match[1]);
      const sections =
        data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents || [];

      let channelUrl = null;
      let avatarUrl = null;

      // 1. Check for channelRenderer first (most accurate for official channel)
      for (const section of sections) {
        for (const item of section.itemSectionRenderer?.contents || []) {
          const cr = item.channelRenderer;
          if (cr) {
            const nav = cr.navigationEndpoint?.browseEndpoint;
            if (nav?.canonicalBaseUrl) {
              channelUrl = `https://www.youtube.com${nav.canonicalBaseUrl}`;
            } else if (nav?.browseId) {
              channelUrl = `https://www.youtube.com/channel/${nav.browseId}`;
            }

            const thumbs = cr.thumbnail?.thumbnails || [];
            if (thumbs.length > 0) {
              const rawUrl = thumbs[thumbs.length - 1].url;
              avatarUrl = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
              avatarUrl = avatarUrl.replace(/=s\d+-/, '=s176-');
            }
            break;
          }

          // 2. Fallback to videoRenderer if channelRenderer not present
          const vr = item.videoRenderer;
          if (vr && !channelUrl) {
            const nav = vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint;
            if (nav?.canonicalBaseUrl) {
              channelUrl = `https://www.youtube.com${nav.canonicalBaseUrl}`;
            } else if (nav?.browseId) {
              channelUrl = `https://www.youtube.com/channel/${nav.browseId}`;
            }

            const thumbs =
              vr.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer
                ?.thumbnail?.thumbnails || [];
            if (thumbs.length > 0) {
              const rawUrl = thumbs[thumbs.length - 1].url;
              avatarUrl = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
              avatarUrl = avatarUrl.replace(/=s\d+-/, '=s176-');
            }
          }
        }
        if (channelUrl && avatarUrl) break;
      }

      if (channelUrl || avatarUrl) {
        saveChannelMetadata(channelName, channelUrl, avatarUrl);
        return { channel: channelName, channelUrl, avatarUrl, success: true };
      }

      return { channel: channelName, success: false };
    } catch (err) {
      if (attempt >= retries) {
        console.warn(`[Enricher] Error enriching channel "${channelName}":`, err.message);
        return { channel: channelName, error: err.message, success: false };
      }
    }
  }

  return { channel: channelName, success: false };
}

/**
 * Batch enrich channels missing metadata, ordered by video count in DB
 */
export async function enrichChannelsBatch(limit = 60, onProgress = null) {
  const missingRows = db
    .prepare(
      `SELECT v.channel, count(*) as count
       FROM videos v
       LEFT JOIN channels_metadata m ON v.channel = m.channel
       WHERE m.avatar_url IS NULL OR m.channel_url IS NULL
       GROUP BY v.channel
       ORDER BY count DESC
       LIMIT ?`
    )
    .all(limit);

  console.log(`[Enricher] Starting enrichment for ${missingRows.length} channels...`);
  let enrichedCount = 0;

  for (let i = 0; i < missingRows.length; i++) {
    const row = missingRows[i];
    const result = await enrichSingleChannel(row.channel);
    if (result?.avatarUrl || result?.channelUrl) {
      enrichedCount++;
      console.log(
        `[Enricher] [${i + 1}/${missingRows.length}] ✅ ${row.channel} (${row.count} vids) -> ${
          result.avatarUrl ? 'Avatar ✓' : ''
        } ${result.channelUrl || ''}`
      );
    } else {
      console.log(`[Enricher] [${i + 1}/${missingRows.length}] ⚠️ ${row.channel} -> Not found`);
    }

    if (onProgress) {
      onProgress({ current: i + 1, total: missingRows.length, channel: row.channel, result });
    }

    // Polite delay between queries
    await delay(700 + Math.random() * 500);
  }

  console.log(`[Enricher] Batch complete: ${enrichedCount}/${missingRows.length} channels enriched.`);
  return { totalAttempted: missingRows.length, enrichedCount };
}

// CLI entry point
if (process.argv[1]?.endsWith('channelEnricher.js')) {
  const limitArg = parseInt(process.argv[2] || '50', 10);
  enrichChannelsBatch(limitArg)
    .then((res) => {
      console.log('Finished:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

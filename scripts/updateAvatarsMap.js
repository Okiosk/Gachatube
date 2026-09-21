import fs from 'node:fs';
import { db } from '../server/db.js';

const channels = db.prepare('SELECT DISTINCT channel as name FROM videos ORDER BY channel COLLATE NOCASE ASC').all();
const map = {};

for (const ch of channels) {
  const meta = db.prepare('SELECT avatar_url FROM channels WHERE name = ?').get(ch.name) ||
               db.prepare('SELECT avatar_url FROM channels_metadata WHERE channel = ?').get(ch.name);
  if (meta?.avatar_url) {
    map[ch.name] = meta.avatar_url;
  }
}

const content = `/**
 * Channel Avatars provider for GachaTube cards
 * Maps channel names to official YouTube avatar URLs (yt3.googleusercontent.com)
 * Total channels: ${channels.length}
 */

const AVATAR_MAP = ${JSON.stringify(map, null, 2)};

/**
 * Get avatar URL for a given channel name
 */
export function getChannelAvatar(channelName) {
  if (!channelName) return null;
  return AVATAR_MAP[channelName] || null;
}

/**
 * Register or update avatars from server channel stats
 */
export function registerChannelAvatars(channelsList) {
  if (!Array.isArray(channelsList)) return;
  for (const ch of channelsList) {
    const name = ch.channel || ch.name;
    const url = ch.avatar_url || ch.avatarUrl;
    if (name && url) {
      AVATAR_MAP[name] = url;
    }
  }
}
`;

fs.writeFileSync('./src/utils/channelAvatars.js', content, 'utf8');
console.log(`Updated channelAvatars.js with ${Object.keys(map).length} / ${channels.length} channels!`);

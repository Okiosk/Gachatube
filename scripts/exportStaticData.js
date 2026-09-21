import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, getStats, getChannelsList } from '../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, '../public/data');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Exporting database to static JSON files for GitHub Pages...');

// 1. All Cards
const cards = db.prepare('SELECT * FROM videos ORDER BY score DESC').all();
fs.writeFileSync(path.join(outputDir, 'cards.json'), JSON.stringify(cards));
console.log(`✓ Exported ${cards.length} cards to public/data/cards.json`);

// 2. Channels
const channels = getChannelsList();
fs.writeFileSync(path.join(outputDir, 'channels.json'), JSON.stringify(channels));
console.log(`✓ Exported ${channels.length} channels to public/data/channels.json`);

// 3. Stats
const stats = getStats();
fs.writeFileSync(path.join(outputDir, 'stats.json'), JSON.stringify(stats));
console.log(`✓ Exported stats to public/data/stats.json`);

console.log('All static data exported successfully!');

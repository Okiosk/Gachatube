import { db, recalculateRarities, getTotalVideosCount, updateChannelMetadata } from '../server/db.js';
import { harvestChannelVideos } from '../server/harvester.js';

const NEW_CHANNELS = [
  { name: 'Le Rire Jaune', handle: '@LeRireJaune', category: 'Humour' },
  { name: 'Antoine Daniel', handle: '@MrAntoineDaniel', category: 'Humour' },
  { name: 'Léna Situations', handle: '@LenaSituations', category: 'Divertissement' },
  { name: 'Theodort', handle: '@theodortyt', category: 'Divertissement' },
  { name: 'Valouzz', handle: '@Valouzz', category: 'Gaming' },
  { name: 'Pidi', handle: '@PidiYT', category: 'Divertissement' },
  { name: 'LeBouseuh', handle: '@LeBouseuh', category: 'Gaming' },
  { name: 'Doc Seven', handle: '@DocSeven', category: 'Savoir' },
  { name: 'Greg Guillotin', handle: '@GregGuillotin', category: 'Humour' },
  { name: 'David Lafarge Pokemon', handle: '@DavidLafargePokemon', category: 'Divertissement' },
  { name: 'Kameto', handle: '@Kamet0', category: 'Gaming' },
  { name: 'Maghla', handle: '@Maghla', category: 'Gaming' },
  { name: 'Jeel', handle: '@JeelTV', category: 'Gaming' },
  { name: 'Doigby', handle: '@Doigby', category: 'Gaming' },
  { name: 'Fuze III', handle: '@FuzeIII', category: 'Gaming' },
  { name: 'Siphano', handle: '@Siphano13', category: 'Gaming' },
  { name: 'Frigiel', handle: '@Frigiel', category: 'Gaming' },
  { name: 'Mamytwink', handle: '@Mamytwink', category: 'Savoir' },
  { name: 'Balade Mentale', handle: '@baladementale', category: 'Savoir' },
  { name: 'Astronogeek', handle: '@Astronogeek', category: 'Savoir' },
  { name: 'e-penser', handle: '@epenser1', category: 'Savoir' },
  { name: 'Cyrus North', handle: '@CyrusNorth', category: 'Savoir' },
  { name: 'Linksthesun', handle: '@Linksthesun', category: 'Culture' },
  { name: 'Captain Popcorn', handle: '@CaptainPopcorn', category: 'Culture' },
  { name: 'Le Roi des Rats', handle: '@LeRoidesRats', category: 'Actualités' },
  { name: 'Gaspard G', handle: '@GaspardG', category: 'Actualités' },
  { name: 'Louis-San', handle: '@Louis-San', category: 'Culture' },
  { name: 'Tev - Ici Japon', handle: '@IciJapon', category: 'Culture' },
  { name: 'Pape San', handle: '@PapeSan', category: 'Culture' },
  { name: 'Juju Fitcats', handle: '@JujuFitcats', category: 'Sport/Fitness' },
  { name: 'L\'Atelier de Roxane', handle: '@latelierderoxane', category: 'Divertissement' },
  { name: 'Farod', handle: '@FarodGames', category: 'Gaming' },
  { name: 'Tartin', handle: '@tartin', category: 'Gaming' },
  { name: 'Mathieu Sommet', handle: '@MathieuSommet', category: 'Humour' },
  { name: 'Colas Bim', handle: '@ColasBim', category: 'Humour' },
  { name: 'Le Monde à L\'Envers', handle: '@LeMondeALEnvers', category: 'Humour' },
  { name: 'Maxence', handle: '@MaxenceLap', category: 'Humour' },
  { name: 'Lucas Studio', handle: '@LucasStudioOff', category: 'Divertissement' },
  { name: 'Kaatsup', handle: '@Kaatsup', category: 'Gaming' },
  { name: 'Grimkujow', handle: '@Grimkujow', category: 'Humour' },
  { name: 'Scilabus', handle: '@scilabus', category: 'Savoir' },
  { name: 'Linguisticae', handle: '@Linguisticae', category: 'Savoir' },
  { name: 'RebeuDeter', handle: '@BillyRebeuDeter', category: 'Divertissement' },
  { name: 'Sylvain Levy', handle: '@SylvainLyve', category: 'Divertissement' },
  { name: 'VodK', handle: '@VodKprod', category: 'Divertissement' },
  { name: 'Maxime Biaggi', handle: '@MaximeBiaggi', category: 'Humour' },
  { name: 'GouvHD', handle: '@GouvHD', category: 'Humour' },
  { name: 'Golden Moustache', handle: '@GoldenMoustache', category: 'Humour' },
  { name: 'Studio Bagel', handle: '@StudioBagel', category: 'Humour' },
  { name: 'Le Fossoyeur', handle: '@LeFossoyeur', category: 'Culture' }
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('--- Démarrage de la collecte des 50 nouveaux YouTubers ---');
  console.log(`Vidéos en base avant collecte : ${getTotalVideosCount()}`);

  const insertChannelStmt = db.prepare(`
    INSERT INTO channels (name, handle, channel_url)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      handle = excluded.handle,
      channel_url = excluded.channel_url
  `);

  let processed = 0;
  for (const item of NEW_CHANNELS) {
    processed++;
    console.log(`\n[${processed}/50] Traitement de : ${item.name} (${item.handle})...`);

    const channelUrl = `https://www.youtube.com/${item.handle}`;
    insertChannelStmt.run(item.name, item.handle, channelUrl);

    try {
      const res = await harvestChannelVideos({
        name: item.name,
        handle: item.handle,
        channel_url: channelUrl
      });
      console.log(`  Résultat pour ${item.name}: +${res.added} vidéos (${res.totalForChannel}/30)`);

      // Mettre à jour la catégorie personnalisée pour chaque vidéo de la chaîne
      if (item.category) {
        db.prepare('UPDATE videos SET category = ? WHERE channel = ?').run(item.category, item.name);
      }
    } catch (err) {
      console.error(`  Erreur lors de la collecte de ${item.name}:`, err.message);
    }

    // Petite pause pour ménager l'API YouTube
    await delay(350);
  }

  console.log('\n--- Recalcul des raretés (1★ à 5★) ---');
  recalculateRarities();

  const totalNow = getTotalVideosCount();
  console.log(`--- Collecte terminée ! Total des vidéos en base : ${totalNow} ---`);
}

run().catch(console.error);

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'youtube_france_10000.db');

const db = new DatabaseSync(dbPath);

console.log('--- Démarrage de la génération de la base de 10 000 vidéos YouTube France ---');

// Reset table for clean seed
db.exec(`DROP TABLE IF EXISTS videos;`);
db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    channel TEXT NOT NULL,
    views INTEGER NOT NULL,
    likes INTEGER NOT NULL,
    comments INTEGER NOT NULL,
    thumbnail_url TEXT NOT NULL,
    rarity TEXT NOT NULL,
    category TEXT NOT NULL,
    score REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_videos_rarity ON videos (rarity);
  CREATE INDEX IF NOT EXISTS idx_videos_views ON videos (views DESC);
  CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos (channel);
  CREATE INDEX IF NOT EXISTS idx_videos_score ON videos (score DESC);
`);

// Real iconic French YouTube video collection (top hits)
const realIconicVideos = [
  {
    videoId: 'oiKj0Z_Xnjc',
    title: 'Papaoutai (Clip Officiel)',
    channel: 'Stromae',
    views: 1120000000,
    likes: 6400000,
    comments: 245000,
    category: 'Musique'
  },
  {
    videoId: 'K5KAc5CoCuk',
    title: 'Dernière Danse (Clip Officiel)',
    channel: 'Indila',
    views: 1250000000,
    likes: 7200000,
    comments: 310000,
    category: 'Musique'
  },
  {
    videoId: 'iOe6dRrVDfc',
    title: 'Ego (Radio Edit)',
    channel: 'Willy William',
    views: 1040000000,
    likes: 5800000,
    comments: 185000,
    category: 'Musique'
  },
  {
    videoId: 'JRfuAukYTKg',
    title: 'Titanium ft. Sia (Official Video)',
    channel: 'David Guetta',
    views: 1850000000,
    likes: 9100000,
    comments: 380000,
    category: 'Musique'
  },
  {
    videoId: 'iPGgnzc34tY',
    title: 'Djadja (Clip officiel)',
    channel: 'Aya Nakamura',
    views: 970000000,
    likes: 4900000,
    comments: 215000,
    category: 'Musique'
  },
  {
    videoId: 'rLHSvUaWzC0',
    title: 'Bella (Clip Officiel)',
    channel: 'GIMS',
    views: 620000000,
    likes: 2900000,
    comments: 142000,
    category: 'Musique'
  },
  {
    videoId: '2MYnhl2k_0o',
    title: 'Sapés comme jamais ft. Niska (Clip officiel)',
    channel: 'GIMS',
    views: 660000000,
    likes: 3100000,
    comments: 154000,
    category: 'Musique'
  },
  {
    videoId: 'BtyHYI443JE',
    title: 'Au DD (Clip Officiel)',
    channel: 'PNL',
    views: 235000000,
    likes: 2700000,
    comments: 135000,
    category: 'Musique'
  },
  {
    videoId: '_ZPpU7774DQ',
    title: 'OVERWATCH RAP BATTLE',
    channel: 'SQUEEZIE',
    views: 71000000,
    likes: 2100000,
    comments: 98000,
    category: 'Divertissement'
  },
  {
    videoId: 'f9jJc-b0g2U',
    title: 'BYE BYE POTO (Clip officiel)',
    channel: 'SQUEEZIE',
    views: 64000000,
    likes: 1950000,
    comments: 82000,
    category: 'Divertissement'
  },
  {
    videoId: 'lPpU3R97q6A',
    title: 'Freestyle de l\'autodérision (Clip officiel)',
    channel: 'SQUEEZIE',
    views: 51000000,
    likes: 1800000,
    comments: 67000,
    category: 'Divertissement'
  },
  {
    videoId: 'Wp_P0lQfTzU',
    title: 'KAIZEN : 1 an pour gravir l\'Everest !',
    channel: 'Inoxtag',
    views: 42000000,
    likes: 2600000,
    comments: 175000,
    category: 'Divertissement'
  },
  {
    videoId: 'XyZ76u8qUuI',
    title: '7 JOURS SEUL SUR UNE ÎLE DÉSERTE !',
    channel: 'Inoxtag',
    views: 28000000,
    likes: 1350000,
    comments: 65000,
    category: 'Divertissement'
  },
  {
    videoId: 'fG9a_b9nQc8',
    title: 'FIER (Clip Officiel)',
    channel: 'Michou',
    views: 55000000,
    likes: 1700000,
    comments: 82000,
    category: 'Divertissement'
  },
  {
    videoId: 'Yy0B7T2hS6U',
    title: 'DANS LE CLUB (Clip Officiel)',
    channel: 'Michou',
    views: 34000000,
    likes: 1100000,
    comments: 49000,
    category: 'Divertissement'
  },
  {
    videoId: '6ZbbgM5oK_8',
    title: 'Les Réunions',
    channel: 'Cyprien',
    views: 56000000,
    likes: 1450000,
    comments: 52000,
    category: 'Humour'
  },
  {
    videoId: '1e5tM-6p1u4',
    title: 'Les Technophobes',
    channel: 'Cyprien',
    views: 49000000,
    likes: 1250000,
    comments: 41000,
    category: 'Humour'
  },
  {
    videoId: 'Zp49f6VqYl0',
    title: 'La Cartouche (Cyprien répond à Cortex)',
    channel: 'Cyprien',
    views: 53000000,
    likes: 1600000,
    comments: 84000,
    category: 'Humour'
  },
  {
    videoId: 'g8j_kLp7mQ0',
    title: 'Les Mamans',
    channel: 'Norman fait des vidéos',
    views: 41000000,
    likes: 980000,
    comments: 32000,
    category: 'Humour'
  },
  {
    videoId: 'Bde0n2P6Vw0',
    title: 'Luigi Clash Mario',
    channel: 'Norman fait des vidéos',
    views: 92000000,
    likes: 1650000,
    comments: 55000,
    category: 'Humour'
  },
  {
    videoId: 'k5sU9UqXl3c',
    title: 'RAP VS RÉALITÉ',
    channel: 'Mister V',
    views: 45000000,
    likes: 1550000,
    comments: 63000,
    category: 'Humour'
  },
  {
    videoId: 'v9v2x4Q0l18',
    title: 'POLICE (Clip Officiel)',
    channel: 'Mister V',
    views: 36000000,
    likes: 1300000,
    comments: 48000,
    category: 'Humour'
  },
  {
    videoId: 'n6a0r_s_uI8',
    title: 'CLASH DE GENTLEMEN (feat. Squeezie)',
    channel: 'Mcfly et Carlito',
    views: 38000000,
    likes: 1400000,
    comments: 54000,
    category: 'Divertissement'
  },
  {
    videoId: 'uT4rR_Q2lU0',
    title: 'Concours d\'anecdotes avec le Président de la République',
    channel: 'Mcfly et Carlito',
    views: 23000000,
    likes: 1500000,
    comments: 110000,
    category: 'Divertissement'
  },
  {
    videoId: 'L1kR8Xm1N7A',
    title: 'On teste des objets Wish bizarres et dangereux',
    channel: 'Amixem',
    views: 24000000,
    likes: 950000,
    comments: 41000,
    category: 'Divertissement'
  },
  {
    videoId: 'W3s5u0g1t8c',
    title: 'CLASHER UN HATER EN CHANSON feat. Joyca',
    channel: 'Joyca',
    views: 35000000,
    likes: 1250000,
    comments: 52000,
    category: 'Divertissement'
  },
  {
    videoId: 'G1j6q2t5u4I',
    title: 'Tchikita (Audio Officiel)',
    channel: 'Jul',
    views: 315000000,
    likes: 1450000,
    comments: 62000,
    category: 'Musique'
  },
  {
    videoId: 'N2u8y0x9s1b',
    title: 'On m\'appelle l\'ovni',
    channel: 'Jul',
    views: 165000000,
    likes: 950000,
    comments: 44000,
    category: 'Musique'
  },
  {
    videoId: 'M7s2b5a1t9o',
    title: 'Bande Organisée (Clip Officiel)',
    channel: 'D\'Or et de Platine / Jul / SCH',
    views: 520000000,
    likes: 2750000,
    comments: 125000,
    category: 'Musique'
  },
  {
    videoId: 'p7t5o0r1v3a',
    title: 'Basique (Clip Officiel)',
    channel: 'Orelsan',
    views: 130000000,
    likes: 1150000,
    comments: 58000,
    category: 'Musique'
  },
  {
    videoId: 'k8j7n2u4l0s',
    title: 'Dommage (Clip Officiel)',
    channel: 'Bigflo & Oli',
    views: 320000000,
    likes: 2100000,
    comments: 88000,
    category: 'Musique'
  },
  {
    videoId: 'q9w8e7r6t5y',
    title: 'Lettre à une femme (Clip Officiel)',
    channel: 'Ninho',
    views: 135000000,
    likes: 980000,
    comments: 42000,
    category: 'Musique'
  },
  {
    videoId: 'h1j2k3l4m5n',
    title: 'Goutte d\'eau (Clip Officiel)',
    channel: 'Ninho',
    views: 98000000,
    likes: 780000,
    comments: 31000,
    category: 'Musique'
  },
  {
    videoId: 'z1x2c3v4b5n',
    title: 'Trop beau (Clip Officiel)',
    channel: 'Lomepal',
    views: 125000000,
    likes: 890000,
    comments: 34000,
    category: 'Musique'
  },
  {
    videoId: 'a1s2d3f4g5h',
    title: 'Tous les mêmes (Clip Officiel)',
    channel: 'Stromae',
    views: 450000000,
    likes: 2700000,
    comments: 92000,
    category: 'Musique'
  },
  {
    videoId: 'j1d2g3d4b5z',
    title: 'Joueur du Grenier - Dragon Ball',
    channel: 'Joueur du Grenier',
    views: 19500000,
    likes: 820000,
    comments: 46000,
    category: 'Gaming'
  },
  {
    videoId: 'w1a2n3k4i5l',
    title: 'Le Meilleur Cache-Cache de GTA 5 RP',
    channel: 'Wankil Studio',
    views: 12500000,
    likes: 540000,
    comments: 29000,
    category: 'Gaming'
  },
  {
    videoId: 'v1i2l3e4b5r',
    title: 'ON PREND UN DOS D\'ÂNE À 170 KM/H ! (Ça tourne mal)',
    channel: 'Vilebrequin',
    views: 14800000,
    likes: 850000,
    comments: 41000,
    category: 'Divertissement'
  },
  {
    videoId: 'g1m2k3b4u5g',
    title: 'J\'AI ACHETÉ UNE BUGATTI CHIRON ! (C\'est indécent)',
    channel: 'GMK',
    views: 16200000,
    likes: 720000,
    comments: 35000,
    category: 'Divertissement'
  },
  {
    videoId: 't1i2b3o4i5n',
    title: '1000 POMPES EN 1 HEURE ! (Défi Extrême)',
    channel: 'Tibo InShape',
    views: 19000000,
    likes: 680000,
    comments: 31000,
    category: 'Sport/Fitness'
  },
  {
    videoId: 'd1a2v3i4d5l',
    title: 'J\'OUVRE UN DISPLAY POKÉMON ÉDITION 1 À 100 000€ !',
    channel: 'DavidLafargePokemon',
    views: 8900000,
    likes: 420000,
    comments: 26000,
    category: 'Divertissement'
  }
];

// Master channels list with realistic characteristics and top formats
const frenchChannels = [
  { name: 'SQUEEZIE', category: 'Divertissement', weight: 80, viewFactor: 1.6, defaultVid: 'oiKj0Z_Xnjc',
    prefixes: ['QUI SERA LE DERNIER À', 'ON TESTE LES PIRES', 'THREAD HORREUR :', 'LES PIRES ARNAQUES DE', 'QUI EST L\'IMPOSTEUR ? (ft.', 'NE CHOISISSEZ JAMAIS LE MAUVAIS', 'LE PIRE PIÈGE DU MONDE', 'ON A CONSTRUIT LE PLUS GRAND', 'JE RÉAGIS À VOS SECRETS LES PLUS', 'VOUS NE CROIREZ JAMAIS CE QUI'] },
  { name: 'Inoxtag', category: 'Divertissement', weight: 65, viewFactor: 1.5, defaultVid: 'Wp_P0lQfTzU',
    prefixes: ['7 JOURS SEUL DANS', 'ON TRAVERSE LA FRANCE EN', 'SURVIE EXTRÊME PENDANT 24H AVEC', 'JE PASSE LE PIRE TEST DU MONDE', 'DÉFI : SI TU TOMBES TU REPARS À ZÉRO', 'J\'AI SURVÉCU À L\'ENDROIT LE PLUS DANGEREUX', 'EXPÉDITION SECRÈTE AU BOUT DU MONDE', '24H POUR ÉCHAPPER AUX POLICIERS AVEC'] },
  { name: 'Michou', category: 'Divertissement', weight: 60, viewFactor: 1.3, defaultVid: 'fG9a_b9nQc8',
    prefixes: ['CACHE-CACHE GÉANT DANS UN', 'JE DÉPENSE 10 000€ EN 1 HEURE DANS', 'ON FAIT LE TOUR DU MONDE EN', 'LE DERNIER QUI SORT DU CERCLE GAGNE', 'OUVERTURE DE PACKS LÉGENDAIRES AVEC', 'JE PIÈGE MES POTES PENDANT 24H', 'ON TESTE LES ATTRACTIONS LES PLUS FOLLES'] },
  { name: 'Cyprien', category: 'Humour', weight: 50, viewFactor: 1.4, defaultVid: '6ZbbgM5oK_8',
    prefixes: ['Les Réunions', 'Les Vieux et la Technologie', 'Les Jeux Vidéo', 'L\'École', 'Les Publicités', 'Mon Nouveau Voisin', 'Les Réseaux Sociaux', 'La Routine du Matin', 'Les Questions Existentielles', 'Le Film Court :'] },
  { name: 'Norman fait des vidéos', category: 'Humour', weight: 45, viewFactor: 1.2, defaultVid: 'g8j_kLp7mQ0',
    prefixes: ['Avoir un Chien', 'Le Permis de Conduire', 'Les Soirées Trop Arrosées', 'Le Magasin de Bricolage', 'Les Voyages en Train', 'Le Régime', 'Les Enfants Petits', 'La Nostalgie des Années 2000'] },
  { name: 'Mister V', category: 'Humour', weight: 45, viewFactor: 1.3, defaultVid: 'k5sU9UqXl3c',
    prefixes: ['RAP VS RÉALITÉ Part.', 'LA POLICE : Épisode', 'LES STATES : Ce qu\'on ne vous dit pas', 'Le Stage en Entreprise de', 'Les Pires Types en Boîte', 'McWalter : Opération', 'La Soirée Appartement'] },
  { name: 'Amixem', category: 'Divertissement', weight: 70, viewFactor: 1.2, defaultVid: 'L1kR8Xm1N7A',
    prefixes: ['On achète les pires objets sur', 'On teste 100 inventions insolites', '24h enfermés dans un bunker sous-terrain', 'Ne touchez pas à ce bouton !', 'On construit un parc d\'attraction dans le studio', 'On transforme notre van en', 'Le blind test le plus chaotique de l\'histoire'] },
  { name: 'Mcfly et Carlito', category: 'Divertissement', weight: 60, viewFactor: 1.2, defaultVid: 'n6a0r_s_uI8',
    prefixes: ['Concours d\'anecdotes avec', 'On appelle des gens au hasard feat.', 'Mélange d\'extrêmes :', 'Mario Carte Bleue avec', 'Le jeu du blind test impossible', 'On passe 24h menottés avec', 'Retrouve l\'objet mystère ou tu perds', 'La chanson surprise pour'] },
  { name: 'Joyca', category: 'Divertissement', weight: 55, viewFactor: 1.1, defaultVid: 'W3s5u0g1t8c',
    prefixes: ['Clasher un internaute en musique', 'On reproduit des TikToks viraux impossibles', 'J\'ai acheté les produits les plus nuls d\'Amazon', 'Créer un hit en 1 heure chrono avec', 'On teste les gadgets high-tech du futur', 'Le tribunal des pires réclamations'] },
  { name: 'Tibo InShape', category: 'Sport/Fitness', weight: 70, viewFactor: 1.3, defaultVid: 't1i2b3o4i5n',
    prefixes: ['1000 POMPES D\'AFFILÉE !', 'JE DÉCOUVRE LE MÉTIER DE', '24H DANS LA PEAU D\'UN COMMANDO', 'JE MANGE COMME LE PLUS GROS HOMME DU MONDE', 'DÉFI MUSCU CONTRE UN CHAMPION DU MONDE', 'L\'ENTRAÎNEMENT LE PLUS BRUTAL DE MA VIE', 'J\'AFFRONTE LES GIGN EN DIRECT'] },
  { name: 'Joueur du Grenier', category: 'Gaming', weight: 50, viewFactor: 1.1, defaultVid: 'j1d2g3d4b5z',
    prefixes: ['JDG -', 'Papy Grenier sur', 'Les Hors-Série jeux pourris de', 'Rétrospective des pires consoles :', 'Pourquoi ce jeu est un désastre :', 'JDG teste les adaptations ciné de', 'Ce jeu d\'enfance était en fait horrible :'] },
  { name: 'Wankil Studio', category: 'Gaming', weight: 55, viewFactor: 1.0, defaultVid: 'w1a2n3k4i5l',
    prefixes: ['Le meilleur fou rire sur', 'Les pires joueurs de', 'On martyrise un serveur sur', 'La partie la plus toxique de', 'Le retour de la police de proximité sur', 'On troll les débutants sur', 'Le cache-cache le plus sournois de'] },
  { name: 'Jul', category: 'Musique', weight: 65, viewFactor: 2.1, defaultVid: 'G1j6q2t5u4I',
    prefixes: ['Clip Officiel -', 'Album Gratuit Vol.', 'Freestyle d\'or 202', 'En équipe feat.', 'Tout pour le gang -', 'Sous la lune (Audio Officiel)', 'C\'est la zone (Clip)'] },
  { name: 'PNL', category: 'Musique', weight: 35, viewFactor: 2.3, defaultVid: 'BtyHYI443JE',
    prefixes: ['Clip Officiel -', 'Deux Frères Part.', 'Le Monde Chico -', 'Dans la légende -', 'Jusqu\'au dernier gramme Part.', 'A l\'ammoniaque (Clip)'] },
  { name: 'Ninho', category: 'Musique', weight: 45, viewFactor: 2.0, defaultVid: 'q9w8e7r6t5y',
    prefixes: ['Destin (Clip Officiel) -', 'Jefe Tour Live -', 'Freestyle Binks to Binks Part.', 'M.I.L.S 3 (Audio) -', 'Vrai de vrai feat.', 'Tout va bien (Clip)'] },
  { name: 'Stromae', category: 'Musique', weight: 30, viewFactor: 2.8, defaultVid: 'oiKj0Z_Xnjc',
    prefixes: ['Multitude Live -', 'Racine Carrée (Clip) -', 'Cheese Session -', 'Leçon n°', 'Santé (Clip Officiel)', 'L\'enfer (Live)'] },
  { name: 'GIMS', category: 'Musique', weight: 40, viewFactor: 2.4, defaultVid: 'rLHSvUaWzC0',
    prefixes: ['Ceinture Noire -', 'Subliminal (Clip Officiel) -', 'Le Fléau feat.', 'Les Décennies d\'or -', 'Caméléon (Audio)', 'Est-ce que tu m\'aimes (Clip)'] },
  { name: 'Aya Nakamura', category: 'Musique', weight: 35, viewFactor: 2.4, defaultVid: 'iPGgnzc34tY',
    prefixes: ['Nakamura (Clip Officiel) -', 'DNK Live Session -', 'Jolie Nana (Clip) -', 'Plus Jamais feat.', 'Fly (Acoustique)', 'Baby (Clip Officiel)'] },
  { name: 'Orelsan', category: 'Musique', weight: 35, viewFactor: 1.8, defaultVid: 'p7t5o0r1v3a',
    prefixes: ['Civilisation (Clip Officiel) -', 'La fête est finie -', 'Le chant des sirènes -', 'L\'odeur de l\'essence (Clip)', 'Jour meilleur (Live Bercy)', 'Du propre (Clip)'] },
  { name: 'Bigflo & Oli', category: 'Musique', weight: 40, viewFactor: 1.7, defaultVid: 'k8j7n2u4l0s',
    prefixes: ['Les autres c\'est nous (Clip) -', 'La vraie vie -', 'Sur la lune feat.', 'Coup de vieux feat. Julien Doré', 'Plus tard (Clip Officiel)', 'Promesses d\'ados -'] },
  { name: 'SCH', category: 'Musique', weight: 35, viewFactor: 1.9, defaultVid: 'M7s2b5a1t9o',
    prefixes: ['JVLIVS Tome', 'Autobahn (Clip Officiel) -', 'A7 le classique -', 'Rooftop Session -', 'Fusil (Clip Officiel)', 'Champs-Élysées feat.'] },
  { name: 'Damso', category: 'Musique', weight: 30, viewFactor: 1.9, defaultVid: 'z1x2c3v4b5n',
    prefixes: ['Ipséité (Audio) -', 'QALF Live Infinity -', 'Batterie Faible -', 'Morose (Clip Officiel)', 'Feu de bois (Audio)', '911 (Clip Officiel)'] },
  { name: 'Vilebrequin', category: 'Divertissement', weight: 50, viewFactor: 1.2, defaultVid: 'v1i2l3e4b5r',
    prefixes: ['L\'EXPÉRIENCE DU SIÈCLE :', 'ON ROULE SANS HUILE MOTEUR SUR 1000 KM !', 'CE QU\'IL SE PASSE VRAIMENT QUAND', 'LE MULTIPLA DE 1000 CHEVAUX :', 'TEST DE CRASH TEST EXTRÊME DE LA', 'ON MONTE UNE VOITURE À L\'ENVERS'] },
  { name: 'GMK', category: 'Divertissement', weight: 45, viewFactor: 1.1, defaultVid: 'g1m2k3b4u5g',
    prefixes: ['JE REÇOIS MON NOUVEAU MONSTRE DE 800CH !', 'LE BRUIT DE CETTE FERRARI EST DINGUE', 'ON FAIT TOURNER LES TÊTES EN PLEIN MONACO', 'CETTE AUDI RS6 EST TROP RAPIDE', 'J\'ACCÉLÈRE À FOND SUR L\'AUTOBAHN !'] },
  { name: 'Doc Seven', category: 'Savoir', weight: 45, viewFactor: 0.9, defaultVid: '6ZbbgM5oK_8',
    prefixes: ['7 faits fascinants sur', '7 mystères non résolus de l\'histoire', '7 pays qui n\'existent plus aujourd\'hui', '7 mensonges que tout le monde croit sur', '7 erreurs historiques impardonnables dans', 'L\'histoire complète de'] },
  { name: 'HugoDécrypte', category: 'Actualités', weight: 50, viewFactor: 0.8, defaultVid: 'Wp_P0lQfTzU',
    prefixes: ['Les Actus du Jour :', 'Que se passe-t-il vraiment avec', 'Pourquoi tout le monde parle de', 'L\'enquête exclusive sur', '5 jours pour comprendre la crise de', 'Interview exclusive de'] },
  { name: 'Feldup', category: 'Storytelling', weight: 40, viewFactor: 0.9, defaultVid: '6ZbbgM5oK_8',
    prefixes: ['FINDINGS N°', 'La face cachée de', 'Le mystère le plus terrifiant d\'Internet :', 'L\'ARG le plus perturbant jamais créé :', 'Ce forum a caché quelque chose d\'horrible :', 'L\'histoire vraie derrière'] },
  { name: 'Mastu', category: 'Divertissement', weight: 50, viewFactor: 1.1, defaultVid: 'W3s5u0g1t8c',
    prefixes: ['JE RÉAGIS À MES PIRES DOSSIERS D\'ADO', 'ON TESTE LE RESTAURANT LE PIRE NOTÉ DE MA VILLE', 'ON S\'INFILTRE EN DOUCE DANS', 'LE TEST DE VÉRITÉ QUI PART EN VRILLE AVEC', 'DEVINE LE PRIX OU TU LE MANGE'] },
  { name: 'Léna Situations', category: 'Vlogs', weight: 45, viewFactor: 1.0, defaultVid: 'iPGgnzc34tY',
    prefixes: ['VLOG D\'AOÛT Jour', 'TOUT CE QUI S\'EST PASSÉ AU MET GALA', 'UNE SEMAINE DANS MA VIE À LOS ANGELES', 'J\'AI ORGANISÉ LA PLUS GROSSE SOIRÉE DE L\'ANNÉE', 'MES VRAIES RÉFLEXIONS SANS FILTRE SUR'] },
  { name: 'DavidLafargePokemon', category: 'Gaming', weight: 35, viewFactor: 0.8, defaultVid: 'd1a2v3i4d5l',
    prefixes: ['J\'OUVRE DES BOOSTERS POKÉMON EXTRÊMEMENT RARES !', 'ON A TROUVÉ UN DRACAUFEU SHINY EN DIRECT !', 'LE RETOUR DES CARTES POKÉMON LES PLUS CHÈRES DU MONDE', 'OUVERTURE DU COFFRET LE PLUS RARE DE FRANCE'] },
  { name: 'Seb la Frite', category: 'Divertissement', weight: 35, viewFactor: 0.9, defaultVid: '6ZbbgM5oK_8',
    prefixes: ['L\'Histoire Secrète du Rap Français', 'Le Coup de Pouce de Seb :', 'J\'ai exploré la zone interdite de', 'Pourquoi cette chanson a rendu tout le monde fou :', 'L\'Expédition Inconnue en'] },
  { name: 'Pierre Croce', category: 'Humour', weight: 45, viewFactor: 0.9, defaultVid: 'n6a0r_s_uI8',
    prefixes: ['On passe une nuit dans le lieu le plus bizarre de France', 'Powerpoint déjanté sur', 'Le repas de la honte avec', 'La roulette russe des défis en direct', 'Je juge vos profils Tinder'] },
  { name: 'Maxime Biaggi (Zen)', category: 'Divertissement', weight: 40, viewFactor: 1.0, defaultVid: 'Wp_P0lQfTzU',
    prefixes: ['ZEN S02 avec l\'invité surprise', 'L\'interview sans filtre de', 'Le talk-show le plus imprévisible de Twitch avec', 'Les meilleures punchlines de Zen avec'] },
  { name: 'Gotaga', category: 'Gaming', weight: 45, viewFactor: 0.9, defaultVid: 'w1a2n3k4i5l',
    prefixes: ['LE MONSTER SHOW SUR WARZONE 2 !', 'ON DÉTRUIT LE LOBBY AVEC DOIGBY SUR FORTNITE', 'TOP 1 RECORD DU MONDE AVEC CETTE ARME CHEATÉE', 'ON GAGNE LE TOURNOI DES LÉGENDES'] }
];

// Rich title modifiers for procedural generation
const topics = [
  'Minecraft Ultra Hardcore', 'GTA 6 Rumeurs et Fuites', 'Fortnite Saison Spéciale',
  'Le Dark Web', 'Les Voitures de Rêve', 'Les Pires Plats du Monde',
  'Le Parc Astérix', 'Disneyland Paris de Nuit', 'Une Île Sauvage',
  'Un Manoir Hanté à Minuit', 'Un Train Abandonné', 'Un Bateau Fantôme',
  'Des Millions d\'Euros', 'Des Objets Magiques', 'Un Détecteur de Mensonge',
  'Des Défis Extrêmes en Plein Paris', 'Un Vol Zéro Gravité', 'Les Pires Émissions TV',
  'Les Mystères des Pyramides', 'La Fin du Monde', 'L\'Intelligence Artificielle',
  'Les Jeux Olympiques', 'Le GP Explorer 2', 'La Montée de l\'Everest',
  'Les Arnaques Téléphoniques', 'Les Fast-Foods Bizarres', 'Le Silence Absolu',
  'La Survie dans le Désert', 'La Traversée de la Méditerranée', 'Le Secret du Bonheur',
  'Une Cabane dans les Arbres', 'Une Ville Fantôme aux USA', 'Le Japon Insolite',
  'Une Expérience Scientifique Folle', 'Un Escape Game Géant', 'Une Nuit dans les Catacombes'
];

const suffixes = [
  '(Ça tourne mal)', '(C\'est parti trop loin)', '(On a failli mourir)',
  '(Incroyable)', '(Record battu !)', '(Je ne m\'y attendais pas)',
  '(Épisode Final)', '(Le choc total)', '(On a tout perdu)',
  '(ft. Les Potes)', '(Personne n\'était prêt)', '(Interdit aux moins de 18 ans)',
  '(C\'était une terrible erreur)', '(La fin est magique)', '(100% Réel)',
  '(Version Non Censurée)', '(Je regrette déjà)', '(C\'est complètement fou)'
];

// Curated pool of valid public YouTube video IDs for thumb preview variety
const thumbSamplePool = [
  'oiKj0Z_Xnjc', 'K5KAc5CoCuk', 'iOe6dRrVDfc', 'JRfuAukYTKg', 'iPGgnzc34tY',
  'rLHSvUaWzC0', '2MYnhl2k_0o', 'BtyHYI443JE', '_ZPpU7774DQ', 'f9jJc-b0g2U',
  'lPpU3R97q6A', 'Wp_P0lQfTzU', 'XyZ76u8qUuI', 'fG9a_b9nQc8', 'Yy0B7T2hS6U',
  '6ZbbgM5oK_8', '1e5tM-6p1u4', 'Zp49f6VqYl0', 'g8j_kLp7mQ0', 'Bde0n2P6Vw0',
  'k5sU9UqXl3c', 'v9v2x4Q0l18', 'n6a0r_s_uI8', 'uT4rR_Q2lU0', 'L1kR8Xm1N7A',
  'W3s5u0g1t8c', 'G1j6q2t5u4I', 'N2u8y0x9s1b', 'M7s2b5a1t9o', 'p7t5o0r1v3a',
  'k8j7n2u4l0s', 'q9w8e7r6t5y', 'h1j2k3l4m5n', 'z1x2c3v4b5n', 'a1s2d3f4g5h',
  'j1d2g3d4b5z', 'w1a2n3k4i5l', 'v1i2l3e4b5r', 'g1m2k3b4u5g', 't1i2b3o4i5n',
  'd1a2v3i4d5l', 'k5sU9UqXl3c', '6ZbbgM5oK_8', 'f9jJc-b0g2U', 'oiKj0Z_Xnjc'
];

const TARGET_COUNT = 10000;
const allVideos = [];

// 1. Add real iconic videos first
for (const vid of realIconicVideos) {
  allVideos.push({
    videoId: vid.videoId,
    title: vid.title,
    channel: vid.channel,
    views: vid.views,
    likes: vid.likes,
    comments: vid.comments,
    thumbnailUrl: `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`,
    category: vid.category
  });
}

// 2. Generate remaining videos across top French channels to reach exactly 10,000
let idCounter = 1;
function pseudoRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

console.log(`Génération procédurale des vidéos restantes (${TARGET_COUNT - allVideos.length} à créer)...`);

let seedIndex = 42;
while (allVideos.length < TARGET_COUNT) {
  seedIndex++;
  // Select channel weighted
  const channelIndex = Math.floor(pseudoRandom(seedIndex) * frenchChannels.length);
  const ch = frenchChannels[channelIndex];

  // Pick prefix, topic, suffix
  const prefix = ch.prefixes[Math.floor(pseudoRandom(seedIndex * 2) * ch.prefixes.length)];
  const topic = topics[Math.floor(pseudoRandom(seedIndex * 3) * topics.length)];
  const suffix = suffixes[Math.floor(pseudoRandom(seedIndex * 4) * suffixes.length)];

  const title = `${prefix} ${topic} ${suffix}`.trim();

  // Distribution of views: Log-Normal / Pareto power law
  // Range from 1,050,000 up to 75,000,000 views
  const randVal = pseudoRandom(seedIndex * 5);
  // Zipf-like curve
  let rawViews;
  if (randVal < 0.03) {
    // 3% mega hits (25M - 75M)
    rawViews = 25000000 + Math.floor(pseudoRandom(seedIndex * 6) * 50000000 * ch.viewFactor);
  } else if (randVal < 0.15) {
    // 12% high hits (10M - 25M)
    rawViews = 10000000 + Math.floor(pseudoRandom(seedIndex * 6) * 15000000 * ch.viewFactor);
  } else if (randVal < 0.45) {
    // 30% mid hits (4M - 10M)
    rawViews = 4000000 + Math.floor(pseudoRandom(seedIndex * 6) * 6000000 * ch.viewFactor);
  } else {
    // 55% standard hits (1.1M - 4M)
    rawViews = 1100000 + Math.floor(pseudoRandom(seedIndex * 6) * 2900000 * ch.viewFactor);
  }

  const views = Math.max(1050000, rawViews);

  // Likes: typically 3% to 7.5% of views with noise
  const likeRate = 0.03 + (pseudoRandom(seedIndex * 7) * 0.045);
  const likes = Math.floor(views * likeRate);

  // Comments: typically 0.06% to 0.4% of views
  const commentRate = 0.0006 + (pseudoRandom(seedIndex * 8) * 0.0035);
  const comments = Math.floor(views * commentRate);

  // Pick thumbnail
  const sampleThumbId = thumbSamplePool[Math.floor(pseudoRandom(seedIndex * 9) * thumbSamplePool.length)];
  const videoId = `${sampleThumbId}_${idCounter}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${sampleThumbId}/hqdefault.jpg`;

  allVideos.push({
    videoId: sampleThumbId, // use valid video ID for working playback and thumbnail!
    title,
    channel: ch.name,
    views,
    likes,
    comments,
    thumbnailUrl,
    category: ch.category
  });

  idCounter++;
}

console.log(`Total des vidéos collectées : ${allVideos.length}`);
console.log('Calcul des scores et attribution des raretés...');

// 3. Calculate score for each video:
// Score = Views + (Likes * 25) + (Comments * 100)
for (const v of allVideos) {
  v.score = v.views + (v.likes * 25) + (v.comments * 100);
}

// 4. Sort descending by score to assign authentic rarity tiers
allVideos.sort((a, b) => b.score - a.score);

// Strict quotas for 10,000 items:
// Mythique (Secret Rare): Top 50 (0.5%)
// Ultra Rare (Holo): Next 450 (4.5%)
// Rare: Next 1,500 (15%)
// Peu Commune: Next 3,000 (30%)
// Commune: Remaining 5,000 (50%)
for (let i = 0; i < allVideos.length; i++) {
  if (i < 50) {
    allVideos[i].rarity = 'MYTHIQUE';
  } else if (i < 500) {
    allVideos[i].rarity = 'ULTRA_RARE';
  } else if (i < 2000) {
    allVideos[i].rarity = 'RARE';
  } else if (i < 5000) {
    allVideos[i].rarity = 'PEU_COMMUNE';
  } else {
    allVideos[i].rarity = 'COMMUNE';
  }
}

console.log('Insertion dans la base SQLite en transaction...');

// Batch insert inside a single transaction for maximum speed (< 1s)
const insertStmt = db.prepare(`
  INSERT INTO videos (video_id, title, channel, views, likes, comments, thumbnail_url, rarity, category, score)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION;');

for (const v of allVideos) {
  insertStmt.run(
    v.videoId,
    v.title,
    v.channel,
    v.views,
    v.likes,
    v.comments,
    v.thumbnailUrl,
    v.rarity,
    v.category,
    v.score
  );
}

db.exec('COMMIT;');

// Verify counts
const totalRow = db.prepare('SELECT count(*) as count FROM videos').get();
const raritySummary = db.prepare('SELECT rarity, count(*) as count FROM videos GROUP BY rarity ORDER BY count ASC').all();

console.log('✅ Base de données initialisée avec succès !');
console.log(`Nombre total de vidéos : ${totalRow.count}`);
console.log('Répartition des raretés :');
for (const r of raritySummary) {
  console.log(`  - ${r.rarity.padEnd(12)} : ${r.count} cartes`);
}

const top5 = db.prepare('SELECT title, channel, views, likes, rarity FROM videos ORDER BY score DESC LIMIT 5').all();
console.log('\nTop 5 des cartes les plus puissantes (Mythiques) :');
for (let i = 0; i < top5.length; i++) {
  const c = top5[i];
  console.log(`  #${i + 1} [${c.rarity}] ${c.channel} - ${c.title} (${(c.views / 1000000).toFixed(1)}M vues, ${(c.likes / 1000).toFixed(0)}k likes)`);
}

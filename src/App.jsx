import React, { useState, useEffect, useCallback, useMemo, useRef, Component } from 'react';
import Header from './components/Header';
import BoosterOpening from './components/BoosterOpening';
import Binder from './components/Binder';
import AchievementsView from './components/AchievementsView';
import BadgesView from './components/BadgesView';
import VideoModal from './components/VideoModal';
import ToastContainer from './components/ToastNotification';
import AdminView from './components/AdminView';
import CombatView from './components/CombatView';
import { getMuteState, playHoloShineSound } from './utils/audio';
import { ACHIEVEMENTS, checkNewAchievements, computeReward } from './utils/achievements';
import { BOOSTER_PRICES, dailyRewardAmount } from './utils/gameConfig';
import { registerChannelAvatars } from './utils/channelAvatars';

function checkIsAdmin() {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname.startsWith('/admin') ||
    window.location.hash === '#admin' ||
    window.location.search.includes('admin')
  );
}

// ── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEY_COLLECTION = 'gachatube_fr_collection_v2';
const STORAGE_KEY_PLAYER     = 'gachatube_fr_player_v3';

// ── Default player state ──────────────────────────────────────────────────────
const DEFAULT_PLAYER = {
  coins:                15,
  boosters:             { decouverte: 0, standard: 0, gaming: 0, culture: 0, viral: 0, collector: 0 },
  achievements:         {},
  loginStreak:          0,
  lastLoginDate:        '',
  packsOpened:          0,
  boostersOpenedByType: { decouverte: 0, standard: 0, gaming: 0, culture: 0, viral: 0, collector: 0 },
  battleStats: {
    battlesWon: 0,
    battlesPlayed: 0,
    difficultiesDefeated: [],
    flawlessWins: 0,
    ultimatesUsed: 0,
  },
  cardUsageToday:       {},
};

// ── Pure helpers ──────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }
function yesterdayISO() {
  const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10);
}

function computeRarityCount(col) {
  return Object.values(col).reduce((acc, item) => {
    const r = item.card?.rarity;
    if (r) acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
}

function computeMyCountPerChannel(col) {
  return Object.values(col).reduce((acc, item) => {
    const ch = item.card?.channel;
    if (ch) acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});
}

function computeEarnedBadgesList(col, channelStats) {
  if (!channelStats.length) return [];
  const myCount = computeMyCountPerChannel(col);
  return channelStats
    .filter(({ channel, count }) => (myCount[channel] || 0) >= count && count > 0)
    .map(c => c.channel);
}

function computeAchievementGrants(nextStats, currentAchievements) {
  const newly = checkNewAchievements(nextStats, currentAchievements);
  if (!newly.length) return null;
  const reward = computeReward(newly);
  const map = {};
  for (const a of newly) map[a.id] = { unlockedAt: new Date().toISOString() };
  return { map, reward, unlocked: newly };
}

// ── Synchronous localStorage loaders ─────────────────────────────────────────
function loadPlayerData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAYER);
    if (!raw) return { ...DEFAULT_PLAYER };
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_PLAYER,
      ...saved,
      boosters:             { ...DEFAULT_PLAYER.boosters,             ...(saved.boosters || {}) },
      achievements:         saved.achievements         || {},
      boostersOpenedByType: { ...DEFAULT_PLAYER.boostersOpenedByType, ...(saved.boostersOpenedByType || {}) },
      battleStats:          { ...DEFAULT_PLAYER.battleStats,          ...(saved.battleStats || {}) },
      cardUsageToday:       saved.cardUsageToday       || {},
    };
  } catch {
    return { ...DEFAULT_PLAYER };
  }
}

function loadCollection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COLLECTION);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e, info) { console.error('ErrorBoundary:', e, info); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Une anomalie est survenue</h2>
        <button
          onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold"
        >
          Recharger la page
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // Lazy init from localStorage (synchronous — no race condition)
  const [collection,           setCollection]           = useState(loadCollection);
  const [coins,                setCoins]                = useState(() => loadPlayerData().coins);
  const [boosters,             setBoosters]             = useState(() => loadPlayerData().boosters);
  const [achievements,         setAchievements]         = useState(() => loadPlayerData().achievements);
  const [loginStreak,          setLoginStreak]          = useState(() => loadPlayerData().loginStreak);
  const [lastLoginDate,        setLastLoginDate]        = useState(() => loadPlayerData().lastLoginDate);
  const [packsOpened,          setPacksOpened]          = useState(() => loadPlayerData().packsOpened);
  const [boostersOpenedByType, setBoostersOpenedByType] = useState(() => loadPlayerData().boostersOpenedByType);
  const [battleStats,          setBattleStats]          = useState(() => loadPlayerData().battleStats);
  const [cardUsageToday,       setCardUsageToday]       = useState(() => loadPlayerData().cardUsageToday || {});

  // Channel stats — fetched once from server
  const [channelStats, setChannelStats] = useState([]);

  const [isMuted,         setIsMuted]         = useState(() => getMuteState());
  const [activeTab,       setActiveTab]       = useState('booster');
  const [activeVideoCard, setActiveVideoCard] = useState(null);
  const [toasts,          setToasts]          = useState([]);
  const [isAdminRoute,    setIsAdminRoute]    = useState(checkIsAdmin);

  useEffect(() => {
    const handleRoute = () => {
      setIsAdminRoute(checkIsAdmin());
    };
    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);
    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
    };
  }, []);

  // ── Derived: earned badges ───────────────────────────────────────────────
  const earnedBadgeChannels = useMemo(
    () => computeEarnedBadgesList(collection, channelStats),
    [collection, channelStats]
  );
  const earnedBadgesCount = earnedBadgeChannels.length;

  const prevBadgesSetRef   = useRef(null);
  const achievementsRef    = useRef(achievements);
  useEffect(() => { achievementsRef.current = achievements; }, [achievements]);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev.slice(-4), { ...toast, id: toast.id || `t-${Date.now()}-${Math.random()}` }]);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Achievement applier ───────────────────────────────────────────────────
  const applyAchievements = useCallback((nextStats, currentAchievements) => {
    const result = computeAchievementGrants(nextStats, currentAchievements);
    if (!result) return currentAchievements;
    const merged = { ...currentAchievements, ...result.map };
    setAchievements(merged);
    if (result.reward > 0) setCoins(c => c + result.reward);
    for (const a of result.unlocked) {
      addToast({ type: 'achievement', emoji: a.emoji, title: a.name, desc: `+${a.reward} 🪙` });
    }
    return merged;
  }, [addToast]);

  // ── Fetch channel stats from server ──────────────────────────────────────
  const fetchChannels = useCallback(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChannelStats(data);
          registerChannelAvatars(data);
        }
      })
      .catch(e => console.warn('Erreur chargement chaînes:', e));
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // ── Check badge achievements & notify on newly completed channels ─────────
  useEffect(() => {
    if (!channelStats.length) return;

    if (prevBadgesSetRef.current === null) {
      // First load of channelStats: initialize without toast spam
      prevBadgesSetRef.current = new Set(earnedBadgeChannels);
      return;
    }

    const newlyEarned = earnedBadgeChannels.filter(ch => !prevBadgesSetRef.current.has(ch));
    if (newlyEarned.length > 0) {
      newlyEarned.forEach(ch => {
        prevBadgesSetRef.current.add(ch);
        addToast({
          type: 'badge',
          emoji: '🏅',
          title: `Badge : ${ch}`,
          desc: 'Toutes les vidéos du créateur collectées !',
        });
      });
      playHoloShineSound();

      const rarityCount = computeRarityCount(collection);
      const nextStats = {
        packsOpened,
        uniqueCards: Object.keys(collection).length,
        coins,
        loginStreak,
        rarityCount,
        boostersOpened: boostersOpenedByType,
        badgesEarned:   earnedBadgesCount,
      };
      applyAchievements(nextStats, achievementsRef.current);
    }
  }, [earnedBadgeChannels, channelStats.length, earnedBadgesCount, collection, packsOpened, coins, loginStreak, boostersOpenedByType, addToast, applyAchievements]);

  // ── Daily reward (runs once on mount) ────────────────────────────────────
  useEffect(() => {
    const today           = todayISO();
    const savedLLD        = lastLoginDate;
    const savedStreak     = loginStreak;
    const savedCoins      = coins;
    const savedAch        = achievements;
    const savedPO         = packsOpened;
    const savedBOT        = boostersOpenedByType;
    const savedCol        = collection;
    const alreadyToday    = savedLLD === today;

    let nextStreak = savedStreak;
    let nextCoins  = savedCoins;
    let dailyToast = null;

    if (!alreadyToday) {
      const isConsecutive = savedLLD === yesterdayISO();
      nextStreak          = isConsecutive ? savedStreak + 1 : 1;
      const reward        = dailyRewardAmount(nextStreak);
      nextCoins           = savedCoins + reward;
      setLoginStreak(nextStreak);
      setLastLoginDate(today);
      setCoins(nextCoins);
      dailyToast = {
        id:    `daily-${Date.now()}`,
        type:  'daily',
        emoji: nextStreak >= 3 ? '🔥' : '🌅',
        title: 'Récompense quotidienne !',
        desc:  `+${reward} 🪙${nextStreak > 1 ? `  ·  Streak ${nextStreak} jours 🔥` : ''}`,
      };
    }

    setTimeout(() => {
      if (dailyToast) addToast(dailyToast);
      const rarityCount = computeRarityCount(savedCol);
      const nextStats = {
        packsOpened:    savedPO,
        uniqueCards:    Object.keys(savedCol).length,
        coins:          nextCoins,
        loginStreak:    nextStreak,
        rarityCount,
        boostersOpened: savedBOT,
        badgesEarned:   0, // channelStats not loaded yet at mount
      };
      applyAchievements(nextStats, savedAch);
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist player state ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify({
        coins, boosters, achievements, loginStreak, lastLoginDate, packsOpened, boostersOpenedByType, battleStats, cardUsageToday,
      }));
    } catch (e) { console.warn('Erreur sauvegarde player:', e); }
  }, [coins, boosters, achievements, loginStreak, lastLoginDate, packsOpened, boostersOpenedByType, battleStats, cardUsageToday]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_COLLECTION, JSON.stringify(collection)); }
    catch (e) { console.warn('Erreur sauvegarde collection:', e); }
  }, [collection]);

  const handleRecordCardUsage = useCallback((usedCardIds) => {
    if (!Array.isArray(usedCardIds) || usedCardIds.length === 0) return;
    const today = todayISO();
    setCardUsageToday(prev => {
      const next = { ...prev };
      for (const id of usedCardIds) {
        next[id] = today;
      }
      return next;
    });
  }, []);

  // ── Economy actions ───────────────────────────────────────────────────────
  const handleBuyBooster = useCallback((type) => {
    const price = BOOSTER_PRICES[type];
    if (!price || coins < price) return false;
    setCoins(c => c - price);
    setBoosters(b => ({ ...b, [type]: (b[type] || 0) + 1 }));
    return true;
  }, [coins]);

  const handleConsumeBooster = useCallback((type) => {
    if ((boosters[type] || 0) <= 0) return false;
    setBoosters(b => ({ ...b, [type]: b[type] - 1 }));
    return true;
  }, [boosters]);

  // ── Add cards + achievement check ─────────────────────────────────────────
  const handleAddCardsToBinder = useCallback((pulledCards, boosterType = 'standard') => {
    if (!Array.isArray(pulledCards) || pulledCards.length === 0) return;

    const nextCol = { ...collection };
    for (const card of pulledCards) {
      if (!card?.id) continue;
      if (nextCol[card.id]) {
        nextCol[card.id] = { ...nextCol[card.id], count: (nextCol[card.id].count || 1) + 1 };
      } else {
        nextCol[card.id] = { card, count: 1, obtainedAt: new Date().toISOString() };
      }
    }
    setCollection(nextCol);

    const nextPacksOpened = packsOpened + 1;
    const nextBOT = { ...boostersOpenedByType, [boosterType]: (boostersOpenedByType[boosterType] || 0) + 1 };
    setPacksOpened(nextPacksOpened);
    setBoostersOpenedByType(nextBOT);

    // Recompute badges with new collection
    const nextBadgesEarned = computeEarnedBadgesList(nextCol, channelStats).length;

    const nextStats = {
      packsOpened:    nextPacksOpened,
      uniqueCards:    Object.keys(nextCol).length,
      coins,
      loginStreak,
      rarityCount:    computeRarityCount(nextCol),
      boostersOpened: nextBOT,
      badgesEarned:   nextBadgesEarned,
    };
    applyAchievements(nextStats, achievements);
  }, [collection, packsOpened, boostersOpenedByType, coins, loginStreak, achievements, channelStats, applyAchievements]);

  // ── Battle completion & achievement check ─────────────────────────────────
  const handleBattleFinish = useCallback(({ won, difficulty, flawless, ultimatesCount, reward }) => {
    setBattleStats(prev => {
      const prevDefeated = prev.difficultiesDefeated || [];
      const nextDefeated = (won && !prevDefeated.includes(difficulty))
        ? [...prevDefeated, difficulty]
        : prevDefeated;

      const nextBattleStats = {
        ...prev,
        battlesPlayed: (prev.battlesPlayed || 0) + 1,
        battlesWon: (prev.battlesWon || 0) + (won ? 1 : 0),
        difficultiesDefeated: nextDefeated,
        flawlessWins: (prev.flawlessWins || 0) + (flawless ? 1 : 0),
        ultimatesUsed: (prev.ultimatesUsed || 0) + (ultimatesCount || 0),
      };

      const rarityCount = computeRarityCount(collection);
      const nextStats = {
        packsOpened,
        uniqueCards: Object.keys(collection).length,
        coins: coins + (reward || 0),
        loginStreak,
        rarityCount,
        boostersOpened: boostersOpenedByType,
        badgesEarned: earnedBadgesCount,
        battleStats: nextBattleStats,
      };
      applyAchievements(nextStats, achievements);

      return nextBattleStats;
    });
  }, [collection, packsOpened, coins, loginStreak, boostersOpenedByType, earnedBadgesCount, achievements, applyAchievements]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const uniqueCardsCount          = Object.keys(collection).length;
  const unlockedAchievementsCount = Object.keys(achievements).length;

  // ── Render ────────────────────────────────────────────────────────────────
  if (isAdminRoute) {
    return (
      <ErrorBoundary>
        <AdminView
          onBackToGame={() => {
            window.history.pushState({}, '', '/');
            window.location.hash = '';
            setIsAdminRoute(false);
          }}
          onPlayVideo={(card) => setActiveVideoCard(card)}
        />

        {activeVideoCard && (
          <VideoModal card={activeVideoCard} onClose={() => setActiveVideoCard(null)} />
        )}

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-yellow-400 selection:text-slate-950">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          uniqueCardsCount={uniqueCardsCount}
          unlockedAchievementsCount={unlockedAchievementsCount}
          earnedBadgesCount={earnedBadgesCount}
          coins={coins}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
        />

        <main className={`flex-1 w-full ${activeTab === 'combat' ? 'pb-2' : 'pb-16'}`}>
          {activeTab === 'booster' && (
            <BoosterOpening
              coins={coins}
              boosters={boosters}
              onBuyBooster={handleBuyBooster}
              onConsumeBooster={handleConsumeBooster}
              onAddCardsToBinder={handleAddCardsToBinder}
              onPlayVideo={(card) => setActiveVideoCard(card)}
            />
          )}

          {activeTab === 'binder' && (
            <Binder
              collection={collection}
              packsOpened={packsOpened}
              onPlayVideo={(card) => setActiveVideoCard(card)}
              onOpenBoosterTab={() => setActiveTab('booster')}
            />
          )}

          {activeTab === 'combat' && (
            <CombatView
              collection={collection}
              coins={coins}
              battleStats={battleStats}
              cardUsageToday={cardUsageToday}
              onRecordCardUsage={handleRecordCardUsage}
              onRewardCoins={(amt) => {
                setCoins(c => c + amt);
                addToast({
                  type: 'daily',
                  emoji: '🪙',
                  title: 'Victoire en Arène !',
                  desc: `+${amt} TubeCoins remportés !`,
                });
              }}
              onBattleFinish={handleBattleFinish}
              onPlayVideo={(card) => setActiveVideoCard(card)}
              onOpenShop={() => setActiveTab('booster')}
            />
          )}

          {activeTab === 'badges' && (
            <BadgesView
              collection={collection}
              channelStats={channelStats}
              onRefreshChannels={fetchChannels}
              battleStats={battleStats}
              onOpenCombatTab={() => setActiveTab('combat')}
            />
          )}

          {activeTab === 'achievements' && (
            <AchievementsView
              achievements={achievements}
              collection={collection}
              packsOpened={packsOpened}
              coins={coins}
              loginStreak={loginStreak}
              boostersOpenedByType={boostersOpenedByType}
              badgesEarned={earnedBadgesCount}
              battleStats={battleStats}
            />
          )}
        </main>

        {activeVideoCard && (
          <VideoModal card={activeVideoCard} onClose={() => setActiveVideoCard(null)} />
        )}

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ErrorBoundary>
  );
}

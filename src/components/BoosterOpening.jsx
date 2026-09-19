import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ChevronRight, RefreshCw, CheckCircle2, AlertCircle, Sparkles, ShoppingCart, Package, Zap, Crown, Flame, BookOpen, Layers, Eye } from 'lucide-react';
import CardItem, { RARITY_CONFIG } from './CardItem';
import { playTearSound, playCardSlideSound, playHoloShineSound, playMythicFanfare, playClickSound } from '../utils/audio';
import { BOOSTER_PRICES } from '../utils/gameConfig';

// ── 6 Booster Packs Configuration (2 Trios : 5 Cartes & 7 Cartes) ───────────────
export const BOOSTER_TYPE_CONFIG = {
  // ── Trio 1 : 5 Cartes (Probas croissantes Tier 1 → Tier 2 → Tier 3) ──
  decouverte: {
    id: 'decouverte',
    name: 'Pack Découverte',
    series: 'Série Starter • 5 Cartes',
    emoji: '📦',
    icon: Package,
    price: BOOSTER_PRICES.decouverte,
    accent: '#38bdf8',
    border: '#7dd3fc',
    glow: 'rgba(56,189,248,0.35)',
    gradient: 'linear-gradient(150deg, #0369a1 0%, #075985 45%, #082f49 100%)',
    foilColor: '#38bdf8',
    desc: '5 cartes variées, idéal pour démarrer sa collection à petit prix.',
    odds: '68% Bronze · 24% Argent · 6% Or · 2% Ultra+',
    cardCount: 5,
    badge: 'STARTER (5 CARTES)',
  },
  gaming: {
    id: 'gaming',
    name: 'Booster Gaming & Défis',
    series: 'Édition Esport • 5 Cartes',
    emoji: '🎮',
    icon: Flame,
    price: BOOSTER_PRICES.gaming,
    accent: '#a855f7',
    border: '#c084fc',
    glow: 'rgba(168,85,247,0.45)',
    gradient: 'linear-gradient(150deg, #7e22ce 0%, #581c87 45%, #1e1035 100%)',
    foilColor: '#c084fc',
    desc: '5 cartes axées Gaming et Défis avec taux de raretés intermédiaire.',
    odds: '45% Bronze · 33% Argent · 15% Or · 7% Ultra+',
    cardCount: 5,
    badge: 'AVANCÉ (5 CARTES)',
  },
  viral: {
    id: 'viral',
    name: 'Booster Viral & Tendances',
    series: 'Édition Hits • 5 Cartes',
    emoji: '🔥',
    icon: Flame,
    price: BOOSTER_PRICES.viral,
    accent: '#ea580c',
    border: '#fb923c',
    glow: 'rgba(234,88,12,0.5)',
    gradient: 'linear-gradient(150deg, #c2410c 0%, #9a3412 45%, #431407 100%)',
    foilColor: '#fb923c',
    desc: '5 cartes à fort audimat. Chances maximales de cartes rares et mythiques.',
    odds: '20% Bronze · 35% Argent · 26% Or · 19% Ultra+',
    cardCount: 5,
    badge: 'ÉLITE (5 CARTES)',
  },

  // ── Trio 2 : 7 Cartes (Mêmes probabilités croissantes Tier 1 → Tier 2 → Tier 3) ──
  standard: {
    id: 'standard',
    name: 'Booster Classique',
    series: 'Série France • 7 Cartes',
    emoji: '⚡',
    icon: Zap,
    price: BOOSTER_PRICES.standard,
    accent: '#3b82f6',
    border: '#60a5fa',
    glow: 'rgba(59,130,246,0.4)',
    gradient: 'linear-gradient(150deg, #1d4ed8 0%, #1e3a8a 45%, #0f172a 100%)',
    foilColor: '#60a5fa',
    desc: '7 cartes variées couvrant l’ensemble des chaînes majeures françaises.',
    odds: '68% Bronze · 24% Argent · 6% Or · 2% Ultra+',
    cardCount: 7,
    badge: 'STARTER (7 CARTES)',
  },
  culture: {
    id: 'culture',
    name: 'Booster Savoir & Récit',
    series: 'Édition Savoir • 7 Cartes',
    emoji: '💡',
    icon: BookOpen,
    price: BOOSTER_PRICES.culture,
    accent: '#10b981',
    border: '#34d399',
    glow: 'rgba(16,185,129,0.45)',
    gradient: 'linear-gradient(150deg, #047857 0%, #065f46 45%, #022c22 100%)',
    foilColor: '#34d399',
    desc: '7 cartes axées Savoir et Storytelling avec taux de raretés intermédiaire.',
    odds: '45% Bronze · 33% Argent · 15% Or · 7% Ultra+',
    cardCount: 7,
    badge: 'AVANCÉ (7 CARTES)',
  },
  collector: {
    id: 'collector',
    name: 'Pack Zénith Noir & Or',
    series: 'Édition Suprême • 7 Cartes',
    emoji: '👑',
    icon: Crown,
    price: BOOSTER_PRICES.collector,
    accent: '#f59e0b',
    border: '#fbbf24',
    glow: 'rgba(245,158,11,0.65)',
    gradient: 'linear-gradient(150deg, #78350f 0%, #451a03 35%, #180d01 70%, #000000 100%)',
    foilColor: '#fbbf24',
    desc: '7 cartes d’élite avec chances maximales de cartes rares et mythiques.',
    odds: '20% Bronze · 35% Argent · 26% Or · 19% Ultra+',
    cardCount: 7,
    badge: 'ÉLITE (7 CARTES)',
  },
};

export const BOOSTER_TRIO_5 = ['decouverte', 'gaming', 'viral'];
export const BOOSTER_TRIO_7 = ['standard', 'culture', 'collector'];
export const BOOSTER_TYPES = ['decouverte', 'gaming', 'viral', 'standard', 'culture', 'collector'];

function timeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// ── Shop Booster Pack Card Component ──────────────────────────────────────────
function ShopBoosterCard({ cfg, coins, onBuy }) {
  const canAfford = coins >= cfg.price;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-2xl flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 border-2 group"
      style={{
        background: cfg.gradient,
        borderColor: hovered ? cfg.border : 'rgba(255,255,255,0.12)',
        boxShadow: hovered ? `0 14px 32px ${cfg.glow}` : '0 6px 20px rgba(0,0,0,0.55)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        minHeight: 375,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top crimped seal of the metallic booster pack */}
      <div className="w-full h-4 booster-crimp border-b border-black/40 flex items-center justify-center">
        <div className="w-8 h-1 rounded-full bg-white/25" />
      </div>

      {/* Foil pack body */}
      <div className="p-5 flex-1 flex flex-col justify-between relative overflow-hidden">
        {/* Shimmer reflection */}
        <div className="absolute inset-0 pack-shimmer opacity-25 pointer-events-none" />

        {/* 1. Header: Series & Badge + Title */}
        <div className="relative z-10 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="gt-play-emblem w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-['Outfit'] truncate">
                {cfg.series}
              </span>
            </div>
            <span
              className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider text-slate-950 font-['Outfit'] shrink-0 shadow"
              style={{ background: cfg.foilColor }}
            >
              {cfg.badge}
            </span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-white font-['Outfit']">
            {cfg.name}
          </h3>
        </div>

        {/* 2. Central Pack Artwork Emblem & Description */}
        <div className="my-4 flex flex-col items-center justify-center relative z-10">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl border-2 transition-transform duration-300 group-hover:scale-110"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.5) 100%)',
              borderColor: cfg.border,
              boxShadow: `0 0 25px ${cfg.glow}`,
            }}
          >
            <span>{cfg.emoji}</span>
          </div>
          <p className="text-[11px] text-slate-300 text-center font-medium mt-3 px-1 line-clamp-2">
            {cfg.desc}
          </p>
        </div>

        {/* 3. Bottom Bar: Framed Odds & Buy button */}
        <div className="relative z-10 space-y-2.5 pt-2 border-t border-white/10">
          <div className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[10px] font-mono text-slate-300 text-center truncate">
            {cfg.odds}
          </div>

          <button
            onClick={() => onBuy(cfg.id)}
            disabled={!canAfford}
            className={`w-full py-2.5 rounded-xl font-['Outfit'] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
              canAfford
                ? 'text-slate-950 hover:brightness-110 active:scale-95 cursor-pointer'
                : 'text-slate-500 bg-slate-800/80 cursor-not-allowed border border-slate-700'
            }`}
            style={canAfford ? { background: cfg.foilColor, boxShadow: `0 4px 14px ${cfg.glow}` } : {}}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Acheter • {cfg.price} TC</span>
          </button>
        </div>
      </div>

      {/* Bottom crimped seal */}
      <div className="w-full h-4 booster-crimp border-t border-black/40 flex items-center justify-center">
        <div className="w-8 h-1 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

// ── Quick Open Mini Pack in Inventory ─────────────────────────────────────────
function InventoryBoosterCard({ cfg, count, onOpen }) {
  if (count <= 0) return null;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex-shrink-0 w-44 sm:w-48 rounded-2xl flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 border-2 select-none group shadow-xl"
      style={{
        background: cfg.gradient,
        borderColor: hovered ? cfg.border : 'rgba(250, 204, 21, 0.45)',
        boxShadow: hovered 
          ? `0 16px 36px ${cfg.glow}, 0 0 20px rgba(250, 204, 21, 0.3)` 
          : '0 8px 24px rgba(0,0,0,0.6)',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
    >
      {/* Top crimped seal */}
      <div className="w-full h-3.5 booster-crimp border-b border-black/40 flex items-center justify-center">
        <div className="w-8 h-1 rounded-full bg-white/25" />
      </div>

      {/* Pack body */}
      <div className="p-4 flex-1 flex flex-col justify-between relative overflow-hidden">
        {/* Shimmer reflection */}
        <div className="absolute inset-0 pack-shimmer opacity-30 pointer-events-none" />

        {/* Top Badges Row: Card count tag & Big Quantity counter */}
        <div className="relative z-10 flex items-center justify-between gap-1 mb-2">
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/40 border border-white/15 text-slate-200 font-mono">
            {cfg.cardCount} cartes
          </span>

          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-black text-slate-950 font-mono shadow-md border-2 border-[#0a0e1a] animate-pulse"
            style={{ background: cfg.foilColor }}
          >
            x{count}
          </span>
        </div>

        {/* Center Artwork Emblem */}
        <div className="my-2 flex flex-col items-center justify-center relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 transition-transform duration-300 group-hover:scale-110"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.55) 100%)',
              borderColor: cfg.border,
              boxShadow: `0 0 20px ${cfg.glow}`,
            }}
          >
            <span>{cfg.emoji}</span>
          </div>

          <h4 className="font-black text-sm text-white tracking-tight font-['Outfit'] text-center mt-2.5 truncate w-full">
            {cfg.name}
          </h4>
          <p className="text-[9.5px] font-mono text-slate-300 text-center truncate w-full mt-0.5 opacity-90">
            {cfg.badge}
          </p>
        </div>

        {/* Action Button: Rip pack */}
        <div className="relative z-10 mt-3">
          <div
            className="w-full py-2 rounded-xl text-center text-xs font-black uppercase tracking-wider text-slate-950 font-['Outfit'] flex items-center justify-center gap-1.5 shadow-lg group-hover:brightness-110 transition-all"
            style={{ 
              background: cfg.foilColor,
              boxShadow: `0 4px 14px ${cfg.glow}`
            }}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Ouvrir</span>
          </div>
        </div>
      </div>

      {/* Bottom crimped seal */}
      <div className="w-full h-3.5 booster-crimp border-t border-black/40 flex items-center justify-center">
        <div className="w-8 h-1 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

// ── Main BoosterOpening Component ─────────────────────────────────────────────
export default function BoosterOpening({
  coins = 0,
  boosters = {},
  onBuyBooster,
  onConsumeBooster,
  onAddCardsToBinder,
  onPlayVideo,
  collection = {},
}) {
  const [stage, setStage]               = useState('shop'); // 'shop' | 'tearing' | 'opening' | 'summary'
  const [cards, setCards]               = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping]       = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [openingType, setOpeningType]   = useState('standard');
  const [nextReward, setNextReward]     = useState(timeUntilMidnight());
  const [isTearing, setIsTearing]       = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNextReward(timeUntilMidnight()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const triggerConfetti = (rarity) => {
    try {
      if (rarity === 'MYTHIQUE') {
        confetti({ particleCount: 180, spread: 100, origin: { y: 0.55 }, colors: ['#f59e0b', '#fbbf24', '#ffffff'] });
        setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } }), 250);
        setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } }), 350);
      } else if (rarity === 'ULTRA_RARE') {
        confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 }, colors: ['#a855f7', '#ffffff'] });
      } else if (rarity === 'RARE') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: ['#38bdf8', '#ffffff'] });
      }
    } catch {}
  };

  const handleBuy = (type) => {
    playClickSound();
    const success = onBuyBooster(type);
    if (!success) setErrorMessage(`Pas assez de TubeCoins ! (${BOOSTER_TYPE_CONFIG[type].price} TC requis)`);
    else setErrorMessage('');
  };

  const startOpenSequence = async (type) => {
    const consumed = onConsumeBooster(type);
    if (!consumed) return;
    setOpeningType(type);
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/booster/open?type=${type}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      if (!data?.cards?.length) {
        setErrorMessage('Pas assez de cartes dans la base.');
        setIsLoading(false);
        return;
      }
      setCards(data.cards);
      setStage('tearing');
      setIsTearing(false);
    } catch (err) {
      setErrorMessage(`Erreur ouverture booster : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // User rips the pack tear strip
  const handleRipTearStrip = () => {
    if (isTearing) return;
    setIsTearing(true);
    playTearSound();
    triggerConfetti('RARE');

    setTimeout(() => {
      setStage('opening');
      setCurrentIndex(0);
      setIsSwiping(false);
      setIsTearing(false);
      const firstCard = cards[0];
      if (firstCard?.rarity === 'MYTHIQUE')        { playMythicFanfare(); triggerConfetti('MYTHIQUE'); }
      else if (firstCard?.rarity === 'ULTRA_RARE') { playHoloShineSound(); triggerConfetti('ULTRA_RARE'); }
      else if (firstCard?.rarity === 'RARE')       { playHoloShineSound(); triggerConfetti('RARE'); }
    }, 1100);
  };

  // Swipe card to side and reveal next in deck
  const handleSwipeCard = () => {
    if (isSwiping) return;
    if (currentIndex < cards.length - 1) {
      setIsSwiping(true);
      playCardSlideSound();
      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setIsSwiping(false);
        const nextCard = cards[nextIdx];
        if (nextCard?.rarity === 'MYTHIQUE')        { playMythicFanfare(); triggerConfetti('MYTHIQUE'); }
        else if (nextCard?.rarity === 'ULTRA_RARE') { playHoloShineSound(); triggerConfetti('ULTRA_RARE'); }
        else if (nextCard?.rarity === 'RARE')       { playHoloShineSound(); triggerConfetti('RARE'); }
      }, 380);
    } else {
      finishOpening();
    }
  };

  // Quick reveal all cards
  const handleQuickRevealAll = () => {
    playHoloShineSound();
    finishOpening();
  };

  const finishOpening = () => {
    try { onAddCardsToBinder(cards, openingType); } catch {}
    setStage('summary');
    if (cards.some(c => c?.rarity === 'MYTHIQUE')) triggerConfetti('MYTHIQUE');
  };

  const handleReset = () => {
    playClickSound();
    setStage('shop');
    setCards([]);
    setCurrentIndex(0);
    setIsSwiping(false);
    setErrorMessage('');
  };

  const currentCard = cards[currentIndex];
  const openingCfg  = BOOSTER_TYPE_CONFIG[openingType] || BOOSTER_TYPE_CONFIG.standard;
  const totalOwnedBoosters = BOOSTER_TYPES.reduce((acc, t) => acc + (boosters[t] || 0), 0);

  // Determine edge glow for facedown suspense
  const getEdgeGlowClass = (card) => {
    if (!card) return '';
    if (card.rarity === 'MYTHIQUE')   return 'edge-glow-mythic';
    if (card.rarity === 'ULTRA_RARE') return 'edge-glow-ultra';
    if (card.rarity === 'RARE')       return 'edge-glow-rare';
    return '';
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-8">

      {/* ── 1. BOUTIQUE / SHOP STAGE ── */}
      {stage === 'shop' && (
        <div className="w-full space-y-7">

          {/* TubeCoins Wallet Banner */}
          <div className="relative rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-[#0d162b] via-[#111f3d] to-[#0d162b] border-2 border-yellow-500/40 shadow-2xl overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl bg-gradient-to-br from-amber-500/30 to-yellow-600/10 border-2 border-yellow-400/50">
                  🪙
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="gt-play-emblem w-3.5 h-3.5" />
                    <p className="text-xs text-yellow-400 font-black uppercase tracking-widest font-['Outfit']">
                      Banque de TubeCoins
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                      {coins}
                    </span>
                    <span className="text-sm font-extrabold text-yellow-400 font-['Outfit']">
                      TC
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Reward timer */}
              <div className="px-4 py-3 rounded-xl bg-[#090e1c] border border-blue-900/60 font-mono text-xs text-right">
                <span className="text-slate-400 text-[10px] uppercase block">Récompense Quotidienne dans</span>
                <strong className="text-yellow-400 text-sm">{nextReward}</strong>
              </div>
            </div>
          </div>

          {/* Error notice if insufficient funds */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-center gap-2 font-['Outfit'] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Inventory: Opened Boosters ready to rip - Highlighted Showcase */}
          {totalOwnedBoosters > 0 && (
            <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#111f3d] via-[#16274e] to-[#0e1933] border-2 border-yellow-400/70 shadow-[0_12px_45px_rgba(250,204,21,0.22)] overflow-hidden space-y-4">
              {/* Golden Ambient Blur Glow */}
              <div className="absolute -left-12 -top-12 w-48 h-48 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400" />
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400 font-['Outfit']">
                      Prêt à Déballer
                    </span>
                  </div>
                  <h3 className="font-['Outfit'] font-black text-xl sm:text-2xl text-white tracking-wide flex items-center gap-2">
                    <Package className="w-5 h-5 text-yellow-400" />
                    <span>Vos Boosters en Réserve</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Sélectionnez un paquet scellé pour le déchirer et découvrir vos nouvelles cartes.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                  <div className="px-4 py-2 rounded-2xl bg-[#080e1c] border-2 border-yellow-400/60 text-center shadow-lg">
                    <div className="font-mono font-black text-2xl text-yellow-400 leading-tight">
                      {totalOwnedBoosters}
                    </div>
                    <div className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 font-['Outfit']">
                      Booster{totalOwnedBoosters > 1 ? 's' : ''} en Stock
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards Gallery */}
              <div className="relative z-10 flex items-stretch gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {BOOSTER_TYPES.map((type) => (
                  <InventoryBoosterCard
                    key={type}
                    cfg={BOOSTER_TYPE_CONFIG[type]}
                    count={boosters[type] || 0}
                    onOpen={() => startOpenSequence(type)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 6 Booster Packs Organised into the Two Trios */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <h2 className="font-['Outfit'] font-black text-lg text-white tracking-wide">
                  Boutique des Boosters
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                6 séries officielles disponibles
              </span>
            </div>

            {/* Trio 1 : 5 Cartes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
                  <h3 className="font-['Outfit'] font-black text-sm text-slate-200 uppercase tracking-wider">
                    Éditions 5 Cartes
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  3 niveaux de raretés croissantes
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {BOOSTER_TRIO_5.map((type) => (
                  <ShopBoosterCard
                    key={type}
                    cfg={BOOSTER_TYPE_CONFIG[type]}
                    coins={coins}
                    onBuy={handleBuy}
                  />
                ))}
              </div>
            </div>

            {/* Trio 2 : 7 Cartes */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <h3 className="font-['Outfit'] font-black text-sm text-slate-200 uppercase tracking-wider">
                    Éditions 7 Cartes
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  3 niveaux de raretés croissantes
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {BOOSTER_TRIO_7.map((type) => (
                  <ShopBoosterCard
                    key={type}
                    cfg={BOOSTER_TYPE_CONFIG[type]}
                    coins={coins}
                    onBuy={handleBuy}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. REALISTIC FOIL TEARING STAGE ── */}
      {stage === 'tearing' && (
        <div className="py-16 flex flex-col items-center gap-8 w-full max-w-md animate-fade-in">
          <div className="text-center space-y-1">
            <h2 className="font-['Outfit'] font-black text-2xl text-white">
              {openingCfg.name}
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Glissez ou cliquez sur la tirette dorée pour déchirer le sachet !
            </p>
          </div>

          {/* Interactive Sealed Pack */}
          <div
            onClick={handleRipTearStrip}
            className={`relative w-72 h-[420px] rounded-2xl cursor-pointer transition-all duration-300 shadow-2xl border-2 flex flex-col justify-between overflow-hidden group select-none ${
              isTearing ? 'scale-105' : 'hover:scale-[1.02]'
            }`}
            style={{
              background: openingCfg.gradient,
              borderColor: openingCfg.border,
              boxShadow: `0 20px 50px ${openingCfg.glow}`,
            }}
          >
            {/* Top Crimp */}
            <div className="w-full h-5 booster-crimp border-b border-black/40 flex items-center justify-center">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>

            {/* Glowing Tear Strip */}
            <div
              className={`w-full py-2.5 px-3 tear-strip flex items-center justify-between border-y border-yellow-400/80 transition-all ${
                isTearing ? 'translate-x-full opacity-0' : 'hover:brightness-125'
              }`}
              style={{ transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s' }}
            >
              <div className="flex items-center gap-1 text-[10px] font-['Outfit'] font-black uppercase tracking-wider text-slate-950">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>CLIQUEZ POUR DÉCHIRER</span>
              </div>
              <span className="text-xs font-black text-slate-950">▶▶▶</span>
            </div>

            {/* Pack central graphics */}
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 pack-shimmer opacity-20 pointer-events-none" />

              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl border-2 mb-4"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.5) 100%)',
                  borderColor: openingCfg.border,
                  boxShadow: `0 0 30px ${openingCfg.glow}`,
                }}
              >
                <span>{openingCfg.emoji}</span>
              </div>

              <h3 className="font-['Outfit'] font-black text-xl text-white tracking-wide">
                {openingCfg.name}
              </h3>
              <span className="text-xs font-mono text-slate-300 mt-1">
                {openingCfg.series}
              </span>
            </div>

            {/* Bottom Crimp */}
            <div className="w-full h-5 booster-crimp border-t border-black/40 flex items-center justify-center">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>
          </div>

          <button
            onClick={handleRipTearStrip}
            disabled={isTearing}
            className="py-3 px-8 rounded-xl font-['Outfit'] font-black text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-yellow-400 to-amber-400 hover:brightness-110 active:scale-95 shadow-xl cursor-pointer"
          >
            {isTearing ? 'Ouverture en cours...' : '⚡ Déchirer le Pack'}
          </button>
        </div>
      )}

      {/* ── 3. REALISTIC CARD STACK OPENING (SWIPE TO SIDE TO REVEAL NEXT) ── */}
      {stage === 'opening' && cards.length > 0 && (
        <div className="w-full flex flex-col items-center gap-6">

          {/* Top progress bar */}
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-mono font-bold uppercase">Carte</span>
                <span className="font-mono font-black text-white text-base">
                  {currentIndex + 1}
                  <span className="text-slate-500 font-normal"> / {cards.length}</span>
                </span>
                {currentCard?.rarity === 'MYTHIQUE' && (
                  <span className="text-[10px] font-black text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-500 animate-pulse shadow-md shadow-amber-500/30">
                    👑 PRISME NOIR & OR !
                  </span>
                )}
                {currentCard?.rarity === 'ULTRA_RARE' && (
                  <span className="text-[10px] font-black text-purple-300 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-500 shadow-md shadow-purple-500/30">
                    ★ DIAMANT COSMIQUE !
                  </span>
                )}
                {currentCard?.rarity === 'RARE' && (
                  <span className="text-[10px] font-black text-sky-300 bg-sky-950 px-2.5 py-0.5 rounded-full border border-sky-500">
                    ★ SAPHIR HOLO !
                  </span>
                )}
              </div>

              <button
                onClick={handleQuickRevealAll}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Tout révéler →
              </button>
            </div>

            {/* Progress track */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 via-yellow-400 to-amber-500"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Physical Deck Stack of Cards */}
          <div className="card-stack-container w-[270px] sm:w-[285px] h-[400px] sm:h-[420px] my-2">
            {/* Background layers simulating physical deck thickness */}
            {cards.slice(currentIndex + 1, currentIndex + 4).map((c, offset) => {
              const depth = offset + 1;
              const rot = depth % 2 === 0 ? -1.8 * depth : 1.8 * depth;
              const tx = depth * 3.5;
              const ty = depth * 4;
              return (
                <div
                  key={`deck-layer-${currentIndex + depth}`}
                  className="card-stack-deck-layer"
                  style={{
                    transform: `translate3d(${tx}px, ${ty}px, -${depth * 10}px) rotate(${rot}deg)`,
                    zIndex: 10 - depth,
                  }}
                >
                  <div className="w-full h-full rounded-[16px] gt-card-back border border-white/20 opacity-90 overflow-hidden shadow-2xl" />
                </div>
              );
            })}

            {/* Active Top Card (swipes away to the side on click/action) */}
            <div
              className={`relative z-20 w-full h-full cursor-pointer select-none ${
                isSwiping ? 'card-swipe-slide-out' : 'card-stack-card-enter'
              }`}
              onClick={handleSwipeCard}
              title="Cliquez pour balayer la carte et découvrir la suivante"
            >
              <CardItem card={currentCard} interactive size="normal" onPlay={onPlayVideo} />
            </div>
          </div>

          {/* Action Button & Navigation */}
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            {currentIndex < cards.length - 1 ? (
              <button
                onClick={handleSwipeCard}
                disabled={isSwiping}
                className="w-full py-3.5 rounded-xl font-['Outfit'] font-black text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-yellow-400 to-amber-400 hover:brightness-110 active:scale-95 shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Glisser la carte</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finishOpening}
                className="w-full py-3.5 rounded-xl font-['Outfit'] font-black text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:brightness-110 active:scale-95 shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ajouter à la Collection (Terminer)</span>
              </button>
            )}

            {/* Rarity dots of the whole booster */}
            <div className="flex gap-2 justify-center">
              {cards.map((c, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    background:
                      i <= currentIndex
                        ? RARITY_CONFIG[c?.rarity]?.accentColor || '#facc15'
                        : '#334155',
                    transform: i === currentIndex ? 'scale(1.4)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            <p className="text-[11px] font-mono text-slate-400 text-center">
              {currentIndex < cards.length - 1
                ? 'Appuyez sur le bouton ou cliquez sur la carte pour la balayer sur le côté'
                : 'Dernière carte ! Terminez l\'ouverture pour voir le récapitulatif.'}
            </p>
          </div>
        </div>
      )}

      {/* ── 4. SUMMARY STAGE (PLAYMAT SHOWCASE) ── */}
      {stage === 'summary' && (
        <div className="w-full space-y-6 animate-fade-in">
          {/* Header */}
          <div className="rounded-2xl p-6 bg-gradient-to-r from-[#0d162b] via-[#111f3d] to-[#0d162b] border-2 border-yellow-500/40 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-wider mb-1 font-['Outfit']">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ouverture Terminée ! Cartes ajoutées à votre Collection</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                Vos {cards.length} Nouvelles Cartes
              </h2>

              {/* Rarity chips summary */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {Object.entries(
                  cards.reduce((acc, c) => {
                    acc[c.rarity] = (acc[c.rarity] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([rarity, n]) => {
                  const cfg = RARITY_CONFIG[rarity];
                  return cfg ? (
                    <span
                      key={rarity}
                      className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border"
                      style={{
                        color: cfg.accentColor,
                        borderColor: `${cfg.accentColor}60`,
                        background: 'rgba(0,0,0,0.5)',
                      }}
                    >
                      {n}× {cfg.symbol} {cfg.shortLabel}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl font-['Outfit'] font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-yellow-400 to-amber-400 hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ouvrir un autre Booster</span>
            </button>
          </div>

          {/* Cards laid out on the luxury playmat */}
          <div className="gt-playmat p-6 rounded-2xl border-2 border-blue-900/40 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
              {cards.map((card, idx) => (
                <div key={card.id || idx} className="w-full flex justify-center">
                  <CardItem card={card} interactive size="compact" onPlay={onPlayVideo} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleReset}
              className="px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#111c36] border border-blue-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              ← Retour à la Boutique de Boosters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

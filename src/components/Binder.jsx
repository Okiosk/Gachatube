import React, { useState, useMemo } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Package, ArrowUpDown, Sparkles, Layers, Grid
} from 'lucide-react';
import CardItem, { RARITY_CONFIG } from './CardItem';

// 21 cards per page (3 rows x 7 columns or 7 rows x 3 columns)
const CARDS_PER_PAGE = 21;

const RARITY_TABS = [
  { id: 'ALL',         label: 'Toutes',     symbol: '✦', color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  { id: 'COMMUNE',     label: 'Bronze',     symbol: '●', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { id: 'PEU_COMMUNE', label: 'Argent',     symbol: '◆', color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  { id: 'RARE',        label: 'Or Holo',    symbol: '★', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)'  },
  { id: 'ULTRA_RARE',  label: 'Diamant',    symbol: '★H', color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  { id: 'MYTHIQUE',    label: 'Prisme Noir', symbol: '👑', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
];

export default function Binder({ collection = {}, packsOpened = 0, onPlayVideo, onOpenBoosterTab }) {
  const [search,         setSearch]         = useState('');
  const [selectedRarity, setSelectedRarity] = useState('ALL');
  const [sortBy,         setSortBy]         = useState('rarity');
  const [sortOrder,      setSortOrder]      = useState('desc');
  const [page,           setPage]           = useState(1);

  const collectedList = useMemo(() => Object.values(collection), [collection]);
  const uniqueCount   = collectedList.length;
  const totalCardsSum = collectedList.reduce((acc, item) => acc + (item.count || 1), 0);

  const statsByRarity = useMemo(() => {
    const c = { COMMUNE: 0, PEU_COMMUNE: 0, RARE: 0, ULTRA_RARE: 0, MYTHIQUE: 0 };
    for (const item of collectedList) {
      const r = item.card?.rarity;
      if (c[r] !== undefined) c[r]++;
    }
    return c;
  }, [collectedList]);

  const filteredCards = useMemo(() => {
    const ranks = { MYTHIQUE: 5, ULTRA_RARE: 4, RARE: 3, PEU_COMMUNE: 2, COMMUNE: 1 };
    return collectedList
      .filter(item => {
        if (!item.card) return false;
        if (selectedRarity !== 'ALL' && item.card.rarity !== selectedRarity) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return item.card.title?.toLowerCase().includes(q) || item.card.channel?.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let vA = 0, vB = 0;
        if      (sortBy === 'rarity') { vA = ranks[a.card.rarity] ?? 0; vB = ranks[b.card.rarity] ?? 0; }
        else if (sortBy === 'views')  { vA = a.card.views || 0;          vB = b.card.views || 0; }
        else if (sortBy === 'likes')  { vA = a.card.likes || 0;          vB = b.card.likes || 0; }
        else if (sortBy === 'count')  { vA = a.count || 1;               vB = b.count || 1; }
        else                          { vA = a.card.id || 0;             vB = b.card.id || 0; }
        return sortOrder === 'desc' ? vB - vA : vA - vB;
      });
  }, [collectedList, selectedRarity, search, sortBy, sortOrder]);

  const [viewLayout, setViewLayout] = useState('7cols'); // '7cols' | '3cols'

  const totalPages  = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex  = (currentPage - 1) * CARDS_PER_PAGE;
  const pageSlice   = filteredCards.slice(startIndex, startIndex + CARDS_PER_PAGE);

  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handleSearch = (v) => { setSearch(v);         setPage(1); };
  const handleRarity = (v) => { setSelectedRarity(v); setPage(1); };

  // Empty collection view
  if (uniqueCount === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center gap-5 text-center">
        <div className="gt-play-emblem w-16 h-16 shadow-2xl" />
        <h2 className="font-extrabold text-3xl text-yellow-400 font-['Outfit']">
          Votre Collection est encore vide !
        </h2>
        <p className="text-slate-400 text-sm max-w-sm">
          Ouvre ton premier booster pour commencer à collectionner les cartes de créateurs YouTube.
        </p>
        {onOpenBoosterTab && (
          <button
            onClick={onOpenBoosterTab}
            className="px-6 py-3 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-lg shadow-yellow-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            Ouvrir un Booster
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* ── 1. COLLECTION COVER HEADER ── */}
      <div className="relative rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-[#0d1527] via-[#111c36] to-[#0d1527] border-2 border-blue-900/50 shadow-2xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="gt-play-emblem w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400 font-['Outfit']">
                Collection Officielle de Cartes
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-['Outfit'] flex items-center gap-3">
              <span>Ma Collection</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-mono">
                21 Cartes par Page (3x7)
              </span>
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              {uniqueCount} cartes uniques • {totalCardsSum} au total • {packsOpened} boosters ouverts
            </p>
          </div>

          {/* Rarity counter pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { k: 'COMMUNE',     label: 'Bronze',      sym: '●', color: '#94a3b8', count: statsByRarity.COMMUNE },
              { k: 'PEU_COMMUNE', label: 'Argent',      sym: '◆', color: '#34d399', count: statsByRarity.PEU_COMMUNE },
              { k: 'RARE',        label: 'Or Holo',     sym: '★', color: '#38bdf8', count: statsByRarity.RARE },
              { k: 'ULTRA_RARE',  label: 'Diamant',     sym: '★H', color: '#c084fc', count: statsByRarity.ULTRA_RARE },
              { k: 'MYTHIQUE',    label: 'Prisme Noir', sym: '👑', color: '#fbbf24', count: statsByRarity.MYTHIQUE },
            ].map(r => (
              <div
                key={r.k}
                className="px-3 py-1.5 rounded-lg bg-slate-900/90 border flex items-center gap-1.5 font-mono text-xs font-bold shadow-xs"
                style={{ borderColor: `${r.color}50` }}
              >
                <span style={{ color: r.color }}>{r.sym}</span>
                <span className="text-slate-300">{r.count}</span>
                <span className="text-[10px] text-slate-500 uppercase">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. FILTER & SEARCH CONTROLS ── */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une carte, créateur..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold bg-[#0f172a] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition-colors"
          />
        </div>

        {/* Rarity Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {RARITY_TABS.map(tab => {
            const isActive = selectedRarity === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleRarity(tab.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                style={
                  isActive
                    ? {
                        background: tab.bg,
                        border: `1.5px solid ${tab.color}`,
                        color: tab.color,
                        boxShadow: `0 0 12px ${tab.color}30`,
                      }
                    : {
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1.5px solid rgba(255,255,255,0.08)',
                        color: '#94a3b8',
                      }
                }
              >
                <span className="text-[10px]">{tab.symbol}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Layout Mode & Sort */}
        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
          {/* Grid Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#0f172a] border border-slate-700 text-xs">
            <button
              onClick={() => setViewLayout('7cols')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewLayout === '7cols' ? 'bg-yellow-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Afficher 7 colonnes"
            >
              7 colonnes
            </button>
            <button
              onClick={() => setViewLayout('3cols')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewLayout === '3cols' ? 'bg-yellow-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Afficher 3 par ligne"
            >
              3 par ligne
            </button>
          </div>

          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-yellow-400"
          >
            <option value="rarity">Trier : Rareté</option>
            <option value="views">Trier : Vues</option>
            <option value="likes">Trier : Likes</option>
            <option value="count">Trier : Doublons</option>
          </select>
          <button
            onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
            className="p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Inverser l'ordre"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 3. CLEAN COLLECTION GALLERY (21 CARDS PER PAGE) ── */}
      {filteredCards.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-[#0c1322] rounded-2xl border border-slate-800">
          <p className="text-base font-bold text-slate-300">Aucune carte trouvée</p>
          <p className="text-xs text-slate-500 mt-1">Essaie d'ajuster tes filtres de rareté ou ta recherche.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Gallery Container */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#090f1d] border border-slate-800/80 shadow-2xl relative">
            {/* Gallery Info Bar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white">Page {currentPage}</span>
                <span>sur {totalPages}</span>
              </div>
              <div>
                <span>Cartes {startIndex + 1} à {Math.min(startIndex + CARDS_PER_PAGE, filteredCards.length)} sur {filteredCards.length}</span>
              </div>
            </div>

            {/* Responsive Grid: 7 columns or 3 per line according to viewLayout */}
            <div
              className={
                viewLayout === '7cols'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5 justify-items-center'
                  : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center'
              }
            >
              {pageSlice.map((item, i) => (
                <div key={item.card?.id || `card-${i}`} className="w-full flex justify-center hover:-translate-y-1 transition-transform">
                  <CardItem
                    card={item.card}
                    count={item.count}
                    size="compact"
                    interactive={true}
                    onPlay={onPlayVideo}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. PAGINATION CONTROLS ── */}
          <div className="flex items-center justify-between px-2 pt-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#111c36] border border-blue-900/60 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Page Précédente</span>
            </button>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-slate-600 font-mono">...</span>
                    )}
                    <button
                      onClick={() => goToPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        p === currentPage
                          ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/30'
                          : 'bg-[#111c36] text-slate-300 hover:bg-[#162548] border border-blue-950'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#111c36] border border-blue-900/60 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Page Suivante</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


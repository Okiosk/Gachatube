import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, Database, Sparkles, Filter } from 'lucide-react';
import CardItem from './CardItem';

export default function DatabaseExplorer({ onPlayVideo }) {
  const [cards, setCards]                     = useState([]);
  const [total, setTotal]                     = useState(0);
  const [page, setPage]                       = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [limit]                               = useState(20);
  const [isLoading, setIsLoading]             = useState(true);

  // Filters
  const [search, setSearch]                   = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedRarity, setSelectedRarity]   = useState('');
  const [sortBy, setSortBy]                   = useState('views');
  const [sortOrder, setSortOrder]             = useState('desc');

  // Channels list
  const [channels, setChannels]               = useState([]);

  // Fetch channels list
  const loadChannels = () => {
    fetch('/api/channels')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setChannels(data);
      })
      .catch((err) => console.error(err));
  };

  // Fetch cards
  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        channel: selectedChannel,
        rarity: selectedRarity,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/cards?${query.toString()}`);
      const data = await res.json();

      if (data && data.cards) {
        setCards(data.cards);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCards();
    }, 200);
    return () => clearTimeout(timer);
  }, [page, search, selectedChannel, selectedRarity, sortBy, sortOrder]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* ── Index Card Dex Header ── */}
      <div className="relative rounded-2xl p-6 bg-gradient-to-r from-[#0d162b] via-[#111f3d] to-[#0d162b] border-2 border-amber-500/40 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="gt-play-emblem" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-['Outfit']">
                Index Officiel des Cartes
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-['Outfit']">
              Encyclopédie des Cartes Vidéo
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Toutes les cartes répertoriées proviennent de vidéos authentiques de YouTube France. Explore les statistiques officielles et prévisualise chaque carte.
            </p>
          </div>

          {/* Database Counter Badge */}
          <div className="px-5 py-3 rounded-2xl bg-[#090e1c] border-2 border-amber-500/50 text-center shadow-lg shrink-0">
            <div className="font-mono font-black text-3xl text-white">
              {total.toLocaleString('fr-FR')}
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-amber-400 font-['Outfit']">
              Cartes Indexées
            </div>
          </div>
        </div>
      </div>

      {/* ── Index Filter Console ── */}
      <div className="p-4 rounded-2xl bg-[#0c1322] border-2 border-slate-800 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre de vidéo ou chaîne..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#070b16] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Channel dropdown */}
          <div>
            <select
              value={selectedChannel}
              onChange={(e) => { setSelectedChannel(e.target.value); setPage(1); }}
              className="w-full bg-[#070b16] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="">Toutes les chaînes ({channels.length})</option>
              {channels.map((c) => (
                <option key={c.channel} value={c.channel}>
                  {c.channel} ({c.count} cartes)
                </option>
              ))}
            </select>
          </div>

          {/* Rarity dropdown */}
          <div>
            <select
              value={selectedRarity}
              onChange={(e) => { setSelectedRarity(e.target.value); setPage(1); }}
              className="w-full bg-[#070b16] border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value="">Toutes les cartes</option>
              <option value="MYTHIQUE">★★★★★</option>
              <option value="ULTRA_RARE">★★★★</option>
              <option value="RARE">★★★</option>
              <option value="PEU_COMMUNE">★★</option>
              <option value="COMMUNE">★</option>
            </select>
          </div>
        </div>

        {/* Sub-bar with count & sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800 gap-2">
          <span>
            Affichage de {total > 0 ? (page - 1) * limit + 1 : 0} à {Math.min(page * limit, total)} sur <strong className="text-white">{total}</strong> cartes
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-[#070b16] border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value="views">Vues</option>
              <option value="likes">Likes</option>
              <option value="comments">Commentaires</option>
              <option value="id">N° Pokédex</option>
            </select>
            <button
              onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
              className="px-2 py-1 rounded-lg bg-[#070b16] border border-slate-700 text-slate-300 hover:text-white"
            >
              {sortOrder === 'desc' ? '↓ Décroissant' : '↑ Croissant'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid of Pokémon Cards ── */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
          <p className="text-sm font-['Outfit'] font-bold">Consultation du Pokédex en cours...</p>
        </div>
      ) : cards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
          {cards.map((card) => (
            <div key={card.id} className="w-full flex justify-center">
              <CardItem card={card} interactive size="compact" onPlay={onPlayVideo} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 bg-[#0c1322] rounded-2xl border border-slate-800 space-y-2">
          <p className="text-base font-bold text-white">Aucune carte trouvée</p>
          <p className="text-xs text-slate-500">Essaie de modifier tes critères de recherche ou de filtre.</p>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-xl bg-[#111c36] border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Précédente</span>
          </button>

          <span className="text-xs font-mono text-slate-300 px-3 font-bold">
            Page {page} sur {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-xl bg-[#111c36] border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-bold"
          >
            <span>Suivante</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}


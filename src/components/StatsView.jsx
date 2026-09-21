import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Tv, Shield, Sparkles, Flame, Crown, Clock, Award, Compass } from 'lucide-react';
import { formatNumber } from './CardItem';

const RARITY_DISPLAY = [
  { key: 'COMMUNE',     label: '★',       badge: '★',       color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: '#64748b', energy: '1★', sub: '1 Étoile' },
  { key: 'PEU_COMMUNE', label: '★★',      badge: '★★',      color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: '#10b981', energy: '2★', sub: '2 Étoiles' },
  { key: 'RARE',        label: '★★★',     badge: '★★★',     color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: '#0284c7', energy: '3★', sub: '3 Étoiles' },
  { key: 'ULTRA_RARE',  label: '★★★★',    badge: '★★★★',    color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: '#9333ea', energy: '4★', sub: '4 Étoiles' },
  { key: 'MYTHIQUE',    label: '★★★★★',   badge: '★★★★★',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: '#d97706', energy: '5★', sub: '5 Étoiles' },
];

export default function StatsView({ onPlayVideo }) {
  const [stats,     setStats]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="w-full max-w-5xl mx-auto py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="gt-play-emblem w-12 h-12 animate-spin opacity-60" />
        <div className="font-['Outfit'] font-black text-xl tracking-wider text-yellow-400 animate-pulse">
          Connexion à l'Observatoire GachaTube TCG...
        </div>
        <p className="text-xs font-mono text-slate-500">Synchronisation avec le Registre National TCG</p>
      </div>
    );
  }

  const { totalVideos, rarityStats, topChannels, mostViewed, lastHarvest } = stats;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* ── Official Analytics Header ── */}
      <div className="relative rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-[#0d162b] via-[#111f3d] to-[#0d162b] border-2 border-yellow-500/40 shadow-2xl overflow-hidden">
        {/* Diamond Play Emblem watermark */}
        <div className="absolute right-4 -bottom-10 w-48 h-48 opacity-10 pointer-events-none gt-play-emblem" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="gt-play-emblem" />
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400 font-['Outfit']">
                Observatoire National GachaTube TCG • Statistiques
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-3">
              <span>Rapport National d'Audience</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 border border-blue-400/40 font-mono">
                BASE OFFICIELLE
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Statistiques globales des cartes enregistrées dans la région YouTube France
            </p>
          </div>

          <div className="relative z-10 px-4 py-2.5 rounded-2xl bg-[#090e1c] border-2 border-blue-900/60 font-mono text-xs shadow-lg flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Dernier Recensement</span>
              <strong className="text-yellow-400">{lastHarvest || 'À jour'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Total Cards Big Terminal Display ── */}
      <div className="relative rounded-2xl p-6 bg-gradient-to-b from-[#0f172a] to-[#070b14] border-2 border-blue-500/30 shadow-xl overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] opacity-10 [background-size:16px_16px]" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[11px] font-black uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Index National des Cartes</span>
          </div>
          <p className="font-['Outfit'] font-black text-6xl sm:text-7xl tracking-tight text-white drop-shadow-md">
            {formatNumber(totalVideos)}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 font-black uppercase tracking-widest mt-1 font-['Outfit']">
            Cartes Cartographiées dans l'Écosystème
          </p>
        </div>
      </div>

      {/* ── Rarity Grid (Creator TCG Tier distribution) ── */}
      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 font-['Outfit'] flex items-center gap-2 px-1">
          <span>⚡ Répartition par Étoiles</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {RARITY_DISPLAY.map(r => {
            const count = rarityStats?.[r.key] || 0;
            const pct = totalVideos > 0 ? ((count / totalVideos) * 100).toFixed(1) : 0;
            return (
              <div
                key={r.key}
                className="rounded-2xl p-4 flex flex-col gap-2 transition-all duration-200 border-2"
                style={{
                  background: r.bg,
                  borderColor: `${r.border}80`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider font-['Outfit']" style={{ color: r.color }}>
                    {r.badge}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{r.energy}</span>
                </div>
                <div>
                  <p className="font-['Outfit'] font-black text-3xl tracking-tight" style={{ color: r.color }}>
                    {count}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">{pct}% des cartes</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400/90 pt-1 border-t border-slate-700/50">
                  {r.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top Videos & Top Channels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Most Viewed Videos (Hall of Fame) */}
        <div className="rounded-2xl p-5 bg-[#0b1326] border-2 border-yellow-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Crown className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-['Outfit'] font-black text-base text-white tracking-wide">
                  Temple de la Renommée
                </h3>
                <p className="text-[10px] font-mono text-slate-400">Cartes aux PV / Vues les plus élevées</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
              Top Vues
            </span>
          </div>

          <div className="space-y-2">
            {mostViewed?.map((vid, idx) => {
              const rankColor =
                idx === 0 ? 'bg-yellow-400 text-yellow-950 border-yellow-300 shadow-amber-400/20 shadow-md' :
                idx === 1 ? 'bg-slate-300 text-slate-900 border-slate-200' :
                idx === 2 ? 'bg-amber-600 text-amber-100 border-amber-500' :
                'bg-slate-800 text-slate-400 border-slate-700';

              return (
                <div
                  key={vid.id}
                  onClick={() => onPlayVideo && onPlayVideo(vid)}
                  className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 bg-[#080e1d] hover:bg-[#111e3b] border border-slate-800 hover:border-yellow-500/40 group shadow-xs"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-['Outfit'] font-black text-xs border shrink-0 ${rankColor}`}>
                    {idx + 1}
                  </span>
                  <div className="w-14 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-700 group-hover:border-yellow-400/60 transition-colors">
                    <img src={vid.thumbnail_url} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-yellow-300 transition-colors">
                      {vid.title}
                    </p>
                    <span className="text-[10px] text-slate-400">{vid.channel}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-black text-yellow-400">
                      {formatNumber(vid.views)} <span className="text-[10px] font-normal text-slate-400">PV</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Channels (Gym Leaders) */}
        <div className="rounded-2xl p-5 bg-[#0b1326] border-2 border-blue-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                <Tv className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="font-['Outfit'] font-black text-base text-white tracking-wide">
                  Champions de Chaîne
                </h3>
                <p className="text-[10px] font-mono text-slate-400">Créateurs possédant le plus de cartes en jeu</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/30">
              Arènes
            </span>
          </div>

          <div className="space-y-2">
            {topChannels?.slice(0, 8).map((ch, idx) => (
              <div
                key={ch.channel}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs bg-[#080e1d] border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="font-['Outfit'] font-black text-sm text-slate-500 w-5 text-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white font-['Outfit']">{ch.channel}</span>
                    <span className="ml-2 text-slate-500 font-mono text-[11px]">({ch.video_count} cartes)</span>
                  </div>
                </div>
                <div className="font-mono text-blue-400 font-bold text-xs">
                  {formatNumber(ch.total_views)} <span className="text-slate-500 text-[10px] font-normal">vues tot.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


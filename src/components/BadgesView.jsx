import React, { useState, useMemo } from 'react';
import { CheckCircle2, ExternalLink, RefreshCw, Sparkles, Award } from 'lucide-react';

function channelHue(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return h % 360;
}

function channelInitials(name) {
  return name.split(/[\s\-_]+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
}

// ── Pokémon Gym Badge Card ──────────────────────────────────────────────────
function BadgeCard({ channel, myCount, totalCount, channelUrl, avatarUrl }) {
  const earned   = myCount >= totalCount && totalCount > 0;
  const hue      = channelHue(channel);
  const initials = channelInitials(channel);
  const pct      = totalCount > 0 ? Math.min(100, Math.floor((myCount / totalCount) * 100)) : 0;
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered]   = useState(false);

  const targetUrl = channelUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(channel)}`;

  return (
    <div
      className="relative rounded-2xl flex flex-col justify-between p-4 overflow-hidden transition-all duration-300 border-2"
      style={{
        background: earned
          ? 'linear-gradient(145deg, #111e38 0%, #0d162a 100%)'
          : myCount > 0
          ? 'linear-gradient(145deg, #0f172a 0%, #0a0f1d 100%)'
          : 'rgba(15, 23, 42, 0.4)',
        borderColor: earned
          ? '#facc15'
          : myCount > 0
          ? 'rgba(59, 130, 246, 0.4)'
          : 'rgba(255, 255, 255, 0.08)',
        boxShadow: earned
          ? hovered
            ? '0 12px 30px rgba(250, 204, 21, 0.35), 0 0 20px rgba(250, 204, 21, 0.2)'
            : '0 6px 20px rgba(250, 204, 21, 0.2)'
          : hovered
          ? '0 8px 20px rgba(0,0,0,0.5)'
          : 'none',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        opacity: myCount === 0 && !earned ? 0.6 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Champion ribbon badge on completion */}
      {earned && (
        <div
          className="absolute -top-1 -right-1 px-2 py-0.5 rounded-bl-xl font-['Outfit'] font-black text-[9px] uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md flex items-center gap-1 z-10"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>MAÎTRE</span>
        </div>
      )}

      {/* Gym Badge Emblem (Avatar inside a metallic medal ring) */}
      <div className="flex items-center gap-3">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative shrink-0 group block"
          title={`Visiter la chaîne YouTube de ${channel}`}
        >
          <div
            className="w-14 h-14 rounded-full p-1 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{
              background: earned
                ? 'linear-gradient(135deg, #fef08a, #eab308, #ca8a04)'
                : 'linear-gradient(135deg, #475569, #334155, #1e293b)',
              boxShadow: earned ? '0 0 14px rgba(250, 204, 21, 0.5)' : 'none',
            }}
          >
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={channel}
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover border border-black/40"
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center font-['Outfit'] font-black text-sm text-white select-none"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue},60%,40%), hsl(${hue},70%,25%))`,
                }}
              >
                {initials}
              </div>
            )}
          </div>
        </a>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-['Outfit'] font-black text-sm leading-tight truncate text-white hover:text-yellow-400 transition-colors flex-1"
              title={channel}
            >
              {channel}
            </a>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-red-400 transition-colors p-1 shrink-0"
              title="Ouvrir sur YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            {myCount} / {totalCount} vidéo{totalCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Challenge Progress Bar */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400">{earned ? 'Chaîne complétée à 100% !' : 'Progression de la chaîne'}</span>
          <span className="font-bold text-yellow-400">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: earned
                ? 'linear-gradient(90deg, #facc15, #f59e0b)'
                : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── BadgesView ────────────────────────────────────────────────────────────────
export default function BadgesView({ collection = {}, channelStats = [], onRefreshChannels }) {
  const [filter, setFilter]           = useState('ALL');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichMessage, setEnrichMessage] = useState('');

  const myCountPerChannel = useMemo(() => {
    const counts = {};
    for (const item of Object.values(collection)) {
      const ch = item.card?.channel;
      if (ch) counts[ch] = (counts[ch] || 0) + 1;
    }
    return counts;
  }, [collection]);

  const channels = useMemo(() => {
    return channelStats.map(({ channel, count: totalCount, channel_url, avatar_url }) => ({
      channel, totalCount, channelUrl: channel_url, avatarUrl: avatar_url,
      myCount: myCountPerChannel[channel] || 0,
      earned: (myCountPerChannel[channel] || 0) >= totalCount && totalCount > 0,
    }));
  }, [channelStats, myCountPerChannel]);

  const earnedCount       = channels.filter(c => c.earned).length;
  const withAvatarsCount  = channels.filter(c => !!c.avatarUrl).length;
  const inProgressCount   = channels.filter(c => !c.earned && c.myCount > 0).length;
  const globalPct         = channels.length > 0 ? Math.floor((earnedCount / channels.length) * 100) : 0;

  const filtered = useMemo(() => {
    let list = [...channels];
    if (filter === 'EARNED')      list = list.filter(c => c.earned);
    if (filter === 'IN_PROGRESS') list = list.filter(c => !c.earned && c.myCount > 0);
    if (filter === 'NOT_STARTED') list = list.filter(c => c.myCount === 0);
    list.sort((a, b) => {
      if (a.earned !== b.earned) return a.earned ? -1 : 1;
      const pa = a.totalCount > 0 ? a.myCount / a.totalCount : 0;
      const pb = b.totalCount > 0 ? b.myCount / b.totalCount : 0;
      if (Math.abs(pa - pb) > 0.001) return pb - pa;
      return b.totalCount - a.totalCount;
    });
    return list;
  }, [channels, filter]);

  const handleEnrich = async () => {
    setIsEnriching(true);
    setEnrichMessage('Recherche des icônes YouTube officielles en cours...');
    try {
      const res = await fetch('/api/channels/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 40 }),
      });
      const data = await res.json();
      setEnrichMessage(`+${data.enrichedCount || 0} icônes récupérées !`);
      if (onRefreshChannels) onRefreshChannels();
      setTimeout(() => setEnrichMessage(''), 4000);
    } catch {
      setEnrichMessage('Erreur lors de la récupération.');
      setTimeout(() => setEnrichMessage(''), 4000);
    } finally {
      setIsEnriching(false);
    }
  };

  const FILTERS = [
    { id: 'ALL',         label: 'Toutes les Chaînes',   count: channels.length },
    { id: 'EARNED',      label: 'Médaillons Décrochés', count: earnedCount },
    { id: 'IN_PROGRESS', label: 'Chaînes en Cours',     count: inProgressCount },
    { id: 'NOT_STARTED', label: 'Non Commencées',       count: channels.filter(c => c.myCount === 0).length },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="relative rounded-2xl p-6 bg-gradient-to-r from-[#0d162b] via-[#111f3d] to-[#0d162b] border-2 border-yellow-500/40 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="gt-play-emblem w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400 font-['Outfit']">
                Ligue des Créateurs YouTube France
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-['Outfit']">
              Médaillons de Maîtrise
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              Collecte l'intégralité des vidéos d'une chaîne dans ton classeur pour décrocher son Médaillon officiel de Maître.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#111c36] border border-blue-900/70 text-slate-200 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50"
              title="Mettre à jour les logos YouTube"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin text-yellow-400' : ''}`} />
              <span>{isEnriching ? 'Chargement...' : 'Actualiser Logos'}</span>
            </button>

            <div className="px-5 py-3 rounded-2xl bg-[#090e1c] border-2 border-yellow-500/50 text-center shadow-lg">
              <div className="font-mono font-black text-3xl text-yellow-400">
                {earnedCount}
                <span className="text-slate-600 text-xl font-normal"> / {channels.length}</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-['Outfit']">
                Badges Conquis
              </div>
            </div>
          </div>
        </div>
      </div>

      {enrichMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-xs text-yellow-300 bg-yellow-950/40 border border-yellow-700/60 shadow">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>{enrichMessage}</span>
        </div>
      )}

      {/* Global League Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>Progression de la Ligue • {withAvatarsCount} badges illustrés</span>
          <span className="font-bold text-yellow-400">{globalPct}%</span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 via-yellow-400 to-amber-500"
            style={{
              width: `${(channels.length > 0 ? earnedCount / channels.length : 0) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/25 font-black'
                  : 'bg-[#0f172a] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{f.label}</span>
              <span className="opacity-70 font-mono text-[10px]">({f.count})</span>
            </button>
          );
        })}
      </div>

      {/* Badges Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-[#0c1322] rounded-2xl border border-slate-800">
          Aucune arène dans cette catégorie.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(({ channel, myCount, totalCount, channelUrl, avatarUrl }) => (
            <BadgeCard
              key={channel}
              channel={channel}
              myCount={myCount}
              totalCount={totalCount}
              channelUrl={channelUrl}
              avatarUrl={avatarUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}


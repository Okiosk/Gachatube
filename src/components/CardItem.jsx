import React, { useState, useRef } from 'react';
import { Play, Sparkles, Crown, Shield, Flame, Heart, MessageSquare, Check, Eye, Zap, Radio } from 'lucide-react';
import { getChannelAvatar } from '../utils/channelAvatars';

export const RARITY_CONFIG = {
  COMMUNE: {
    label: 'Édition Bronze',
    shortLabel: 'BRONZE',
    symbol: '●',
    badgeBg: '#334155',
    accentColor: '#94a3b8',
    borderColor: '#475569',
    cardBorder: 'linear-gradient(145deg, #475569 0%, #1e293b 50%, #0f172a 100%)',
    innerBg: 'linear-gradient(165deg, #131d33 0%, #0c1222 60%, #070a14 100%)',
    textColor: 'text-slate-200',
    stars: 1,
    outerGlow: '0 8px 24px rgba(0,0,0,0.6)',
    icon: Shield,
    holo: false,
    mythic: false,
    sealColor: '#94a3b8',
  },
  PEU_COMMUNE: {
    label: 'Édition Argent',
    shortLabel: 'ARGENT',
    symbol: '◆',
    badgeBg: '#064e3b',
    accentColor: '#34d399',
    borderColor: '#10b981',
    cardBorder: 'linear-gradient(145deg, #34d399 0%, #059669 40%, #064e3b 80%, #0f172a 100%)',
    innerBg: 'linear-gradient(165deg, #0e2428 0%, #0b191e 60%, #060e12 100%)',
    textColor: 'text-emerald-300',
    stars: 2,
    outerGlow: '0 8px 28px rgba(16,185,129,0.3)',
    icon: Sparkles,
    holo: false,
    mythic: false,
    sealColor: '#34d399',
  },
  RARE: {
    label: 'Édition Or Holo',
    shortLabel: 'OR HOLO',
    symbol: '★',
    badgeBg: '#1e3a8a',
    accentColor: '#38bdf8',
    borderColor: '#0284c7',
    cardBorder: 'linear-gradient(145deg, #7dd3fc 0%, #0284c7 45%, #1e3a8a 80%, #0f172a 100%)',
    innerBg: 'linear-gradient(165deg, #0f2347 0%, #0b1730 60%, #060b18 100%)',
    textColor: 'text-sky-300',
    stars: 3,
    outerGlow: '0 10px 32px rgba(56,189,248,0.4)',
    icon: Sparkles,
    holo: true,
    mythic: false,
    sealColor: '#38bdf8',
  },
  ULTRA_RARE: {
    label: 'Édition Diamant Cosmique',
    shortLabel: 'DIAMANT',
    symbol: '★HOLO',
    badgeBg: '#3b0764',
    accentColor: '#c084fc',
    borderColor: '#9333ea',
    cardBorder: 'linear-gradient(145deg, #f472b6 0%, #c084fc 35%, #7c3aed 70%, #1e1b4b 100%)',
    innerBg: 'linear-gradient(165deg, #23123d 0%, #170b28 60%, #0b0515 100%)',
    textColor: 'text-purple-300',
    stars: 4,
    outerGlow: '0 12px 38px rgba(192,132,252,0.5)',
    icon: Flame,
    holo: true,
    mythic: false,
    sealColor: '#c084fc',
  },
  MYTHIQUE: {
    label: 'Prisme Noir & Or Pur',
    shortLabel: 'PRISME NOIR',
    symbol: '👑 SECRET',
    badgeBg: '#451a03',
    accentColor: '#fbbf24',
    borderColor: '#d97706',
    cardBorder: 'linear-gradient(145deg, #fef08a 0%, #f59e0b 30%, #b45309 60%, #facc15 85%, #78350f 100%)',
    innerBg: 'linear-gradient(165deg, #2b1803 0%, #180d01 60%, #080400 100%)',
    textColor: 'text-amber-300',
    stars: 5,
    outerGlow: '0 14px 45px rgba(251,191,36,0.65)',
    icon: Crown,
    holo: true,
    mythic: true,
    sealColor: '#fbbf24',
  },
};

export function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace('.0', '') + ' Md';
  if (num >= 1_000_000)    return (num / 1_000_000).toFixed(1).replace('.0', '') + ' M';
  if (num >= 1_000)       return (num / 1_000).toFixed(1).replace('.0', '') + ' k';
  return num.toLocaleString('fr-FR');
}

export function formatAudience(views = 0) {
  if (!views) return '100';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}Md`;
  if (views >= 10_000_000)    return `${Math.round(views / 1_000_000)}M`;
  if (views >= 1_000_000)     return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 10_000)        return `${Math.round(views / 1_000)}k`;
  if (views >= 1_000)         return `${(views / 1_000).toFixed(1)}k`;
  return `${views}`;
}

export function channelHue(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return h % 360;
}

export function channelInitials(name = '') {
  return name.split(/[\s\-_]+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
}

export default function CardItem({
  card,
  interactive = true,
  count = 1,
  onPlay,
  size = 'normal', // 'compact' | 'normal' | 'large'
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glintPos, setGlintPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  if (!card) return null;

  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.COMMUNE;
  const hue = channelHue(card.channel);
  const initials = channelInitials(card.channel);
  const avatarUrl = card.channel_avatar_url || card.channel_avatar || getChannelAvatar(card.channel);

  const handleMouseMove = (e) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    const rotX = -((y - rect.height / 2) / (rect.height / 2)) * 12;
    setRotateX(rotX);
    setRotateY(rotY);
    setGlintPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  // Dimensions & typography scale
  const sizeConfig = {
    compact: {
      card: 'w-[185px] h-[278px]',
      avatar: 'w-5 h-5',
      padding: 'p-1.5',
      innerPadding: 'p-2',
      title: 'text-[11px]',
      channel: 'text-[10px]',
      audience: 'text-[11px]',
      artHeight: 'h-[85px]',
      statLabel: 'text-[7.5px]',
      statValue: 'text-[10px]',
      footer: 'text-[7.5px]',
      subline: 'text-[7px]',
    },
    normal: {
      card: 'w-[270px] sm:w-[285px] h-[400px] sm:h-[420px]',
      avatar: 'w-6 h-6',
      padding: 'p-2',
      innerPadding: 'p-3',
      title: 'text-[13px]',
      channel: 'text-xs',
      audience: 'text-sm',
      artHeight: 'h-[135px]',
      statLabel: 'text-[9.5px]',
      statValue: 'text-sm',
      footer: 'text-[9px]',
      subline: 'text-[8.5px]',
    },
    large: {
      card: 'w-[320px] sm:w-[340px] h-[480px] sm:h-[510px]',
      avatar: 'w-7 h-7',
      padding: 'p-2.5',
      innerPadding: 'p-4',
      title: 'text-sm',
      channel: 'text-sm',
      audience: 'text-base',
      artHeight: 'h-[165px]',
      statLabel: 'text-[10.5px]',
      statValue: 'text-base',
      footer: 'text-[10px]',
      subline: 'text-[9.5px]',
    },
  }[size] || {
    card: 'w-[285px] h-[420px]',
    avatar: 'w-6 h-6',
    padding: 'p-2',
    innerPadding: 'p-3',
    title: 'text-[13px]',
    channel: 'text-xs',
    audience: 'text-sm',
    artHeight: 'h-[135px]',
    statLabel: 'text-[9.5px]',
    statValue: 'text-sm',
    footer: 'text-[9px]',
    subline: 'text-[8.5px]',
  };

  const cardStyle = {
    transform: interactive
      ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'scale3d(1.03, 1.03, 1.03)' : 'scale3d(1, 1, 1)'}`
      : undefined,
    transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.35s ease-out',
    boxShadow: isHovered
      ? `${rarity.outerGlow}, 0 18px 40px rgba(0,0,0,0.7)`
      : rarity.outerGlow,
    background: rarity.cardBorder,
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
      className={`relative select-none rounded-[16px] ${sizeConfig.padding} ${sizeConfig.card} shadow-2xl flex flex-col justify-between group cursor-pointer overflow-hidden gt-card-frame`}
      onClick={() => onPlay && onPlay(card)}
    >
      {/* Holographic foil overlay for Rares & Ultras */}
      {rarity.holo && (
        <div
          className="absolute inset-0 rounded-[16px] foil-subtle-holo pointer-events-none z-30 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.9 : 0.45,
            backgroundPosition: `${glintPos.x}% ${glintPos.y}%`,
          }}
        />
      )}

      {/* Radiant golden shimmer for Mythique */}
      {rarity.mythic && (
        <div
          className="absolute inset-0 rounded-[16px] foil-mythic-gold pointer-events-none z-30 transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0.75 }}
        />
      )}

      {/* ── CARD BODY CHASSIS ── */}
      <div
        className={`w-full h-full rounded-[12px] ${sizeConfig.innerPadding} flex flex-col justify-between relative z-10 border border-white/10 shadow-inner overflow-hidden`}
        style={{ background: rarity.innerBg }}
      >
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-5 [background-size:12px_12px] pointer-events-none" />

        {/* ── 1. HEADER: YouTuber Profile, Name + Verified Check, Audience Meter ── */}
        <div className="relative z-10 flex items-center justify-between gap-1 pb-1.5 border-b border-white/10">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Creator Avatar Badge */}
            <div
              className={`${sizeConfig.avatar} rounded-full shrink-0 flex items-center justify-center font-['Outfit'] font-black text-[8px] text-white shadow-xs border border-white/30 overflow-hidden bg-slate-800 relative`}
              style={{
                background: !avatarUrl ? `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${hue},75%,30%))` : undefined,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={card.channel}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <span
                className="avatar-fallback w-full h-full items-center justify-center"
                style={{ display: avatarUrl ? 'none' : 'flex' }}
              >
                {initials}
              </span>
            </div>

            {/* YouTuber Name */}
            <div className="flex items-center gap-1 min-w-0">
              <h2
                className={`font-['Outfit'] font-black tracking-tight truncate text-white ${sizeConfig.channel}`}
                title={card.channel}
              >
                {card.channel}
              </h2>
              <span className="w-3 h-3 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/50 flex items-center justify-center text-[7px] shrink-0" title="Chaîne Certifiée">
                <Check className="w-2 h-2 stroke-[3]" />
              </span>
            </div>
          </div>

          {/* AUDIENCE (Views metric) */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border shrink-0 shadow-xs"
            style={{
              background: 'rgba(0,0,0,0.4)',
              borderColor: `${rarity.accentColor}50`,
            }}
          >
            <Eye className="w-3 h-3 text-slate-400 shrink-0" />
            <span
              className={`font-mono font-black tracking-tight ${sizeConfig.audience}`}
              style={{ color: rarity.accentColor }}
            >
              {formatAudience(card.views)}
            </span>
          </div>
        </div>

        {/* ── 2. CINEMATIC ARTWORK WINDOW ── */}
        <div className="relative z-10 my-1">
          <div
            className={`w-full ${sizeConfig.artHeight} rounded-xl overflow-hidden bg-black relative border-2 border-white/15 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_4px_12px_rgba(0,0,0,0.4)] group-hover:border-yellow-400/80 transition-colors`}
          >
            <img
              src={card.thumbnail_url}
              alt={card.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${card.video_id}/hqdefault.jpg`;
              }}
            />

            {/* Play overlay on hover */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-950/80 border border-white/20">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>

            {/* Top-right Rarity Seal */}
            <div className="absolute top-1.5 right-1.5">
              <span
                className="px-2 py-0.5 rounded-md text-[8px] font-['Outfit'] font-black uppercase tracking-wider text-slate-950 shadow-md border border-white/30"
                style={{ background: rarity.sealColor }}
              >
                {rarity.shortLabel}
              </span>
            </div>

            {/* Bottom-left ID tag */}
            <div className="absolute bottom-1.5 left-1.5">
              <span className="px-1.5 py-0.5 rounded bg-black/80 text-[7.5px] font-mono font-bold text-slate-300 border border-white/10">
                REF #{card.video_id}
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. VIDEO TITLE ── */}
        <div className="relative z-10 px-0.5 my-0.5">
          <p
            className={`font-['Outfit'] font-black line-clamp-1 leading-tight tracking-tight text-white ${sizeConfig.title}`}
            title={card.title}
          >
            {card.title}
          </p>
        </div>

        {/* ── 4. ENGAGEMENT REACTOR (Unique Creator Metrics) ── */}
        <div className="relative z-10 space-y-1 my-1 p-1.5 rounded-xl bg-black/40 border border-white/10">
          {/* Engagement: Like */}
          <div className="flex items-center justify-between gap-1 text-left">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-4 h-4 rounded-md bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
              </div>
              <span className={`font-['Outfit'] font-bold text-slate-300 uppercase tracking-wider ${sizeConfig.statLabel}`}>
                Like
              </span>
            </div>
            <span className={`font-mono font-black text-rose-400 ${sizeConfig.statValue}`}>
              {formatNumber(card.likes)}
            </span>
          </div>

          {/* Resonance: Comms */}
          <div className="flex items-center justify-between gap-1 text-left">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-4 h-4 rounded-md bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                <MessageSquare className="w-2.5 h-2.5 text-sky-400" />
              </div>
              <span className={`font-['Outfit'] font-bold text-slate-300 uppercase tracking-wider ${sizeConfig.statLabel}`}>
                Comms
              </span>
            </div>
            <span className={`font-mono font-black text-sky-400 ${sizeConfig.statValue}`}>
              {formatNumber(card.comments)}
            </span>
          </div>
        </div>

        {/* ── 5. FOOTER: Multiplier if count > 1 ── */}
        {count > 1 ? (
          <div className="relative z-10 flex items-center justify-end pt-1 font-mono">
            <span className="px-2 py-0.5 rounded-full font-black bg-yellow-400 text-yellow-950 text-[9px] font-mono shadow-xs border border-yellow-200">
              x{count}
            </span>
          </div>
        ) : (
          <div className="h-0.5" />
        )}
      </div>
    </div>
  );
}



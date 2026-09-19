import React from 'react';
import { X, Check } from 'lucide-react';
import { getChannelAvatar } from '../utils/channelAvatars';
import { channelInitials, channelHue } from './CardItem';

export default function VideoModal({ card, onClose }) {
  if (!card) return null;

  const avatarUrl = card.channel_avatar_url || card.channel_avatar || getChannelAvatar(card.channel);
  const initials = channelInitials(card.channel);
  const hue = channelHue(card.channel);

  const embedOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube.com/embed/${card.video_id}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(embedOrigin)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0d162b] border-2 border-amber-500/60 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_25px_rgba(234,179,8,0.2)] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Channel Profile Picture & Name (no colored YT logo, no rarity mention) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-500/20 bg-gradient-to-r from-[#0d162b] via-[#14213d] to-[#0d162b]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Creator Profile Picture */}
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-['Outfit'] font-black text-xs text-white shadow-md border border-white/30 overflow-hidden bg-slate-800 relative"
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

            {/* YouTuber Name + Verified Badge */}
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-['Outfit'] font-black text-white text-base truncate">
                {card.channel}
              </h3>
              <span className="w-3.5 h-3.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/50 flex items-center justify-center text-[8px] shrink-0" title="Chaîne Certifiée">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Frame (Error 153 resolved via strict-origin-when-cross-origin & origin param) */}
        <div className="relative aspect-video bg-black w-full border-b-2 border-amber-500/20">
          <iframe
            src={embedUrl}
            title={card.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        {/* Modal Details: Clean Title & Simplified Stats */}
        <div className="p-5 space-y-4 overflow-y-auto bg-[#090e1c] text-xs">
          <div>
            <h2 className="text-base sm:text-lg font-['Outfit'] font-black text-white leading-snug">
              {card.title}
            </h2>
          </div>

          {/* Stats Bar: Vues, Like, Comms */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-[#0f172a] rounded-2xl p-3 border border-slate-700/80 flex flex-col items-center text-center shadow-inner">
              <span className="text-slate-400 text-[10px] font-['Outfit'] font-bold uppercase tracking-wider mb-1">
                Vues
              </span>
              <span className="font-['Outfit'] font-black text-sm sm:text-base text-yellow-400">
                {Number(card.views || 0).toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="bg-[#0f172a] rounded-2xl p-3 border border-slate-700/80 flex flex-col items-center text-center shadow-inner">
              <span className="text-slate-400 text-[10px] font-['Outfit'] font-bold uppercase tracking-wider mb-1">
                Like
              </span>
              <span className="font-['Outfit'] font-black text-sm sm:text-base text-rose-400">
                {Number(card.likes || 0).toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="bg-[#0f172a] rounded-2xl p-3 border border-slate-700/80 flex flex-col items-center text-center shadow-inner">
              <span className="text-slate-400 text-[10px] font-['Outfit'] font-bold uppercase tracking-wider mb-1">
                Comms
              </span>
              <span className="font-['Outfit'] font-black text-sm sm:text-base text-sky-400">
                {Number(card.comments || 0).toLocaleString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

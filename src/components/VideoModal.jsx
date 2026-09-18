import React from 'react';
import { X, ExternalLink, Eye, ThumbsUp, MessageSquare, Shield, Sparkles } from 'lucide-react';
import { formatNumber, RARITY_CONFIG } from './CardItem';

export default function VideoModal({ card, onClose }) {
  if (!card) return null;

  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.COMMUNE;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0d162b] border-2 border-yellow-500/60 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_25px_rgba(234,179,8,0.2)] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-yellow-500/20 bg-gradient-to-r from-[#0d162b] via-[#14213d] to-[#0d162b]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="gt-play-emblem" />
            <span className="px-2.5 py-0.5 rounded-full text-xs font-['Outfit'] font-black uppercase tracking-wider bg-yellow-400 text-yellow-950 shadow-xs">
              {rarity.symbol} {rarity.label}
            </span>
            <span className="font-['Outfit'] font-bold text-white text-sm truncate">
              {card.channel}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Frame */}
        <div className="relative aspect-video bg-black w-full border-b-2 border-yellow-500/20">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${card.video_id}?autoplay=1&rel=0`}
            title={card.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Modal Details Footer */}
        <div className="p-5 space-y-4 overflow-y-auto bg-[#090e1c] text-xs">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-yellow-400/90 uppercase tracking-wider mb-1">
              <span>N° Réf. #{card.video_id}</span>
              <span>•</span>
              <span>Édition Officielle : GT-FR</span>
            </div>
            <h2 className="text-base font-['Outfit'] font-black text-white leading-snug">
              {card.title}
            </h2>
            <p className="text-slate-400 mt-1">
              Thématique : <span className="text-yellow-400 font-bold font-mono">{card.category}</span>
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-[#0f172a] rounded-xl p-3 border border-slate-700/80 flex flex-col items-center text-center shadow-inner">
              <span className="text-slate-400 text-[10px] font-['Outfit'] font-bold uppercase tracking-wider mb-1">
                Audience (Vues)
              </span>
              <span className="font-['Outfit'] font-black text-sm text-yellow-400">
                {card.views.toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="bg-[#0f172a] rounded-xl p-3 border border-slate-700/80 flex flex-col items-center text-center shadow-inner">
              <span className="text-slate-400 text-[10px] font-['Outfit'] font-bold uppercase tracking-wider mb-1">
                Engagement (Likes)
              </span>
              <span className="font-['Outfit'] font-black text-sm text-emerald-400">
                {card.likes.toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="bg-[#0f172a] rounded-xl p-3 border border-slate-700/80 flex flex-col items-center text-center shadow-inner">
              <span className="text-slate-400 text-[10px] font-['Outfit'] font-bold uppercase tracking-wider mb-1">
                Interaction (Comms)
              </span>
              <span className="font-['Outfit'] font-black text-sm text-blue-400">
                {card.comments.toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Puissance Créateur : <strong className="text-yellow-400 font-mono">{Math.round(card.score || 0).toLocaleString('fr-FR')} pts</strong></span>
            <a
              href={`https://www.youtube.com/watch?v=${card.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 border border-red-500/40 font-['Outfit'] font-bold text-xs transition-colors"
            >
              <span>Regarder sur YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

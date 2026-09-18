import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const TOAST_DURATION = 4500;

// Individual toast card
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), TOAST_DURATION);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const bgStyle = toast.type === 'achievement'
    ? 'border-yellow-500/80 bg-gradient-to-br from-[#0d162b] to-[#1a2b4c] text-white shadow-yellow-500/20'
    : toast.type === 'badge'
    ? 'border-amber-400/80 bg-gradient-to-br from-[#0d162b] to-[#1f1b3c] text-white shadow-amber-500/20'
    : toast.type === 'daily'
    ? 'border-blue-400/80 bg-gradient-to-br from-[#0d162b] to-[#0f283d] text-white shadow-blue-500/20'
    : 'border-slate-700 bg-[#0d162b] text-slate-200';

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl border-2 shadow-2xl w-80 backdrop-blur-md ${bgStyle}`}
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      {/* Emoji / Pokéball icon */}
      <span className="text-2xl shrink-0 leading-none mt-0.5">{toast.emoji}</span>

      {/* Text */}
      <div className="flex-1 min-w-0 font-['Outfit']">
        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
          {toast.type === 'achievement' ? '🏆 Exploit Débloqué' : toast.type === 'badge' ? '🏅 Badge d\'Arène Obtenu' : toast.type === 'daily' ? '🌅 Récompense Quotidienne' : 'Notification TCG'}
        </p>
        <p className="text-sm font-black text-white mt-0.5 leading-snug">{toast.title}</p>
        {toast.desc && (
          <p className="text-xs text-slate-300 mt-0.5 font-medium">{toast.desc}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-slate-400 hover:text-white transition-colors mt-0.5 p-1 hover:bg-white/10 rounded-lg"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar (auto-dismiss timer) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden bg-black/40">
        <div
          className="h-full bg-yellow-400"
          style={{ animation: `shrinkBar ${TOAST_DURATION}ms linear forwards` }}
        />
      </div>
    </div>
  );
}

// Toast container — fixed overlay
export default function ToastContainer({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes shrinkBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto relative">
            <Toast toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}

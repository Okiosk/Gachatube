import React from 'react';
import { Package, Layers, Database, BarChart3, Volume2, VolumeX, Trophy, Award } from 'lucide-react';
import { toggleMute } from '../utils/audio';
import { ACHIEVEMENTS } from '../utils/achievements';

const NAV_ITEMS = [
  { id: 'booster',      label: 'Boutique',    icon: Package,  desc: 'Boosters' },
  { id: 'binder',       label: 'Collection',  icon: Layers,   desc: 'Collection' },
  { id: 'badges',       label: 'Badges',      icon: Award,    desc: 'Créateurs' },
  { id: 'achievements', label: 'Trophées',    icon: Trophy,   desc: 'Exploits' },
];

export default function Header({
  activeTab,
  setActiveTab,
  uniqueCardsCount          = 0,
  unlockedAchievementsCount = 0,
  earnedBadgesCount         = 0,
  coins                     = 0,
  isMuted,
  setIsMuted,
}) {
  const handleToggleSound = () => {
    const newState = toggleMute();
    setIsMuted(newState);
  };

  const getBadgeForTab = (id) => {
    if (id === 'binder') return uniqueCardsCount || null;
    if (id === 'badges') return earnedBadgesCount || null;
    if (id === 'achievements') return unlockedAchievementsCount > 0 ? `${unlockedAchievementsCount}/${ACHIEVEMENTS.length}` : null;
    return null;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#070b16]/95 backdrop-blur-md border-b-2 border-[#1e293b] shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">

        {/* ── Navigation Tabs ── */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-[#0c1322] border border-slate-800 text-xs font-bold font-['Outfit']">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badge = getBadgeForTab(item.id);

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {badge !== null && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                      isActive ? 'bg-slate-950 text-yellow-300' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right side: TubeCoins + Sound ── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* TubeCoins Counter */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-yellow-500/40 shadow-sm"
            title="Solde de TubeCoins"
          >
            <span className="text-base">🪙</span>
            <span className="font-extrabold text-yellow-300 text-sm font-mono tracking-tight">
              {coins}
            </span>
            <span className="text-[10px] font-black text-yellow-500 uppercase font-['Outfit'] hidden sm:inline">
              TC
            </span>
          </div>

          {/* Mute audio button */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-[#0c1322] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Navigation Bar ── */}
      <div className="flex md:hidden items-center justify-around py-1.5 border-t border-slate-800/80 bg-[#070b16]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badge = getBadgeForTab(item.id);

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                isActive ? 'text-yellow-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {badge !== null && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 text-slate-950 text-[7px] font-black flex items-center justify-center shadow">
                  {typeof badge === 'number' ? (badge > 9 ? '9+' : badge) : '!'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}


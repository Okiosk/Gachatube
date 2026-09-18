import React from 'react';
import { Trophy, Lock, CheckCircle2, Award, Sparkles, UserCheck } from 'lucide-react';
import { ACHIEVEMENTS } from '../utils/achievements';

const CATEGORY_ORDER = ['Collection', 'Rareté', 'Connexion', 'Économie', 'Boutique', 'Badges'];

const CATEGORY_CONFIG = {
  Collection: { color: '#38bdf8', emoji: '🃏', name: 'Collection & Archives' },
  Rareté:     { color: '#facc15', emoji: '⭐', name: 'Chasse aux Cartes d\'Or' },
  Connexion:  { color: '#fb923c', emoji: '🔥', name: 'Régularité du Collectionneur' },
  Économie:   { color: '#34d399', emoji: '🪙', name: 'Banque de TubeCoins' },
  Boutique:   { color: '#c084fc', emoji: '🛍️', name: 'Ouvertures de Boosters' },
  Badges:     { color: '#f59e0b', emoji: '🏅', name: 'Ligue & Médaillons' },
};

function AchievementCard({ achievement, isUnlocked, unlockedAt, stats }) {
  const cat = CATEGORY_CONFIG[achievement.category] || CATEGORY_CONFIG.Collection;
  const prog = achievement.progress ? achievement.progress(stats) : null;
  const pct = prog ? Math.min(100, Math.floor((prog.current / prog.max) * 100)) : 0;

  return (
    <div
      className={`relative rounded-2xl p-4 flex items-start gap-3.5 transition-all duration-200 border-2 ${
        isUnlocked
          ? 'bg-gradient-to-br from-[#111e38] to-[#0c1426] border-yellow-500/50 shadow-lg shadow-yellow-500/10'
          : 'bg-[#0a0f1d]/70 border-slate-800/80 opacity-60'
      }`}
    >
      {/* Trophy Badge Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border-2 shadow-inner"
        style={{
          background: isUnlocked
            ? 'linear-gradient(135deg, rgba(250,204,21,0.2), rgba(0,0,0,0.4))'
            : 'rgba(15,23,42,0.6)',
          borderColor: isUnlocked ? cat.color : '#334155',
        }}
      >
        {isUnlocked ? achievement.emoji : <Lock className="w-5 h-5 text-slate-600" />}
      </div>

      {/* Trophy Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={`font-['Outfit'] font-black text-sm leading-tight ${
                isUnlocked ? 'text-white' : 'text-slate-400'
              }`}
            >
              {achievement.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{achievement.desc}</p>
          </div>

          {/* Reward Badge */}
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black border shrink-0 shadow-xs"
            style={
              isUnlocked
                ? { color: '#facc15', borderColor: '#facc15', background: 'rgba(250,204,21,0.15)' }
                : { color: '#64748b', borderColor: '#334155', background: 'transparent' }
            }
          >
            +{achievement.reward} TC
          </span>
        </div>

        {/* Progress Bar */}
        {!isUnlocked && prog && (
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>{prog.current} / {prog.max}</span>
              <span className="font-bold">{pct}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, background: cat.color }}
              />
            </div>
          </div>
        )}

        {/* Unlocked date */}
        {isUnlocked && unlockedAt && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-yellow-400/90">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Débloqué le {new Date(unlockedAt).toLocaleDateString('fr-FR')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AchievementsView({
  achievements = {},
  collection = {},
  packsOpened = 0,
  coins = 0,
  loginStreak = 0,
  boostersOpenedByType = {},
  badgesEarned = 0,
}) {
  const rarityCount = Object.values(collection).reduce((acc, item) => {
    const r = item.card?.rarity;
    if (r) acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const stats = {
    packsOpened,
    uniqueCards: Object.keys(collection).length,
    coins,
    loginStreak,
    rarityCount,
    boostersOpened: boostersOpenedByType,
    badgesEarned,
  };

  const unlockedCount    = Object.keys(achievements).length;
  const totalRewardEarned = ACHIEVEMENTS
    .filter(a => achievements[a.id])
    .reduce((s, a) => s + a.reward, 0);
  const globalPct = Math.floor((unlockedCount / ACHIEVEMENTS.length) * 100);

  const byCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    items: ACHIEVEMENTS.filter(a => a.category === cat),
  }));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* ── Official Collector Passport Header ── */}
      <div className="relative rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-[#0d162b] via-[#111f3d] to-[#0d162b] border-2 border-yellow-500/40 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="gt-play-emblem w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400 font-['Outfit']">
                Passeport Officiel du Collectionneur
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-3">
              <span>Trophées & Exploits</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                Rang Élite
              </span>
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              ID N° 84920 • Collectionneur Certifié GachaTube TCG
            </p>
          </div>

          {/* Key Stats Chips */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-[#090e1c] border-2 border-blue-900/60 text-center shadow-lg">
              <div className="font-mono font-black text-2xl text-white">
                {unlockedCount}
                <span className="text-slate-600 text-lg font-normal"> / {ACHIEVEMENTS.length}</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-['Outfit']">
                Exploits Validés
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-[#090e1c] border-2 border-yellow-500/50 text-center shadow-lg">
              <div className="font-mono font-black text-2xl text-yellow-400">
                +{totalRewardEarned}
              </div>
              <div className="text-[9px] font-black uppercase tracking-wider text-yellow-500 font-['Outfit']">
                TubeCoins Gagnés
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-[#090e1c] border-2 border-emerald-500/50 text-center shadow-lg">
              <div className="font-mono font-black text-2xl text-emerald-400">
                {globalPct}%
              </div>
              <div className="text-[9px] font-black uppercase tracking-wider text-emerald-500 font-['Outfit']">
                Complétion
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Parcours du Collectionneur</span>
            <span className="font-bold text-yellow-400">{unlockedCount} sur {ACHIEVEMENTS.length} complétés</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 via-yellow-400 to-amber-500"
              style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Categories of Achievements ── */}
      {byCategory.map(({ cat, items }) => {
        const cfg = CATEGORY_CONFIG[cat];
        const catUnlocked = items.filter(a => achievements[a.id]).length;
        const catPct = Math.floor((catUnlocked / items.length) * 100);

        return (
          <section key={cat} className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{cfg.emoji}</span>
                <div>
                  <h2 className="text-lg font-black text-white font-['Outfit'] tracking-wide">
                    {cfg.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-slate-400">
                  {catUnlocked} / {items.length}
                </span>
                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${catPct}%`, background: cfg.color }}
                  />
                </div>
              </div>
            </div>

            {/* Achievement Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={!!achievements[achievement.id]}
                  unlockedAt={achievements[achievement.id]?.unlockedAt}
                  stats={stats}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}


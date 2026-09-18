import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Swords, 
  Shield, 
  Zap, 
  RefreshCw, 
  Flame, 
  Crown, 
  Trophy, 
  ArrowRight, 
  Sparkles, 
  Heart, 
  Eye, 
  Check, 
  AlertCircle, 
  Play, 
  RotateCcw, 
  ChevronRight,
  User,
  Bot
} from 'lucide-react';
import { 
  AI_DIFFICULTIES, 
  createCombatCard, 
  calculateAttackDamage, 
  calculateUltimateDamage, 
  generateAiTeam, 
  decideAiAction 
} from '../utils/combatLogic';
import { 
  playAttackHitSound, 
  playShieldSound, 
  playSpecialBuzzSound, 
  playVictoryJingle, 
  playDefeatSound, 
  playClickSound 
} from '../utils/audio';
import { RARITY_CONFIG, formatNumber } from './CardItem';

export default function CombatView({
  collection = {},
  coins = 0,
  onRewardCoins,
  onPlayVideo,
  onOpenShop
}) {
  // Collection cards array
  const ownedCards = useMemo(() => {
    return Object.values(collection)
      .map(item => item.card)
      .filter(Boolean);
  }, [collection]);

  // Phase: 'select' | 'battle' | 'victory' | 'defeat'
  const [phase, setPhase] = useState('select');
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [selectedDeckIds, setSelectedDeckIds] = useState([]);
  
  // Battle state
  const [playerTeam, setPlayerTeam] = useState([]);
  const [aiTeam, setAiTeam] = useState([]);
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [activeAiIdx, setActiveAiIdx] = useState(0);
  const [turn, setTurn] = useState('player'); // 'player' | 'ai' | 'animating'
  const [roundNumber, setRoundNumber] = useState(1);
  const [combatLogs, setCombatLogs] = useState([]);
  
  // Animation states
  const [shakeTarget, setShakeTarget] = useState(null); // 'player' | 'ai' | null
  const [damagePopup, setDamagePopup] = useState(null); // { target: 'player'|'ai', text: string, isCrit: boolean, isHeal: boolean }
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [rewardWon, setRewardWon] = useState(0);

  // Available cards filter for deck selection
  const [filterRarity, setFilterRarity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const logsEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combatLogs]);

  // Auto-fill optimal team on first render
  useEffect(() => {
    if (selectedDeckIds.length === 0 && ownedCards.length >= 3) {
      handleAutoPickTeam();
    }
  }, [ownedCards]);

  // ── Deck Builder Helpers ──────────────────────────────────────────────────
  const handleToggleCardSelection = (cardId) => {
    playClickSound();
    if (selectedDeckIds.includes(cardId)) {
      setSelectedDeckIds(prev => prev.filter(id => id !== cardId));
    } else {
      if (selectedDeckIds.length >= 3) {
        // Replace last
        setSelectedDeckIds(prev => [...prev.slice(0, 2), cardId]);
      } else {
        setSelectedDeckIds(prev => [...prev, cardId]);
      }
    }
  };

  const handleAutoPickTeam = () => {
    playClickSound();
    if (ownedCards.length < 3) return;
    // Sort by views DESC + score to get 3 most powerful cards
    const sorted = [...ownedCards].sort((a, b) => (b.score || b.views) - (a.score || a.views));
    setSelectedDeckIds(sorted.slice(0, 3).map(c => c.id));
  };

  // ── Start Match ───────────────────────────────────────────────────────────
  const handleStartBattle = () => {
    if (selectedDeckIds.length < 3) return;
    playClickSound();

    const selectedCards = selectedDeckIds
      .map(id => ownedCards.find(c => c.id === id))
      .filter(Boolean);

    if (selectedCards.length < 3) return;

    // Convert to combat cards
    const pTeam = selectedCards.map((c, idx) => createCombatCard(c, true, idx));
    const aTeam = generateAiTeam(selectedDifficulty, ownedCards);

    setPlayerTeam(pTeam);
    setAiTeam(aTeam);
    setActivePlayerIdx(0);
    setActiveAiIdx(0);
    setRoundNumber(1);
    setTurn('player');
    setCombatLogs([
      `⚔️ Début du combat contre ${AI_DIFFICULTIES.find(d => d.id === selectedDifficulty)?.name || 'l\'IA'} !`,
      `🎮 À toi de jouer ! Choisis une action pour ${pTeam[0].channel}.`
    ]);
    setPhase('battle');
  };

  // Current active cards
  const playerActive = playerTeam[activePlayerIdx] || null;
  const aiActive = aiTeam[activeAiIdx] || null;

  // Check victory / defeat conditions
  const checkBattleEnd = (pTeam, aTeam) => {
    const allAiDefeated = aTeam.every(c => c.hp <= 0);
    if (allAiDefeated) {
      const diff = AI_DIFFICULTIES.find(d => d.id === selectedDifficulty);
      const reward = diff ? diff.reward : 10;
      setRewardWon(reward);
      if (onRewardCoins) onRewardCoins(reward);
      playVictoryJingle();
      setPhase('victory');
      return true;
    }

    const allPlayerDefeated = pTeam.every(c => c.hp <= 0);
    if (allPlayerDefeated) {
      playDefeatSound();
      setPhase('defeat');
      return true;
    }

    return false;
  };

  // Add log entry
  const addLog = (msg) => {
    setCombatLogs(prev => [...prev.slice(-40), msg]);
  };

  // Show floating damage number
  const triggerDamagePopup = (target, text, isCrit = false, isHeal = false) => {
    setDamagePopup({ target, text, isCrit, isHeal });
    setTimeout(() => setDamagePopup(null), 1100);
  };

  // Trigger shake animation
  const triggerShake = (target) => {
    setShakeTarget(target);
    setTimeout(() => setShakeTarget(null), 450);
  };

  // ── Player Actions ────────────────────────────────────────────────────────
  
  // 1. Standard Attack
  const handlePlayerAttack = () => {
    if (turn !== 'player' || !playerActive || !aiActive) return;
    setTurn('animating');

    // Remove shield from player at start of turn
    const currentPActive = { ...playerActive, isShielded: false };
    const { damage, isCrit, absorbed } = calculateAttackDamage(currentPActive, aiActive);

    playAttackHitSound(isCrit);
    triggerShake('ai');
    triggerDamagePopup('ai', `-${damage}`, isCrit);

    const newAiHp = Math.max(0, aiActive.hp - damage);
    const newAiActive = { 
      ...aiActive, 
      hp: newAiHp,
      isShielded: false // Shield broken by hit
    };

    // Buzz increase (+1, or +2 if crit)
    const buzzGain = isCrit ? 2 : 1;
    const newPlayerActive = {
      ...currentPActive,
      buzz: Math.min(currentPActive.maxBuzz, currentPActive.buzz + buzzGain)
    };

    const nextPTeam = [...playerTeam];
    nextPTeam[activePlayerIdx] = newPlayerActive;
    setPlayerTeam(nextPTeam);

    const nextAiTeam = [...aiTeam];
    nextAiTeam[activeAiIdx] = newAiActive;
    setAiTeam(nextAiTeam);

    addLog(
      `💥 ${playerActive.channel} lâche un Drop de Vidéo ! ${isCrit ? '🔥 COUP CRITIQUE VIRAL !' : ''} -${damage} PV ${absorbed ? '(défense adverse)' : ''}`
    );

    if (newAiHp === 0) {
      addLog(`💀 La carte adverse "${aiActive.channel}" est K.O. !`);
      if (checkBattleEnd(nextPTeam, nextAiTeam)) return;

      // Find next AI card
      const nextAiAliveIdx = nextAiTeam.findIndex(c => c.hp > 0);
      if (nextAiAliveIdx !== -1) {
        setTimeout(() => {
          setActiveAiIdx(nextAiAliveIdx);
          addLog(`🔄 L'adversaire envoie ${nextAiTeam[nextAiAliveIdx].channel} au front !`);
          setTurn('player'); // Player keeps advantage after KO
        }, 1200);
        return;
      }
    }

    // End player turn -> Trigger AI turn
    setTimeout(() => {
      executeAiTurn(nextPTeam, nextAiTeam);
    }, 900);
  };

  // 2. Defend / Moderation
  const handlePlayerDefend = () => {
    if (turn !== 'player' || !playerActive) return;
    setTurn('animating');
    playShieldSound();

    const newPlayerActive = {
      ...playerActive,
      isShielded: true,
      buzz: Math.min(playerActive.maxBuzz, playerActive.buzz + 1)
    };

    const nextPTeam = [...playerTeam];
    nextPTeam[activePlayerIdx] = newPlayerActive;
    setPlayerTeam(nextPTeam);

    addLog(`🛡️ ${playerActive.channel} active la Modération des Commentaires ! Dégâts réduits au prochain tour & +1 Buzz.`);

    setTimeout(() => {
      executeAiTurn(nextPTeam, aiTeam);
    }, 900);
  };

  // 3. Special Viral Ultimate
  const handlePlayerUltimate = () => {
    if (turn !== 'player' || !playerActive || !aiActive || playerActive.buzz < playerActive.maxBuzz) return;
    setTurn('animating');
    playSpecialBuzzSound();

    const currentPActive = { ...playerActive, isShielded: false };
    const { damage, healAmount, applyStun, buzzRefund, ultName } = calculateUltimateDamage(currentPActive, aiActive);

    triggerShake('ai');
    triggerDamagePopup('ai', `⚡ -${damage}`, true);

    const newAiHp = Math.max(0, aiActive.hp - damage);
    const newAiActive = {
      ...aiActive,
      hp: newAiHp,
      isStunned: applyStun ? true : aiActive.isStunned,
      isShielded: false
    };

    let newPlayerHp = currentPActive.hp;
    if (healAmount > 0) {
      newPlayerHp = Math.min(currentPActive.maxHp, currentPActive.hp + healAmount);
      triggerDamagePopup('player', `+${healAmount} PV`, false, true);
    }

    const newPlayerActive = {
      ...currentPActive,
      hp: newPlayerHp,
      buzz: buzzRefund // reset or partial refund
    };

    const nextPTeam = [...playerTeam];
    nextPTeam[activePlayerIdx] = newPlayerActive;
    setPlayerTeam(nextPTeam);

    const nextAiTeam = [...aiTeam];
    nextAiTeam[activeAiIdx] = newAiActive;
    setAiTeam(nextAiTeam);

    addLog(`🌟 ULTIME : ${playerActive.channel} déclenche "${ultName}" ! -${damage} PV massifs !`);
    if (healAmount > 0) addLog(`💚 Récupération de +${healAmount} PV !`);
    if (applyStun) addLog(`💫 L'adversaire est étourdi pour son prochain tour !`);

    if (newAiHp === 0) {
      addLog(`💀 La carte adverse "${aiActive.channel}" est K.O. !`);
      if (checkBattleEnd(nextPTeam, nextAiTeam)) return;

      const nextAiAliveIdx = nextAiTeam.findIndex(c => c.hp > 0);
      if (nextAiAliveIdx !== -1) {
        setTimeout(() => {
          setActiveAiIdx(nextAiAliveIdx);
          addLog(`🔄 L'adversaire envoie ${nextAiTeam[nextAiAliveIdx].channel} au front !`);
          setTurn('player');
        }, 1200);
        return;
      }
    }

    setTimeout(() => {
      executeAiTurn(nextPTeam, nextAiTeam);
    }, 1100);
  };

  // 4. Switch card
  const handlePlayerSwitch = (targetIdx) => {
    if (targetIdx === activePlayerIdx || playerTeam[targetIdx]?.hp <= 0) return;
    playClickSound();
    setShowSwitchModal(false);
    setTurn('animating');

    setActivePlayerIdx(targetIdx);
    addLog(`🔄 Remplacement : ${playerTeam[targetIdx].channel} monte sur le ring !`);

    setTimeout(() => {
      executeAiTurn(playerTeam, aiTeam, targetIdx);
    }, 800);
  };

  // ── AI Execution ──────────────────────────────────────────────────────────
  const executeAiTurn = (currentPTeam, currentAiTeam, overridePlayerIdx = null) => {
    const pIdx = overridePlayerIdx !== null ? overridePlayerIdx : activePlayerIdx;
    const currentPActive = currentPTeam[pIdx];
    const currentAiActive = currentAiTeam[activeAiIdx];

    if (!currentPActive || !currentAiActive || currentPActive.hp <= 0 || currentAiActive.hp <= 0) {
      setTurn('player');
      return;
    }

    // Check if AI is stunned
    if (currentAiActive.isStunned) {
      addLog(`💫 ${currentAiActive.channel} est étourdi et passe son tour !`);
      const unStunnedAi = { ...currentAiActive, isStunned: false };
      const nextAiTeam = [...currentAiTeam];
      nextAiTeam[activeAiIdx] = unStunnedAi;
      setAiTeam(nextAiTeam);
      setTurn('player');
      setRoundNumber(r => r + 1);
      return;
    }

    // AI chooses action
    const aiDecision = decideAiAction(currentAiActive, currentAiTeam.filter((_, i) => i !== activeAiIdx), currentPActive);

    // AI SWITCH
    if (aiDecision.type === 'SWITCH') {
      const switchTargetIdx = currentAiTeam.findIndex(c => c.id === aiDecision.targetId && c.hp > 0);
      if (switchTargetIdx !== -1) {
        setActiveAiIdx(switchTargetIdx);
        addLog(`🔄 L'adversaire effectue un remplacement tactique : ${currentAiTeam[switchTargetIdx].channel} entre en jeu !`);
        setTurn('player');
        setRoundNumber(r => r + 1);
        return;
      }
    }

    // AI DEFEND
    if (aiDecision.type === 'DEFEND') {
      playShieldSound();
      const updatedAi = {
        ...currentAiActive,
        isShielded: true,
        buzz: Math.min(currentAiActive.maxBuzz, currentAiActive.buzz + 1)
      };
      const nextAiTeam = [...currentAiTeam];
      nextAiTeam[activeAiIdx] = updatedAi;
      setAiTeam(nextAiTeam);
      addLog(`🛡️ L'adversaire (${currentAiActive.channel}) se met en posture de Modération !`);
      setTurn('player');
      setRoundNumber(r => r + 1);
      return;
    }

    // AI ULTIMATE
    if (aiDecision.type === 'ULTIMATE') {
      playSpecialBuzzSound();
      const { damage, healAmount, applyStun, ultName } = calculateUltimateDamage(currentAiActive, currentPActive);
      triggerShake('player');
      triggerDamagePopup('player', `⚡ -${damage}`, true);

      const newPlayerHp = Math.max(0, currentPActive.hp - damage);
      const newPlayerActive = {
        ...currentPActive,
        hp: newPlayerHp,
        isStunned: applyStun ? true : currentPActive.isStunned,
        isShielded: false
      };

      let newAiHp = currentAiActive.hp;
      if (healAmount > 0) {
        newAiHp = Math.min(currentAiActive.maxHp, currentAiActive.hp + healAmount);
        triggerDamagePopup('ai', `+${healAmount} PV`, false, true);
      }

      const updatedAi = {
        ...currentAiActive,
        hp: newAiHp,
        buzz: 0
      };

      const nextPTeam = [...currentPTeam];
      nextPTeam[pIdx] = newPlayerActive;
      setPlayerTeam(nextPTeam);

      const nextAiTeam = [...currentAiTeam];
      nextAiTeam[activeAiIdx] = updatedAi;
      setAiTeam(nextAiTeam);

      addLog(`⚠️ DANGER : ${currentAiActive.channel} adverse déclenche son Ultime "${ultName}" ! -${damage} PV !`);

      if (newPlayerHp === 0) {
        addLog(`💀 Ta carte "${currentPActive.channel}" est K.O. !`);
        if (checkBattleEnd(nextPTeam, nextAiTeam)) return;

        // Auto-switch to next alive player card
        const nextAliveIdx = nextPTeam.findIndex(c => c.hp > 0);
        if (nextAliveIdx !== -1) {
          setTimeout(() => {
            setActivePlayerIdx(nextAliveIdx);
            addLog(`🔄 ${nextPTeam[nextAliveIdx].channel} entre en scène pour te sauver !`);
            setTurn('player');
            setRoundNumber(r => r + 1);
          }, 1200);
          return;
        }
      }

      setTurn('player');
      setRoundNumber(r => r + 1);
      return;
    }

    // AI NORMAL ATTACK
    const { damage, isCrit, absorbed } = calculateAttackDamage(currentAiActive, currentPActive);
    playAttackHitSound(isCrit);
    triggerShake('player');
    triggerDamagePopup('player', `-${damage}`, isCrit);

    const newPlayerHp = Math.max(0, currentPActive.hp - damage);
    const newPlayerActive = {
      ...currentPActive,
      hp: newPlayerHp,
      isShielded: false
    };

    const updatedAi = {
      ...currentAiActive,
      buzz: Math.min(currentAiActive.maxBuzz, currentAiActive.buzz + (isCrit ? 2 : 1)),
      isShielded: false
    };

    const nextPTeam = [...currentPTeam];
    nextPTeam[pIdx] = newPlayerActive;
    setPlayerTeam(nextPTeam);

    const nextAiTeam = [...currentAiTeam];
    nextAiTeam[activeAiIdx] = updatedAi;
    setAiTeam(nextAiTeam);

    addLog(
      `🎯 ${currentAiActive.channel} adverse attaque ! ${isCrit ? '🔥 COUP CRITIQUE !' : ''} -${damage} PV ${absorbed ? '(amorti)' : ''}`
    );

    if (newPlayerHp === 0) {
      addLog(`💀 Ta carte "${currentPActive.channel}" est tombée K.O. !`);
      if (checkBattleEnd(nextPTeam, nextAiTeam)) return;

      const nextAliveIdx = nextPTeam.findIndex(c => c.hp > 0);
      if (nextAliveIdx !== -1) {
        setTimeout(() => {
          setActivePlayerIdx(nextAliveIdx);
          addLog(`🔄 ${nextPTeam[nextAliveIdx].channel} prend le relais !`);
          setTurn('player');
          setRoundNumber(r => r + 1);
        }, 1200);
        return;
      }
    }

    setTurn('player');
    setRoundNumber(r => r + 1);
  };

  // ── Filtered owned cards for deck selection ───────────────────────────────
  const filteredOwnedCards = useMemo(() => {
    return ownedCards.filter(c => {
      const matchRarity = filterRarity === 'ALL' || c.rarity === filterRarity;
      const matchSearch = !searchQuery.trim() || 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.channel?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRarity && matchSearch;
    });
  }, [ownedCards, filterRarity, searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER 1: Not enough cards in collection (< 3)
  // ─────────────────────────────────────────────────────────────────────────
  if (ownedCards.length < 3) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-8 rounded-3xl bg-[#0c1322] border-2 border-slate-800 shadow-2xl max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
            ⚔️
          </div>
          <h2 className="text-2xl font-black font-['Outfit'] text-white">
            L'Arène YouTube TCG t'attend !
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Pour combattre l'IA et remporter des TubeCoins 🪙, il te faut au minimum <strong className="text-amber-400">3 cartes</strong> dans ta collection.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenShop}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Ouvrir des Boosters en Boutique</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER 2: Deck & Difficulty Selection Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 font-['Outfit']">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
              <Swords className="w-3.5 h-3.5" />
              <span>Arène de Combat JcIA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Combat de Cartes YouTube France
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Affronte l'IA avec tes meilleures vidéos pour grimper dans les tendances et rafler des TubeCoins.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoPickTeam}
              className="px-4 py-2.5 rounded-xl bg-[#0f172a] border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-500/10 transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Équipe Optimale Auto</span>
            </button>

            <button
              onClick={handleStartBattle}
              disabled={selectedDeckIds.length < 3}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Lancer le Duel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. Choice of Opponent / AI Difficulty */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-400" />
              1. Choisis ton Adversaire
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {AI_DIFFICULTIES.map((diff) => {
              const isSelected = selectedDifficulty === diff.id;
              return (
                <div
                  key={diff.id}
                  onClick={() => { playClickSound(); setSelectedDifficulty(diff.id); }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-gradient-to-b ${diff.bgGradient} relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                      : 'border-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{diff.emoji}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-mono font-black">
                        +{diff.reward} 🪙
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base leading-snug">{diff.name}</h3>
                      <p className="text-[11px] text-slate-400 font-medium">{diff.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                      {diff.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[10px]">Prime de victoire</span>
                    <span className="font-mono font-black text-yellow-400">+{diff.reward} TC</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Selected Deck (3 Slots) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              2. Ton Équipe (3 cartes sélectionnées : {selectedDeckIds.length}/3)
            </h2>
            <span className="text-xs text-slate-500">Clique sur tes cartes ci-dessous pour modifier ton équipe</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((slotIdx) => {
              const cardId = selectedDeckIds[slotIdx];
              const card = cardId ? ownedCards.find(c => c.id === cardId) : null;
              const rarity = card ? (RARITY_CONFIG[card.rarity] || RARITY_CONFIG.COMMUNE) : null;

              if (!card) {
                return (
                  <div
                    key={slotIdx}
                    className="h-32 rounded-2xl border-2 border-dashed border-slate-800 bg-[#0c1322]/50 flex flex-col items-center justify-center text-slate-500 gap-2"
                  >
                    <span className="text-xl">🎴</span>
                    <span className="text-xs font-bold font-mono">Emplacement {slotIdx + 1} vide</span>
                  </div>
                );
              }

              return (
                <div
                  key={slotIdx}
                  className="p-3.5 rounded-2xl border-2 border-slate-700 bg-[#0c1322] shadow-md flex items-center gap-3 relative group"
                >
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/20">
                    <img 
                      src={card.thumbnail_url} 
                      alt={card.title} 
                      className="w-full h-full object-cover"
                    />
                    <span 
                      className="absolute top-1 right-1 text-[7px] font-black px-1 rounded text-slate-950"
                      style={{ background: rarity.sealColor }}
                    >
                      {rarity.shortLabel}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-400 truncate">{card.channel}</span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">{card.title}</p>
                    
                    <div className="flex items-center gap-3 pt-1 text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-sky-400" />
                        {formatNumber(card.views)}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400" />
                        {formatNumber(card.likes)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleCardSelection(card.id)}
                    className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                    title="Retirer cette carte"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Cards Selection Pool */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
              3. Ta Collection ({filteredOwnedCards.length} cartes)
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une vidéo ou créateur..."
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono w-56"
              />

              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="ALL">Toutes les raretés</option>
                <option value="COMMUNE">Commune</option>
                <option value="PEU_COMMUNE">Peu Commune</option>
                <option value="RARE">Rare</option>
                <option value="ULTRA_RARE">Ultra Rare</option>
                <option value="MYTHIQUE">Mythique</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {filteredOwnedCards.map((card) => {
              const isSelected = selectedDeckIds.includes(card.id);
              const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.COMMUNE;

              return (
                <div
                  key={card.id}
                  onClick={() => handleToggleCardSelection(card.id)}
                  className={`p-2 rounded-xl border-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-400/10 shadow-md shadow-yellow-400/20 scale-[1.02]'
                      : 'border-slate-800 bg-[#0c1322] hover:border-slate-600'
                  }`}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-1.5">
                    <img 
                      src={card.thumbnail_url} 
                      alt={card.title} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span 
                      className="absolute top-1 right-1 text-[7px] font-black px-1 rounded text-slate-950"
                      style={{ background: rarity.sealColor }}
                    >
                      {rarity.shortLabel}
                    </span>

                    {isSelected && (
                      <div className="absolute inset-0 bg-amber-500/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center text-xs font-black shadow">
                          ✓
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-amber-400 truncate block">{card.channel}</span>
                    <p className="text-[11px] font-bold text-white line-clamp-1 leading-snug">{card.title}</p>
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                      <span>{formatNumber(card.views)} vues</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER 3: Live Battle Arena Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'battle') {
    const opp = AI_DIFFICULTIES.find(d => d.id === selectedDifficulty) || AI_DIFFICULTIES[0];
    const canUseUltimate = playerActive && playerActive.buzz >= playerActive.maxBuzz;

    return (
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4 font-['Outfit'] select-none">
        
        {/* Top Arena Banner */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090f1d] border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">{opp.emoji}</span>
            <div>
              <h2 className="text-xs font-black text-white">{opp.name}</h2>
              <p className="text-[10px] text-slate-400 font-mono">Enjeu : +{opp.reward} 🪙 TubeCoins</p>
            </div>
          </div>

          <div className="text-center">
            <span className="text-xs font-mono font-bold text-amber-400">TOUR {roundNumber}</span>
            <div className="text-[10px] text-slate-400">
              {turn === 'player' ? '👉 C\'est ton tour !' : '⏳ L\'adversaire réfléchit...'}
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Abandonner le duel en cours ?')) {
                setPhase('select');
              }
            }}
            className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Quitter
          </button>
        </div>

        {/* ── BATTLEFIELD ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Main Visual Arena (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* OPPONENT SIDE (Top) */}
            <div className={`p-4 rounded-2xl bg-[#0b1324] border-2 transition-all relative overflow-hidden ${
              shakeTarget === 'ai' ? 'border-red-500 animate-shake shadow-lg shadow-red-500/30' : 'border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-400 uppercase tracking-wider">Adversaire</span>
                  {aiActive?.isShielded && (
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Modération Active
                    </span>
                  )}
                  {aiActive?.isStunned && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      💫 Étourdi
                    </span>
                  )}
                </div>

                {/* Opponent Bench Miniatures */}
                <div className="flex items-center gap-2">
                  {aiTeam.map((card, i) => (
                    <div 
                      key={card.id}
                      className={`w-7 h-7 rounded-lg overflow-hidden border ${
                        i === activeAiIdx 
                          ? 'border-amber-400 ring-2 ring-amber-400/30' 
                          : card.hp <= 0 
                          ? 'border-red-900 opacity-30 grayscale' 
                          : 'border-slate-700 opacity-70'
                      }`}
                      title={`${card.channel} (${card.hp}/${card.maxHp} PV)`}
                    >
                      <img src={card.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Opponent Active Card Showcase */}
              {aiActive && (
                <div className="flex items-center gap-4 relative">
                  {/* Floating Damage on AI */}
                  {damagePopup?.target === 'ai' && (
                    <div className={`absolute -top-3 left-24 z-30 font-black text-xl animate-bounce drop-shadow-md ${
                      damagePopup.isCrit ? 'text-yellow-300 text-2xl font-mono' : 'text-red-400 font-mono'
                    }`}>
                      {damagePopup.text}
                    </div>
                  )}

                  <div className="w-20 h-28 rounded-xl overflow-hidden bg-black shrink-0 border border-white/20 relative shadow-md">
                    <img src={aiActive.thumbnailUrl} alt={aiActive.name} className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 px-1 rounded text-[7px] font-black bg-white/80 text-black">
                      {aiActive.rarity}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-black text-sm text-white">{aiActive.channel}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{aiActive.name}</p>
                    </div>

                    {/* HP Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Audience (PV)</span>
                        <span className="font-bold text-white">{aiActive.hp} / {aiActive.maxHp}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-700/60 p-0.5">
                        <div 
                          className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-red-500 to-rose-400"
                          style={{ width: `${Math.max(0, (aiActive.hp / aiActive.maxHp) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Buzz Meter */}
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      <span className="text-slate-400 mr-1">Buzz :</span>
                      {[1, 2, 3].map(step => (
                        <span 
                          key={step}
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[8px] font-black ${
                            aiActive.buzz >= step 
                              ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/40' 
                              : 'bg-slate-800 text-slate-600'
                          }`}
                        >
                          ⚡
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PLAYER SIDE (Bottom) */}
            <div className={`p-4 rounded-2xl bg-[#0c162a] border-2 transition-all relative overflow-hidden ${
              shakeTarget === 'player' ? 'border-red-500 animate-shake shadow-lg shadow-red-500/30' : 'border-amber-500/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Ton Créateur Actif</span>
                  {playerActive?.isShielded && (
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Modération Active
                    </span>
                  )}
                  {playerActive?.isStunned && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      💫 Étourdi
                    </span>
                  )}
                </div>

                {/* Player Bench Miniatures (Clickable to switch) */}
                <div className="flex items-center gap-2">
                  {playerTeam.map((card, i) => (
                    <button
                      key={card.id}
                      onClick={() => handlePlayerSwitch(i)}
                      disabled={turn !== 'player' || i === activePlayerIdx || card.hp <= 0}
                      className={`w-8 h-8 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        i === activePlayerIdx 
                          ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' 
                          : card.hp <= 0 
                          ? 'border-red-900 opacity-30 grayscale cursor-not-allowed' 
                          : 'border-slate-700 opacity-80 hover:opacity-100 hover:border-amber-400'
                      }`}
                      title={`Remplacer par ${card.channel} (${card.hp}/${card.maxHp} PV)`}
                    >
                      <img src={card.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Active Card Showcase */}
              {playerActive && (
                <div className="flex items-center gap-4 relative">
                  {/* Floating Damage on Player */}
                  {damagePopup?.target === 'player' && (
                    <div className={`absolute -top-3 left-24 z-30 font-black text-xl animate-bounce drop-shadow-md ${
                      damagePopup.isHeal ? 'text-green-400 font-mono' : damagePopup.isCrit ? 'text-yellow-300 text-2xl font-mono' : 'text-red-400 font-mono'
                    }`}>
                      {damagePopup.text}
                    </div>
                  )}

                  <div className="w-24 h-32 rounded-xl overflow-hidden bg-black shrink-0 border-2 border-amber-400/60 relative shadow-lg">
                    <img src={playerActive.thumbnailUrl} alt={playerActive.name} className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 px-1.5 rounded text-[8px] font-black bg-amber-400 text-slate-950">
                      {playerActive.rarity}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5">
                    <div>
                      <h3 className="font-black text-base text-white flex items-center gap-1.5">
                        {playerActive.channel}
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                          ATK: {playerActive.atk} • DEF: {playerActive.def}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-1">{playerActive.name}</p>
                    </div>

                    {/* HP Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Audience (PV)</span>
                        <span className="font-bold text-white">{playerActive.hp} / {playerActive.maxHp}</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-700/60 p-0.5">
                        <div 
                          className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-500 to-green-400"
                          style={{ width: `${Math.max(0, (playerActive.hp / playerActive.maxHp) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Buzz Meter */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-slate-400">Jauge Buzz :</span>
                        {[1, 2, 3].map(step => (
                          <span 
                            key={step}
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black transition-all ${
                              playerActive.buzz >= step 
                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50 scale-110' 
                                : 'bg-slate-800 text-slate-600'
                            }`}
                          >
                            ⚡
                          </span>
                        ))}
                      </div>

                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {canUseUltimate ? '🔥 ULTIME DISPONIBLE !' : `${3 - playerActive.buzz} tours avant l'Ultime`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── ACTION CONTROLS PANEL ── */}
            <div className="p-4 rounded-2xl bg-[#090e1a] border-2 border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 1. Attaque Standard */}
              <button
                onClick={handlePlayerAttack}
                disabled={turn !== 'player' || playerActive?.isStunned}
                className="p-3.5 rounded-xl bg-gradient-to-b from-rose-600 to-rose-700 text-white font-black text-xs shadow-md shadow-rose-950/50 hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-1"
              >
                <Swords className="w-5 h-5" />
                <span>Drop Vidéo</span>
                <span className="text-[9px] font-normal text-rose-200">Attaque (~{playerActive?.atk} dmg)</span>
              </button>

              {/* 2. Modération (Défense) */}
              <button
                onClick={handlePlayerDefend}
                disabled={turn !== 'player' || playerActive?.isStunned || playerActive?.isShielded}
                className="p-3.5 rounded-xl bg-gradient-to-b from-sky-600 to-sky-700 text-white font-black text-xs shadow-md shadow-sky-950/50 hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-1"
              >
                <Shield className="w-5 h-5" />
                <span>Modération</span>
                <span className="text-[9px] font-normal text-sky-200">-60% dmg reçus & +1 ⚡</span>
              </button>

              {/* 3. Coup Viral (Ultime) */}
              <button
                onClick={handlePlayerUltimate}
                disabled={turn !== 'player' || !canUseUltimate || playerActive?.isStunned}
                className={`p-3.5 rounded-xl text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-1 ${
                  canUseUltimate
                    ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 shadow-amber-500/50 animate-pulse'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                <Flame className="w-5 h-5" />
                <span>Coup Viral</span>
                <span className="text-[9px] font-normal text-slate-950 font-mono">
                  {canUseUltimate ? '3/3 ⚡ PRÊT !' : `${playerActive?.buzz || 0}/3 ⚡`}
                </span>
              </button>

              {/* 4. Remplacer (Switch) */}
              <button
                onClick={() => setShowSwitchModal(true)}
                disabled={turn !== 'player' || playerTeam.filter(c => c.hp > 0).length <= 1}
                className="p-3.5 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 text-white font-black text-xs shadow-md hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-1"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Remplacer</span>
                <span className="text-[9px] font-normal text-slate-400">Changer de créateur</span>
              </button>
            </div>

          </div>

          {/* Side Combat Log (4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#090e1a] border-2 border-slate-800 flex flex-col h-[480px] shadow-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#0c1427] border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <span>📜</span> Journal du Duel
              </span>
              <span className="text-[10px] font-mono text-slate-500">Temps réel</span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-2 text-slate-300">
              {combatLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`p-1.5 rounded-lg border leading-relaxed text-[11px] ${
                    log.includes('💥') ? 'border-rose-500/30 bg-rose-950/20 text-rose-300' :
                    log.includes('🌟') || log.includes('🔥') ? 'border-amber-500/40 bg-amber-950/25 text-yellow-300 font-bold' :
                    log.includes('🛡️') ? 'border-sky-500/30 bg-sky-950/20 text-sky-300' :
                    log.includes('💀') ? 'border-red-600/40 bg-red-950/30 text-red-400 font-bold' :
                    log.includes('🔄') ? 'border-purple-500/30 bg-purple-950/20 text-purple-300' :
                    'border-slate-800 bg-slate-900/40 text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>

        {/* Modal: Switch Team Card */}
        {showSwitchModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0c1322] border-2 border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">Choisir un remplaçant</h3>
                <button 
                  onClick={() => setShowSwitchModal(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {playerTeam.map((card, idx) => {
                  const isCurrent = idx === activePlayerIdx;
                  const isFainted = card.hp <= 0;

                  return (
                    <button
                      key={card.id}
                      onClick={() => handlePlayerSwitch(idx)}
                      disabled={isCurrent || isFainted}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isCurrent 
                          ? 'border-amber-400 bg-amber-400/10 opacity-70 cursor-not-allowed' 
                          : isFainted 
                          ? 'border-red-900 bg-red-950/20 opacity-30 cursor-not-allowed' 
                          : 'border-slate-700 bg-slate-900 hover:border-amber-400'
                      }`}
                    >
                      <img src={card.thumbnailUrl} alt="" className="w-12 h-14 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-xs">{card.channel}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {isFainted ? 'K.O.' : `${card.hp} / ${card.maxHp} PV`}
                        </p>
                      </div>
                      {isCurrent && <span className="text-xs text-amber-400 font-bold">Actif</span>}
                      {isFainted && <span className="text-xs text-red-500 font-bold">K.O.</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER 4: Victory Celebration Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'victory') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center font-['Outfit'] space-y-6">
        <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-950/40 via-[#0c1322] to-[#070b14] border-2 border-amber-500/50 shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-4xl shadow-xl shadow-amber-500/30 animate-bounce">
            🏆
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase">
              Victoire Écrasante !
            </span>
            <h2 className="text-3xl font-black text-white">Tu as conquis les Tendances !</h2>
            <p className="text-slate-400 text-xs">
              L'IA a été terrassée par la force virale de tes créateurs favoris.
            </p>
          </div>

          {/* Reward Box */}
          <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-400/60 shadow-inner flex items-center justify-center gap-3">
            <span className="text-3xl">🪙</span>
            <div className="text-left">
              <span className="text-2xl font-black text-yellow-300 font-mono">+{rewardWon} TubeCoins</span>
              <p className="text-[10px] text-amber-400 uppercase font-black">Ajoutés à ton solde</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => { playClickSound(); setPhase('select'); }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all cursor-pointer"
            >
              Rejouer un Combat
            </button>
            <button
              onClick={onOpenShop}
              className="px-5 py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm hover:bg-slate-700 transition-all cursor-pointer"
            >
              Aller en Boutique
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER 5: Defeat Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'defeat') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center font-['Outfit'] space-y-6">
        <div className="p-8 rounded-3xl bg-[#0c1322] border-2 border-slate-800 shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-4xl shadow-inner">
            💀
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Défaite... L'Algorithme t'a dominé !</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Toutes tes cartes ont été mises K.O. Améliore ton équipe avec des cartes de rareté supérieure ou tente une autre stratégie !
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => { playClickSound(); setPhase('select'); }}
              className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Prendre sa Revanche</span>
            </button>
            <button
              onClick={onOpenShop}
              className="px-5 py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm hover:bg-slate-700 transition-all cursor-pointer"
            >
              Renforcer son Deck (Boutique)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

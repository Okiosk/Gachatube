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
import CardItem, { RARITY_CONFIG, formatNumber } from './CardItem';

export default function CombatView({
  collection = {},
  coins = 0,
  battleStats = {},
  cardUsageToday = {},
  onRecordCardUsage,
  onRewardCoins,
  onBattleFinish,
  onPlayVideo,
  onOpenShop
}) {
  // Collection cards array
  const ownedCards = useMemo(() => {
    return Object.values(collection)
      .map(item => item.card)
      .filter(Boolean);
  }, [collection]);

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const isCardExhausted = (cardId) => {
    return Boolean(cardUsageToday && cardUsageToday[cardId] === todayISO());
  };

  const availableCards = useMemo(() => {
    const today = todayISO();
    return ownedCards.filter(c => cardUsageToday[c.id] !== today);
  }, [ownedCards, cardUsageToday]);

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
  const [battleDialogue, setBattleDialogue] = useState('');
  const [ultimatesUsedInMatch, setUltimatesUsedInMatch] = useState(0);
  
  // Animation states
  const [attackingSide, setAttackingSide] = useState(null); // 'player' | 'ai' | null
  const [shakeTarget, setShakeTarget] = useState(null); // 'player' | 'ai' | null
  const [damagePopup, setDamagePopup] = useState(null); // { target: 'player'|'ai', text: string, isCrit: boolean, isHeal: boolean }
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [rewardWon, setRewardWon] = useState(0);

  // Available cards filter for deck selection
  const [filterRarity, setFilterRarity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-fill optimal team on first render (only non-exhausted cards)
  useEffect(() => {
    const today = todayISO();
    const available = ownedCards.filter(c => cardUsageToday[c.id] !== today);
    if (selectedDeckIds.length === 0 && available.length >= 3) {
      const sorted = [...available].sort((a, b) => (b.score || b.views) - (a.score || a.views));
      setSelectedDeckIds(sorted.slice(0, 3).map(c => c.id));
    }
  }, [ownedCards, cardUsageToday]);

  // If already selected cards become exhausted, remove them
  useEffect(() => {
    const today = todayISO();
    const valid = selectedDeckIds.filter(id => cardUsageToday[id] !== today);
    if (valid.length !== selectedDeckIds.length) {
      setSelectedDeckIds(valid);
    }
  }, [cardUsageToday]);

  // ── Deck Builder Helpers ──────────────────────────────────────────────────
  const handleToggleCardSelection = (cardId) => {
    if (isCardExhausted(cardId)) {
      alert("Cette carte a déjà combattu aujourd'hui ! Chaque carte ne peut être utilisée qu'une seule fois par jour.");
      return;
    }
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
    if (availableCards.length < 3) {
      alert("Pas assez de cartes disponibles en forme aujourd'hui (minimum 3 requises). Tes cartes ayant déjà combattu se reposent jusqu'à minuit !");
      return;
    }
    const sorted = [...availableCards].sort((a, b) => (b.score || b.views) - (a.score || a.views));
    setSelectedDeckIds(sorted.slice(0, 3).map(c => c.id));
  };

  // ── Start Match ───────────────────────────────────────────────────────────
  const handleStartBattle = () => {
    if (selectedDeckIds.length < 3) return;
    const hasTired = selectedDeckIds.some(id => isCardExhausted(id));
    if (hasTired) {
      alert("Une ou plusieurs cartes sélectionnées ont déjà combattu aujourd'hui !");
      return;
    }
    playClickSound();

    const selectedCards = selectedDeckIds
      .map(id => ownedCards.find(c => c.id === id))
      .filter(Boolean);

    if (selectedCards.length < 3) return;

    // Record daily fatigue for chosen cards
    if (onRecordCardUsage) {
      onRecordCardUsage(selectedDeckIds);
    }

    // Convert to combat cards
    const pTeam = selectedCards.map((c, idx) => createCombatCard(c, true, idx));
    const aTeam = generateAiTeam(selectedDifficulty, ownedCards);

    setPlayerTeam(pTeam);
    setAiTeam(aTeam);
    setActivePlayerIdx(0);
    setActiveAiIdx(0);
    setRoundNumber(1);
    setTurn('player');
    setUltimatesUsedInMatch(0);
    setBattleDialogue(`Un duel commence contre ${AI_DIFFICULTIES.find(d => d.id === selectedDifficulty)?.name || 'l\'adversaire'} ! Que doit faire ${pTeam[0].channel} ?`);
    setPhase('battle');
  };

  // Current active cards
  const playerActive = playerTeam[activePlayerIdx] || null;
  const aiActive = aiTeam[activeAiIdx] || null;

  // Extract pure card for CardItem component
  const getOriginalCard = (combatCard) => {
    if (!combatCard) return null;
    return combatCard.baseCard || {
      id: combatCard.id,
      title: combatCard.name,
      channel: combatCard.channel,
      rarity: combatCard.rarity,
      thumbnail_url: combatCard.thumbnailUrl,
      views: combatCard.views || 500000,
      likes: combatCard.likes || 25000,
      comments: combatCard.comments || 1200,
    };
  };

  // Check victory / defeat conditions
  const checkBattleEnd = (pTeam, aTeam) => {
    const allAiDefeated = aTeam.every(c => c.hp <= 0);
    if (allAiDefeated) {
      const diff = AI_DIFFICULTIES.find(d => d.id === selectedDifficulty);
      const reward = diff ? diff.reward : 1;
      setRewardWon(reward);
      if (onRewardCoins) onRewardCoins(reward);

      const flawless = pTeam.every(c => c.hp > 0);
      if (onBattleFinish) {
        onBattleFinish({
          won: true,
          difficulty: selectedDifficulty,
          flawless,
          ultimatesCount: ultimatesUsedInMatch,
          reward,
        });
      }

      playVictoryJingle();
      setPhase('victory');
      return true;
    }

    const allPlayerDefeated = pTeam.every(c => c.hp <= 0);
    if (allPlayerDefeated) {
      if (onBattleFinish) {
        onBattleFinish({
          won: false,
          difficulty: selectedDifficulty,
          flawless: false,
          ultimatesCount: ultimatesUsedInMatch,
          reward: 0,
        });
      }
      playDefeatSound();
      setPhase('defeat');
      return true;
    }

    return false;
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

  // HP Bar dynamic gradient based on health percentage
  const getHpBarColor = (hp, maxHp) => {
    const pct = (hp / maxHp) * 100;
    if (pct > 50) return 'from-emerald-500 to-green-400';
    if (pct > 20) return 'from-amber-500 to-yellow-400';
    return 'from-rose-600 to-red-500';
  };

  // ── Player Actions ────────────────────────────────────────────────────────
  
  // 1. Standard Attack (Drop Vidéo)
  const handlePlayerAttack = () => {
    if (turn !== 'player' || !playerActive || !aiActive) return;
    setTurn('animating');
    setAttackingSide('player');

    // Remove shield from player at start of turn
    const currentPActive = { ...playerActive, isShielded: false };
    const { damage, isCrit } = calculateAttackDamage(currentPActive, aiActive);

    setTimeout(() => {
      setAttackingSide(null);
      playAttackHitSound(isCrit);
      triggerShake('ai');
      triggerDamagePopup('ai', `-${damage}`, isCrit);

      const newAiHp = Math.max(0, aiActive.hp - damage);
      const newAiActive = { 
        ...aiActive, 
        hp: newAiHp,
        isShielded: false
      };

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

      setBattleDialogue(
        `${playerActive.channel} lance Drop Vidéo ! ${isCrit ? '💥 Coup critique viral ! ' : ''}-${damage} PV à ${aiActive.channel} !`
      );

      if (newAiHp === 0) {
        setTimeout(() => {
          setBattleDialogue(`💀 ${aiActive.channel} adverse est K.O. !`);
          if (checkBattleEnd(nextPTeam, nextAiTeam)) return;

          const nextAiAliveIdx = nextAiTeam.findIndex(c => c.hp > 0);
          if (nextAiAliveIdx !== -1) {
            setTimeout(() => {
              setActiveAiIdx(nextAiAliveIdx);
              setBattleDialogue(`🔄 L'adversaire envoie ${nextAiTeam[nextAiAliveIdx].channel} au front !`);
              setTimeout(() => {
                setTurn('player');
                setBattleDialogue(`Que doit faire ${playerActive.channel} ?`);
              }, 1000);
            }, 1000);
          }
        }, 600);
        return;
      }

      setTimeout(() => {
        executeAiTurn(nextPTeam, nextAiTeam);
      }, 1000);
    }, 280);
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

    setBattleDialogue(`🛡️ ${playerActive.channel} active la Modération ! Dégâts subis réduits & +1 Buzz.`);

    setTimeout(() => {
      executeAiTurn(nextPTeam, aiTeam);
    }, 1000);
  };

  // 3. Special Viral Ultimate
  const handlePlayerUltimate = () => {
    if (turn !== 'player' || !playerActive || !aiActive || playerActive.buzz < playerActive.maxBuzz) return;
    setTurn('animating');
    setAttackingSide('player');
    setUltimatesUsedInMatch(u => u + 1);

    const currentPActive = { ...playerActive, isShielded: false };
    const { damage, healAmount, applyStun, buzzRefund, ultName } = calculateUltimateDamage(currentPActive, aiActive);

    setTimeout(() => {
      setAttackingSide(null);
      playSpecialBuzzSound();
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
        buzz: buzzRefund
      };

      const nextPTeam = [...playerTeam];
      nextPTeam[activePlayerIdx] = newPlayerActive;
      setPlayerTeam(nextPTeam);

      const nextAiTeam = [...aiTeam];
      nextAiTeam[activeAiIdx] = newAiActive;
      setAiTeam(nextAiTeam);

      setBattleDialogue(`🌟 COUP VIRAL ! ${playerActive.channel} déclenche "${ultName}" ! -${damage} PV massifs !${applyStun ? ' Adversaire étourdi !' : ''}`);

      if (newAiHp === 0) {
        setTimeout(() => {
          setBattleDialogue(`💀 ${aiActive.channel} adverse est K.O. !`);
          if (checkBattleEnd(nextPTeam, nextAiTeam)) return;

          const nextAiAliveIdx = nextAiTeam.findIndex(c => c.hp > 0);
          if (nextAiAliveIdx !== -1) {
            setTimeout(() => {
              setActiveAiIdx(nextAiAliveIdx);
              setBattleDialogue(`🔄 L'adversaire envoie ${nextAiTeam[nextAiAliveIdx].channel} au front !`);
              setTimeout(() => {
                setTurn('player');
                setBattleDialogue(`Que doit faire ${playerActive.channel} ?`);
              }, 1000);
            }, 1000);
          }
        }, 600);
        return;
      }

      setTimeout(() => {
        executeAiTurn(nextPTeam, nextAiTeam);
      }, 1200);
    }, 300);
  };

  // 4. Switch card
  const handlePlayerSwitch = (targetIdx) => {
    if (targetIdx === activePlayerIdx || playerTeam[targetIdx]?.hp <= 0) return;
    playClickSound();
    setShowSwitchModal(false);
    setTurn('animating');

    setActivePlayerIdx(targetIdx);
    setBattleDialogue(`🔄 Remplacement : ${playerTeam[targetIdx].channel} entre sur le terrain !`);

    setTimeout(() => {
      executeAiTurn(playerTeam, aiTeam, targetIdx);
    }, 1000);
  };

  // ── AI Execution ──────────────────────────────────────────────────────────
  const executeAiTurn = (currentPTeam, currentAiTeam, overridePlayerIdx = null) => {
    const pIdx = overridePlayerIdx !== null ? overridePlayerIdx : activePlayerIdx;
    const currentPActive = currentPTeam[pIdx];
    const currentAiActive = currentAiTeam[activeAiIdx];

    if (!currentPActive || !currentAiActive || currentPActive.hp <= 0 || currentAiActive.hp <= 0) {
      setTurn('player');
      setBattleDialogue(`Que doit faire ${currentPTeam[pIdx]?.channel || 'ton créateur'} ?`);
      return;
    }

    // Check if AI is stunned
    if (currentAiActive.isStunned) {
      setBattleDialogue(`💫 ${currentAiActive.channel} adverse est étourdi et passe son tour !`);
      const unStunnedAi = { ...currentAiActive, isStunned: false };
      const nextAiTeam = [...currentAiTeam];
      nextAiTeam[activeAiIdx] = unStunnedAi;
      setAiTeam(nextAiTeam);
      setTimeout(() => {
        setTurn('player');
        setRoundNumber(r => r + 1);
        setBattleDialogue(`Que doit faire ${currentPActive.channel} ?`);
      }, 1200);
      return;
    }

    const aiDecision = decideAiAction(currentAiActive, currentAiTeam.filter((_, i) => i !== activeAiIdx), currentPActive);

    // AI SWITCH
    if (aiDecision.type === 'SWITCH') {
      const switchTargetIdx = currentAiTeam.findIndex(c => c.id === aiDecision.targetId && c.hp > 0);
      if (switchTargetIdx !== -1) {
        setActiveAiIdx(switchTargetIdx);
        setBattleDialogue(`🔄 L'adversaire effectue un remplacement : ${currentAiTeam[switchTargetIdx].channel} entre en jeu !`);
        setTimeout(() => {
          setTurn('player');
          setRoundNumber(r => r + 1);
          setBattleDialogue(`Que doit faire ${currentPActive.channel} ?`);
        }, 1200);
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
      setBattleDialogue(`🛡️ ${currentAiActive.channel} adverse se met en posture de Modération !`);
      setTimeout(() => {
        setTurn('player');
        setRoundNumber(r => r + 1);
        setBattleDialogue(`Que doit faire ${currentPActive.channel} ?`);
      }, 1200);
      return;
    }

    // AI ULTIMATE
    if (aiDecision.type === 'ULTIMATE') {
      setAttackingSide('ai');
      const { damage, healAmount, applyStun, ultName } = calculateUltimateDamage(currentAiActive, currentPActive);

      setTimeout(() => {
        setAttackingSide(null);
        playSpecialBuzzSound();
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

        setBattleDialogue(`⚠️ ATTENTION ! ${currentAiActive.channel} adverse déclenche son Ultime "${ultName}" ! -${damage} PV !`);

        if (newPlayerHp === 0) {
          setTimeout(() => {
            setBattleDialogue(`💀 Ta carte "${currentPActive.channel}" est K.O. !`);
            if (checkBattleEnd(nextPTeam, nextAiTeam)) return;

            const nextAliveIdx = nextPTeam.findIndex(c => c.hp > 0);
            if (nextAliveIdx !== -1) {
              setTimeout(() => {
                setActivePlayerIdx(nextAliveIdx);
                setBattleDialogue(`🔄 ${nextPTeam[nextAliveIdx].channel} entre en scène !`);
                setTimeout(() => {
                  setTurn('player');
                  setRoundNumber(r => r + 1);
                  setBattleDialogue(`Que doit faire ${nextPTeam[nextAliveIdx].channel} ?`);
                }, 1000);
              }, 1200);
            }
          }, 600);
          return;
        }

        setTimeout(() => {
          setTurn('player');
          setRoundNumber(r => r + 1);
          setBattleDialogue(`Que doit faire ${currentPActive.channel} ?`);
        }, 1200);
      }, 300);
      return;
    }

    // AI NORMAL ATTACK
    setAttackingSide('ai');
    const { damage, isCrit } = calculateAttackDamage(currentAiActive, currentPActive);

    setTimeout(() => {
      setAttackingSide(null);
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

      setBattleDialogue(
        `${currentAiActive.channel} adverse attaque avec Drop Vidéo ! ${isCrit ? '💥 Coup critique ! ' : ''}-${damage} PV à ${currentPActive.channel} !`
      );

      if (newPlayerHp === 0) {
        setTimeout(() => {
          setBattleDialogue(`💀 Ta carte "${currentPActive.channel}" est K.O. !`);
          if (checkBattleEnd(nextPTeam, nextAiTeam)) return;

          const nextAliveIdx = nextPTeam.findIndex(c => c.hp > 0);
          if (nextAliveIdx !== -1) {
            setTimeout(() => {
              setActivePlayerIdx(nextAliveIdx);
              setBattleDialogue(`🔄 ${nextPTeam[nextAliveIdx].channel} monte au front !`);
              setTimeout(() => {
                setTurn('player');
                setRoundNumber(r => r + 1);
                setBattleDialogue(`Que doit faire ${nextPTeam[nextAliveIdx].channel} ?`);
              }, 1000);
            }, 1200);
          }
        }, 600);
        return;
      }

      setTimeout(() => {
        setTurn('player');
        setRoundNumber(r => r + 1);
        setBattleDialogue(`Que doit faire ${currentPActive.channel} ?`);
      }, 1200);
    }, 280);
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

  // ── Pagination for deck builder (prevents lagging with thousands of cards) ──
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(18);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRarity, searchQuery, cardsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredOwnedCards.length / cardsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return filteredOwnedCards.slice(start, start + cardsPerPage);
  }, [filteredOwnedCards, currentPage, cardsPerPage]);

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
              Affronte l'IA avec tes meilleures vidéos. Chaque carte ne peut combattre qu'une fois par jour !
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
              const isDefeated = (battleStats?.difficultiesDefeated || []).includes(diff.id);

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
                      <div className="flex items-center gap-1.5">
                        {isDefeated && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-black flex items-center gap-1">
                            ✓ VAINCU
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-mono font-black">
                          +{diff.reward} 🪙
                        </span>
                      </div>
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
              2. Ton Équipe (3 cartes : {selectedDeckIds.length}/3)
            </h2>
            <span className="text-xs text-slate-400">
              {availableCards.length} cartes en forme aujourd'hui
            </span>
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
                    className="h-36 rounded-2xl border-2 border-dashed border-slate-800 bg-[#0c1322]/50 flex flex-col items-center justify-center text-slate-500 gap-2"
                  >
                    <span className="text-2xl">🎴</span>
                    <span className="text-xs font-bold font-mono">Emplacement {slotIdx + 1} libre</span>
                  </div>
                );
              }

              return (
                <div
                  key={slotIdx}
                  className="p-3 rounded-2xl border-2 border-amber-400/60 bg-[#0c1322] shadow-md flex items-center gap-3 relative group"
                >
                  <div className="w-16 h-22 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/20 shadow">
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

        {/* 3. Cards Selection Pool with authentic CardItem */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
                3. Ta Collection ({filteredOwnedCards.length} cartes)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Règle : Chaque carte ne peut combattre qu'une seule fois par jour.
              </p>
            </div>

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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 place-items-center">
            {paginatedCards.map((card) => {
              const isSelected = selectedDeckIds.includes(card.id);
              const isTired = isCardExhausted(card.id);
              const count = collection[card.id]?.count || 1;

              return (
                <div
                  key={card.id}
                  onClick={() => handleToggleCardSelection(card.id)}
                  className={`relative transition-all cursor-pointer rounded-2xl group ${
                    isTired
                      ? 'opacity-55 grayscale cursor-not-allowed'
                      : isSelected
                      ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-105 shadow-xl shadow-amber-500/30'
                      : 'hover:scale-102 hover:brightness-105'
                  }`}
                  title={isTired ? "Carte au repos (a déjà combattu aujourd'hui)" : card.title}
                >
                  <CardItem card={card} size="compact" interactive={false} count={count} />

                  {/* Selected checkmark badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg border-2 border-slate-950 text-sm animate-bounce">
                      ✓
                    </div>
                  )}

                  {/* Daily Fatigue Overlay */}
                  {isTired && (
                    <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-2xl mb-1">⏳</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-black uppercase">
                        En repos
                      </span>
                      <span className="text-[9px] text-slate-300 mt-1">1 combat / jour</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Pagination Controls Bar ── */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                Affichage <span className="text-amber-400 font-bold">{(currentPage - 1) * cardsPerPage + 1}</span> à{' '}
                <span className="text-amber-400 font-bold">{Math.min(currentPage * cardsPerPage, filteredOwnedCards.length)}</span> sur{' '}
                <span className="text-white font-bold">{filteredOwnedCards.length}</span> cartes
              </div>

              <div className="flex items-center gap-1.5">
                {/* First Page */}
                <button
                  onClick={() => { playClickSound(); setCurrentPage(1); }}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white hover:border-amber-400/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Première page"
                >
                  ⏮
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => { playClickSound(); setCurrentPage(p => Math.max(1, p - 1)); }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white hover:border-amber-400/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  ◀ <span className="hidden sm:inline">Précédent</span>
                </button>

                {/* Numbered Page Buttons */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis-' + p);
                      acc.push(p);
                      return acc;
                    }, [])
                    .map(item => {
                      if (typeof item === 'string') {
                        return <span key={item} className="px-1 text-slate-600 font-mono">...</span>;
                      }
                      const isCurrent = item === currentPage;
                      return (
                        <button
                          key={item}
                          onClick={() => { playClickSound(); setCurrentPage(item); }}
                          className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-amber-400/50 hover:text-white'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => { playClickSound(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white hover:border-amber-400/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Suivant</span> ▶
                </button>

                {/* Last Page */}
                <button
                  onClick={() => { playClickSound(); setCurrentPage(totalPages); }}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white hover:border-amber-400/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Dernière page"
                >
                  ⏭
                </button>
              </div>

              {/* Cards per page selector */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>Par page :</span>
                <select
                  value={cardsPerPage}
                  onChange={(e) => { setCardsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value={12}>12</option>
                  <option value={18}>18</option>
                  <option value={24}>24</option>
                  <option value={36}>36</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER 3: Pokémon-Style Battle Arena Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'battle') {
    const opp = AI_DIFFICULTIES.find(d => d.id === selectedDifficulty) || AI_DIFFICULTIES[0];
    const canUseUltimate = playerActive && playerActive.buzz >= playerActive.maxBuzz;

    return (
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-1 flex flex-col h-[calc(100vh-4.8rem)] max-h-[820px] justify-between select-none font-['Outfit'] gap-2">
        
        {/* Top Arena Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#090f1d] border border-slate-800 shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{opp.emoji}</span>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white">{opp.name}</h2>
              <p className="text-[10px] text-slate-400 font-mono">Prime : +{opp.reward} 🪙 TubeCoins</p>
            </div>
          </div>

          <div className="text-center">
            <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">TOUR {roundNumber}</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Abandonner le combat en cours ?')) {
                setPhase('select');
              }
            }}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Quitter
          </button>
        </div>

        {/* ── POKÉMON-STYLE BATTLE STAGE ── */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-slate-800/80 bg-gradient-to-b from-[#060c1c] via-[#091326] to-[#040813] flex-1 min-h-0 flex flex-col justify-between p-3 sm:p-4 shadow-2xl">
          
          {/* Subtle battleground stadium grid & lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] opacity-5 [background-size:20px_20px] pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

          {/* ── UPPER ZONE: OPPONENT SIDE (Status Box Left + Elevated Platform Right) ── */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            
            {/* Opponent Status Box (Pokémon Plate style) */}
            {aiActive && (
              <div className="w-56 sm:w-68 p-2.5 rounded-xl bg-[#0a1428]/90 border border-slate-700/80 backdrop-blur-md shadow-lg space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-black text-xs sm:text-sm text-white truncate">{aiActive.channel}</h3>
                    <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      IA
                    </span>
                  </div>

                  {/* Opponent Bench Dots */}
                  <div className="flex items-center gap-1.5" title="Cartes adverses restantes">
                    {aiTeam.map((card, i) => {
                      const isAlive = card.hp > 0;
                      const isCurrent = i === activeAiIdx;
                      return (
                        <span
                          key={card.id || i}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            !isAlive
                              ? 'bg-slate-700 border border-slate-600 opacity-40'
                              : isCurrent
                              ? 'bg-amber-400 border-2 border-white ring-2 ring-amber-400/50 scale-110'
                              : 'bg-emerald-400 border border-emerald-300'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* HP Gauge */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[9.5px] font-mono">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Audience (PV)</span>
                    <span className="font-black text-white font-mono">{aiActive.hp} / {aiActive.maxHp}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 border border-white/10 p-0.5 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getHpBarColor(aiActive.hp, aiActive.maxHp)}`}
                      style={{ width: `${Math.max(0, (aiActive.hp / aiActive.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Active Buffs & Buzz */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {aiActive.isShielded && (
                    <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[8.5px] font-bold border border-sky-500/40 flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> Modération
                    </span>
                  )}
                  {aiActive.isStunned && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[8.5px] font-bold border border-amber-500/40">
                      💫 Étourdi
                    </span>
                  )}
                  <div className="flex items-center gap-1 ml-auto text-[8.5px] font-mono text-slate-400">
                    <span>Buzz:</span>
                    {[1, 2, 3].map(step => (
                      <span
                        key={step}
                        className={`w-3 h-3 rounded flex items-center justify-center text-[7px] font-black ${
                          aiActive.buzz >= step ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        ⚡
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Opponent Elevated Pedestal with CardItem */}
            <div className="self-end sm:self-auto sm:mr-6 flex flex-col items-center relative -my-4 sm:-my-2 scale-[0.76] sm:scale-[0.84] md:scale-90 origin-bottom">
              {/* Floating Damage Popup over AI */}
              {damagePopup?.target === 'ai' && (
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 z-40 font-black font-mono tracking-tight pointer-events-none animate-bounce drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] ${
                  damagePopup.isCrit ? 'text-yellow-300 text-3xl font-extrabold scale-110' : 'text-rose-400 text-2xl'
                }`}>
                  {damagePopup.text}
                </div>
              )}

              {/* Opponent Active Card */}
              {aiActive && (
                <div
                  className={`relative transition-all duration-300 transform ${
                    attackingSide === 'ai' ? '-translate-x-8 translate-y-6 scale-105' : ''
                  } ${shakeTarget === 'ai' ? 'animate-shake' : ''} ${aiActive.hp <= 0 ? 'translate-y-14 opacity-0' : ''}`}
                >
                  <CardItem card={getOriginalCard(aiActive)} size="compact" interactive={false} />
                  {aiActive.isShielded && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-sky-400 bg-sky-500/15 pointer-events-none shadow-[0_0_20px_rgba(56,189,248,0.5)] animate-pulse" />
                  )}
                </div>
              )}

              {/* Pedestal Ellipse Shadow */}
              <div className="w-48 h-8 -mt-4 rounded-[50%] bg-radial from-slate-600/40 via-slate-800/30 to-transparent border-t border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.9)] pointer-events-none" />
            </div>

          </div>

          {/* ── LOWER ZONE: PLAYER SIDE (Platform Left + Status Box Right) ── */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            
            {/* Player Foreground Pedestal with CardItem */}
            <div className="sm:ml-6 flex flex-col items-center relative order-2 sm:order-1 -my-4 sm:-my-2 scale-[0.80] sm:scale-[0.88] md:scale-95 origin-bottom">
              {/* Floating Damage Popup over Player */}
              {damagePopup?.target === 'player' && (
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 z-40 font-black font-mono tracking-tight pointer-events-none animate-bounce drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] ${
                  damagePopup.isHeal ? 'text-emerald-400 text-2xl' : damagePopup.isCrit ? 'text-yellow-300 text-3xl font-extrabold scale-110' : 'text-rose-400 text-2xl'
                }`}>
                  {damagePopup.text}
                </div>
              )}

              {/* Player Active Card */}
              {playerActive && (
                <div
                  className={`relative transition-all duration-300 transform ${
                    attackingSide === 'player' ? 'translate-x-8 -translate-y-6 scale-105' : ''
                  } ${shakeTarget === 'player' ? 'animate-shake' : ''} ${playerActive.hp <= 0 ? 'translate-y-14 opacity-0' : ''}`}
                >
                  <CardItem card={getOriginalCard(playerActive)} size="compact" interactive={true} />
                  {playerActive.isShielded && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-sky-400 bg-sky-500/15 pointer-events-none shadow-[0_0_20px_rgba(56,189,248,0.5)] animate-pulse" />
                  )}
                </div>
              )}

              {/* Pedestal Ellipse Shadow */}
              <div className="w-52 h-9 -mt-4 rounded-[50%] bg-radial from-amber-500/20 via-amber-600/10 to-transparent border-t border-amber-400/20 shadow-[0_12px_36px_rgba(0,0,0,0.9)] pointer-events-none" />
            </div>

            {/* Player Status Box (Pokémon Plate style) */}
            {playerActive && (
              <div className="w-56 sm:w-68 p-2.5 rounded-xl bg-[#0c162c]/95 border border-amber-500/40 backdrop-blur-md shadow-lg space-y-1.5 order-1 sm:order-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-black text-xs sm:text-sm text-white truncate">{playerActive.channel}</h3>
                    <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
                      Actif
                    </span>
                  </div>

                  {/* Player Bench Dots (Clickable to switch) */}
                  <div className="flex items-center gap-1.5" title="Clique sur une carte vivante pour remplacer">
                    {playerTeam.map((card, i) => {
                      const isAlive = card.hp > 0;
                      const isCurrent = i === activePlayerIdx;
                      return (
                        <button
                          key={card.id || i}
                          onClick={() => isAlive && !isCurrent && turn === 'player' && handlePlayerSwitch(i)}
                          disabled={!isAlive || isCurrent || turn !== 'player'}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            !isAlive
                              ? 'bg-slate-700 border border-slate-600 opacity-40 cursor-not-allowed'
                              : isCurrent
                              ? 'bg-amber-400 border-2 border-white ring-2 ring-amber-400/50 scale-125'
                              : 'bg-emerald-400 border border-emerald-300 hover:scale-125 cursor-pointer'
                          }`}
                          title={isAlive ? `Remplacer par ${card.channel} (${card.hp}/${card.maxHp} PV)` : `${card.channel} est K.O.`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* HP Gauge */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[9.5px] font-mono">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Audience (PV)</span>
                    <span className="font-black text-white font-mono">{playerActive.hp} <span className="text-slate-500 font-normal">/ {playerActive.maxHp}</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 border border-white/10 p-0.5 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getHpBarColor(playerActive.hp, playerActive.maxHp)}`}
                      style={{ width: `${Math.max(0, (playerActive.hp / playerActive.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Buzz & Status */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1 text-[9px] font-mono">
                    <span className="text-slate-400">Buzz :</span>
                    {[1, 2, 3].map(step => (
                      <span
                        key={step}
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[7.5px] font-black transition-all ${
                          playerActive.buzz >= step
                            ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/60 scale-110 font-bold'
                            : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        ⚡
                      </span>
                    ))}
                  </div>

                  <span className="text-[9.5px] font-mono font-bold text-amber-400">
                    {canUseUltimate ? '🔥 ULTIME PRÊT !' : `${3 - playerActive.buzz} ⚡ restants`}
                  </span>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ── 4 ACTION COMMANDS (Clean Full-Width Grid - No Question Dialogue) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 shrink-0">
          {/* 1. Drop Vidéo (Attaque Standard) */}
          <button
            onClick={handlePlayerAttack}
            disabled={turn !== 'player' || playerActive?.isStunned}
            className="py-2.5 px-3 rounded-2xl bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-950/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 border border-rose-400/30"
          >
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <div className="text-left min-w-0 leading-tight">
              <span className="block truncate">Drop Vidéo</span>
              <span className="block text-[10px] font-normal font-mono text-rose-200">~{playerActive?.atk} dmg</span>
            </div>
          </button>

          {/* 2. Modération (Défense) */}
          <button
            onClick={handlePlayerDefend}
            disabled={turn !== 'player' || playerActive?.isStunned || playerActive?.isShielded}
            className="py-2.5 px-3 rounded-2xl bg-gradient-to-b from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-black text-xs sm:text-sm shadow-md shadow-sky-950/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 border border-sky-400/30"
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <div className="text-left min-w-0 leading-tight">
              <span className="block truncate">Modération</span>
              <span className="block text-[10px] font-normal font-mono text-sky-200">-60% & +1 ⚡</span>
            </div>
          </button>

          {/* 3. Coup Viral (Ultime) */}
          <button
            onClick={handlePlayerUltimate}
            disabled={turn !== 'player' || !canUseUltimate || playerActive?.isStunned}
            className={`py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border ${
              canUseUltimate
                ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 text-slate-950 border-yellow-200 shadow-amber-500/50 hover:scale-[1.02] active:scale-95 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:scale-100'
            }`}
          >
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-950" />
            <div className="text-left min-w-0 leading-tight">
              <span className="block truncate">Coup Viral</span>
              <span className="block text-[10px] font-mono font-bold">
                {canUseUltimate ? '3/3 ⚡ PRÊT !' : `${playerActive?.buzz || 0}/3 ⚡`}
              </span>
            </div>
          </button>

          {/* 4. Remplacer (Switch) */}
          <button
            onClick={() => setShowSwitchModal(true)}
            disabled={turn !== 'player' || playerTeam.filter(c => c.hp > 0).length <= 1}
            className="py-2.5 px-3 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black text-xs sm:text-sm shadow-md border border-slate-600/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <div className="text-left min-w-0 leading-tight">
              <span className="block truncate">Remplacer</span>
              <span className="block text-[10px] font-normal font-mono text-slate-400">Équipe</span>
            </div>
          </button>
        </div>

        {/* Modal: Switch Team Card */}
        {showSwitchModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0c1322] border-2 border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">Choisir un remplaçant</h3>
                <button 
                  onClick={() => setShowSwitchModal(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
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
                      {isCurrent && <span className="text-xs text-amber-400 font-bold">Au combat</span>}
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

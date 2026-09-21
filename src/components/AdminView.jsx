import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  ArrowLeft, 
  RefreshCw, 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  BarChart3, 
  Database, 
  Terminal,
  Search,
  Sparkles,
  Radio
} from 'lucide-react';
import DatabaseExplorer from './DatabaseExplorer';
import StatsView from './StatsView';

function ChannelAvatar({ name, avatarUrl }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || '').slice(0, 2).toUpperCase();
  const charCode = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = (charCode * 37) % 360;

  if (failed || !avatarUrl) {
    return (
      <div 
        className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
        style={{
          background: `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${hue},75%,30%))`
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      referrerPolicy="no-referrer"
      className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0 shadow-sm bg-slate-900"
      onError={() => setFailed(true)}
    />
  );
}

export default function AdminView({ onBackToGame, onPlayVideo }) {
  const [adminTab, setAdminTab] = useState('channels'); // 'channels' | 'database' | 'stats'
  const [channels, setChannels] = useState([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [status, setStatus] = useState({
    isHarvesting: false,
    currentChannel: null,
    currentIndex: 0,
    totalChannels: 0,
    addedThisSession: 0,
    logs: [],
    lastHarvestTime: null,
    lastBatchAdded: '0'
  });

  // Add channel form
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [channelError, setChannelError] = useState('');

  // Harvest controls
  const [harvestBatchSize, setHarvestBatchSize] = useState('5');
  const [isTriggering, setIsTriggering] = useState(false);

  // Channels filter
  const [channelSearch, setChannelSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all'); // 'all' | 'incomplete' | 'complete'

  // Danger zone
  const [isWiping, setIsWiping] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  const logsContainerRef = useRef(null);

  // Fetch admin channels list
  const fetchAdminChannels = async () => {
    try {
      const res = await fetch('/api/admin/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
        setTotalVideos(data.totalVideos || 0);
      }
    } catch (err) {
      console.error('Error fetching admin channels:', err);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  // Fetch harvest status
  const fetchHarvestStatus = async () => {
    try {
      const res = await fetch('/api/admin/harvest/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.totalVideosInDb !== undefined) {
          setTotalVideos(data.totalVideosInDb);
        }
      }
    } catch (err) {
      console.error('Error fetching harvest status:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAdminChannels();
    fetchHarvestStatus();
  }, []);

  // Polling loop when harvesting or periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHarvestStatus();
      if (status.isHarvesting) {
        fetchAdminChannels();
      }
    }, status.isHarvesting ? 1200 : 5000);

    return () => clearInterval(interval);
  }, [status.isHarvesting]);

  // Auto-scroll inside logs box only (without scrolling the page/window)
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [status.logs]);

  // Handle adding new channel
  const handleAddChannel = async (e) => {
    e.preventDefault();
    if (!newChannelUrl.trim()) return;
    setIsAddingChannel(true);
    setChannelError('');

    try {
      const res = await fetch('/api/admin/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newChannelUrl.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'ajout de la chaîne");
      }

      setNewChannelUrl('');
      await fetchAdminChannels();
    } catch (err) {
      setChannelError(err.message);
    } finally {
      setIsAddingChannel(false);
    }
  };

  // Handle deleting a channel
  const handleDeleteChannel = async (id, name) => {
    if (!window.confirm(`Supprimer la chaîne "${name}" et toutes ses cartes associées ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAdminChannels();
      }
    } catch (err) {
      console.error('Error deleting channel:', err);
    }
  };

  // Start batch harvest
  const handleStartHarvest = async (count = null, specificChannelId = null) => {
    if (status.isHarvesting) return;
    setIsTriggering(true);

    try {
      const res = await fetch('/api/admin/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelCount: specificChannelId ? null : (count !== null ? count : (harvestBatchSize === 'all' ? null : parseInt(harvestBatchSize, 10))),
          channelId: specificChannelId || null
        })
      });

      if (res.ok) {
        fetchHarvestStatus();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors du lancement');
      }
    } catch (err) {
      console.error('Harvest start error:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  // Stop harvester
  const handleStopHarvest = async () => {
    try {
      await fetch('/api/admin/harvest/stop', { method: 'POST' });
      fetchHarvestStatus();
    } catch (err) {
      console.error('Harvest stop error:', err);
    }
  };

  // Wipe all videos
  const handleWipeVideos = async () => {
    setIsWiping(true);
    try {
      const res = await fetch('/api/admin/reset-videos', { method: 'POST' });
      if (res.ok) {
        setShowWipeConfirm(false);
        await fetchAdminChannels();
        await fetchHarvestStatus();
        alert('Base de données des vidéos réinitialisée avec succès !');
      }
    } catch (err) {
      console.error('Wipe error:', err);
    } finally {
      setIsWiping(false);
    }
  };

  // Filtered channels
  const filteredChannels = channels.filter((ch) => {
    const matchesSearch = 
      ch.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
      (ch.handle && ch.handle.toLowerCase().includes(channelSearch.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (channelFilter === 'incomplete') return (ch.video_count || 0) < 30;
    if (channelFilter === 'complete') return (ch.video_count || 0) >= 30;
    return true;
  });

  const incompleteCount = channels.filter(c => (c.video_count || 0) < 30).length;
  const completeCount = channels.filter(c => (c.video_count || 0) >= 30).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-['Outfit']">
      
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 bg-[#090f1e]/95 backdrop-blur-md border-b-2 border-amber-500/30 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToGame}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 shadow cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Retour au Jeu</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                ⚙️
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  Console d'Administration
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    SuperAdmin
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Gestion du Harvester YouTube, des Chaînes & de la Base de Données</p>
              </div>
            </div>
          </div>

          {/* Quick status badges */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
              <Radio className={`w-3.5 h-3.5 ${status.isHarvesting ? 'text-green-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Harvester :</span>
              <span className={`font-bold ${status.isHarvesting ? 'text-green-400' : 'text-slate-400'}`}>
                {status.isHarvesting ? 'En cours...' : 'Inactif'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
              <span className="text-amber-400 font-bold">{channels.length}</span>
              <span>chaînes</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
              <span className="text-amber-400 font-bold">{totalVideos}</span>
              <span>vidéos en DB</span>
            </div>
          </div>

        </div>
      </header>

      {/* ── Sub-navigation ── */}
      <div className="border-b border-slate-800 bg-[#0a1122]">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2">
          <button
            onClick={() => setAdminTab('channels')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              adminTab === 'channels'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Harvester & Chaînes ({channels.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('database')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              adminTab === 'database'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Index des Cartes ({totalVideos})</span>
          </button>

          <button
            onClick={() => setAdminTab('stats')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              adminTab === 'stats'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistiques Globales</span>
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: Harvester & Channels
        ───────────────────────────────────────────────────────────── */}
        {adminTab === 'channels' && (
          <div className="space-y-6">

            {/* ── Top Dashboard Section: Harvester Control & Logs ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Harvester Control Panel */}
              <div className="lg:col-span-5 rounded-2xl bg-[#0c1427] border-2 border-slate-800 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Radio className={`w-4 h-4 ${status.isHarvesting ? 'text-green-400 animate-pulse' : 'text-amber-400'}`} />
                    Contrôle du Harvester (Top 30 / Chaîne)
                  </h2>
                  <button 
                    onClick={() => { fetchHarvestStatus(); fetchAdminChannels(); }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Actualiser"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status card */}
                <div className={`p-4 rounded-xl border ${
                  status.isHarvesting 
                    ? 'bg-green-950/20 border-green-500/40 text-green-300' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${status.isHarvesting ? 'bg-green-400 animate-ping' : 'bg-slate-500'}`} />
                      {status.isHarvesting ? 'Collecte active' : 'Prêt à collecter'}
                    </span>
                    {status.currentChannel && (
                      <span className="font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800">
                        Chaîne : {status.currentChannel}
                      </span>
                    )}
                  </div>

                  {status.isHarvesting && (
                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between text-[11px] font-mono text-slate-300">
                        <span>Progression : {status.currentIndex} / {status.totalChannels} chaînes</span>
                        <span>+{status.addedThisSession} vidéos ajoutées</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-green-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.round((status.currentIndex / Math.max(1, status.totalChannels)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!status.isHarvesting && (
                    <p className="text-xs text-slate-400 mt-1">
                      Le harvester parcourt les chaînes YouTube et récupère jusqu'à <strong>30 vidéos les plus vues</strong> par chaîne (sans dépasser 30).
                    </p>
                  )}
                </div>

                {/* Batch Trigger Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Nombre de chaînes à collecter :
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['1', '5', '10', 'all'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setHarvestBatchSize(val)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          harvestBatchSize === val
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {val === 'all' ? 'Toutes' : `${val} ch.`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start / Stop Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {!status.isHarvesting ? (
                    <button
                      onClick={() => handleStartHarvest()}
                      disabled={isTriggering || incompleteCount === 0}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Lancer la Collecte ({harvestBatchSize === 'all' ? incompleteCount : Math.min(incompleteCount, parseInt(harvestBatchSize, 10))} ch.)</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopHarvest}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Arrêter la Collecte</span>
                    </button>
                  )}
                </div>

                {/* Incomplete / Complete count overview */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Chaînes complètes (30/30) : <strong className="text-green-400">{completeCount}</strong></span>
                  <span>Incomplètes (&lt;30) : <strong className="text-amber-400">{incompleteCount}</strong></span>
                </div>

                {/* Danger Zone: Wipe Database */}
                <div className="pt-3 border-t border-slate-800">
                  {!showWipeConfirm ? (
                    <button
                      onClick={() => setShowWipeConfirm(true)}
                      className="w-full py-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 text-red-400 hover:text-red-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      ⚠️ Vider la base des vidéos (Purge)
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-600 space-y-2">
                      <p className="text-xs text-red-200 font-bold">
                        Êtes-vous sûr ? Cela supprimera TOUTES les vidéos de la base ({totalVideos} vidéos). Les chaînes seront conservées.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleWipeVideos}
                          disabled={isWiping}
                          className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase transition-all cursor-pointer"
                        >
                          {isWiping ? 'Suppression...' : 'Confirmer la Purge'}
                        </button>
                        <button
                          onClick={() => setShowWipeConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Harvester Terminal Logs */}
              <div className="lg:col-span-7 rounded-2xl bg-[#090e1c] border-2 border-slate-800 flex flex-col shadow-xl overflow-hidden min-h-[300px] lg:min-h-[420px]">
                <div className="px-4 py-3 bg-[#0c1427] border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>Console du Harvester</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {status.logs.length} entrées • Logs en direct
                  </span>
                </div>

                <div 
                  ref={logsContainerRef}
                  className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 max-h-[360px]"
                >
                  {status.logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-center py-12">
                      En attente du lancement d'une collecte...
                    </div>
                  ) : (
                    status.logs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={`leading-relaxed ${
                          log.includes('Erreur') || log.includes('⚠️') ? 'text-amber-400 font-bold' :
                          log.includes('✅') || log.includes('terminé') ? 'text-green-400 font-bold' :
                          log.includes('🛑') ? 'text-red-400 font-bold' :
                          log.includes('🚀') ? 'text-cyan-400 font-bold' :
                          'text-slate-300'
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* ── Add YouTube Channel Form ── */}
            <div className="rounded-2xl bg-[#0c1427] border-2 border-slate-800 p-5 shadow-xl">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-1">
                <Plus className="w-4 h-4 text-amber-400" />
                Ajouter une nouvelle chaîne YouTube
              </h2>
              <p className="text-xs text-slate-500 mb-3">Colle l'URL de la chaîne YouTube — le nom, l'avatar et le handle sont récupérés automatiquement.</p>
              <form onSubmit={handleAddChannel} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-10">
                  <input
                    type="url"
                    value={newChannelUrl}
                    onChange={(e) => setNewChannelUrl(e.target.value)}
                    placeholder="https://www.youtube.com/@NomDeLaChaine"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isAddingChannel || !newChannelUrl.trim()}
                    className="w-full h-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all disabled:opacity-50 cursor-pointer shadow"
                  >
                    {isAddingChannel ? 'Résolution...' : 'Ajouter'}
                  </button>
                </div>
              </form>
              {channelError && (
                <p className="text-xs text-red-400 font-bold mt-2">{channelError}</p>
              )}
            </div>

            {/* ── Channels List Section ── */}
            <div className="rounded-2xl bg-[#0c1427] border-2 border-slate-800 p-5 shadow-xl space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Chaînes YouTube Référencées ({filteredChannels.length} / {channels.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Chaque chaîne est plafonnée à un maximum de 30 vidéos en base.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search filter */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={channelSearch}
                      onChange={(e) => setChannelSearch(e.target.value)}
                      placeholder="Filtrer par nom..."
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono w-44 sm:w-56"
                    />
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setChannelFilter('all')}
                      className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        channelFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Toutes ({channels.length})
                    </button>
                    <button
                      onClick={() => setChannelFilter('incomplete')}
                      className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        channelFilter === 'incomplete' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Incomplètes ({incompleteCount})
                    </button>
                    <button
                      onClick={() => setChannelFilter('complete')}
                      className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        channelFilter === 'complete' ? 'bg-green-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      30/30 ({completeCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Channels Grid / Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredChannels.map((ch) => {
                  const videoCount = ch.video_count || 0;
                  const isFull = videoCount >= 30;
                  const percent = Math.min(100, Math.round((videoCount / 30) * 100));

                  return (
                    <div 
                      key={ch.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                        isFull 
                          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' 
                          : 'bg-[#0e172e] border-slate-800 hover:border-amber-500/40 shadow'
                      }`}
                    >
                      {/* Top: Avatar & Name */}
                      <div className="flex items-start gap-3">
                        <ChannelAvatar name={ch.name} avatarUrl={ch.avatar_url} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-black text-white truncate" title={ch.name}>
                              {ch.name}
                            </h3>
                            {ch.channel_url && (
                              <a
                                href={ch.channel_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-amber-400 transition-colors"
                                title="Voir sur YouTube"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {ch.handle && (
                            <p className="text-[10px] font-mono text-slate-400 truncate">{ch.handle}</p>
                          )}
                        </div>
                      </div>

                      {/* Middle: Video Count Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400">Vidéos en base :</span>
                          <span className={`font-bold ${isFull ? 'text-green-400' : videoCount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {videoCount} / 30
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${isFull ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom: Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => handleStartHarvest(null, ch.id)}
                          disabled={status.isHarvesting || isFull}
                          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>{isFull ? 'Complet (30/30)' : 'Collecter (Top 30)'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteChannel(ch.id, ch.name)}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Supprimer la chaîne et ses vidéos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {filteredChannels.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Aucune chaîne trouvée correspondant au filtre "{channelSearch}".
                </div>
              )}

            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: Index des Cartes (DatabaseExplorer)
        ───────────────────────────────────────────────────────────── */}
        {adminTab === 'database' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0c1427] border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase text-amber-400">Catalogue National des Cartes</h2>
                <p className="text-xs text-slate-400">Explorez l'intégralité des cartes réelles en base de données, filtrez par étoiles et par créateur.</p>
              </div>
              <div className="font-mono text-xs text-slate-300 font-bold">
                Total : {totalVideos} cartes
              </div>
            </div>

            <DatabaseExplorer onPlayVideo={onPlayVideo} />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: Statistiques Globales (StatsView)
        ───────────────────────────────────────────────────────────── */}
        {adminTab === 'stats' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0c1427] border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase text-amber-400">Observatoire Statistique</h2>
                <p className="text-xs text-slate-400">Métriques de répartition, classements des créateurs et des vidéos les plus vues.</p>
              </div>
            </div>

            <StatsView onPlayVideo={onPlayVideo} />
          </div>
        )}

      </main>

    </div>
  );
}

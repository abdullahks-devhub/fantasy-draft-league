import { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, CheckCircle, Archive, Play } from 'lucide-react';
import { api } from '../../lib/api';

interface SeasonManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

type Mode = 'menu' | 'archive' | 'new';

export default function SeasonManagerModal({ isOpen, onClose, onSuccess }: SeasonManagerModalProps) {
  const [mode, setMode] = useState<Mode>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState('');
  const [honorLocks, setHonorLocks] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      setMode('menu');
      setError(null);
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [activeRes] = await Promise.all([
        api.get('/seasons/active').catch(() => null),
        Promise.resolve(null), // placeholder — users derived from activeRes
      ]);
      setActiveSeason(activeRes?.data?.season || null);
      const users = activeRes?.data?.players?.map((p: any) => p.user) || [];
      setAllUsers(users);
      setSelectedUserIds(users.map((u: any) => u.id));
    } catch (e) {
      console.error('Failed to load season data');
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/seasons/archive');
      onSuccess(res.data.message);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Archive failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSeason = async () => {
    if (!newSeasonName || !newSeasonStartDate || selectedUserIds.length === 0) {
      setError('Fill in all fields and select at least one player.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/seasons/new', {
        name: newSeasonName,
        startDate: newSeasonStartDate,
        userIds: selectedUserIds,
        honorLockedRosters: honorLocks
      });
      onSuccess(`Season "${res.data.season.name}" started!`);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create season');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-violet-400" />
            Season Manager
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto">✕</button>
            </div>
          )}

          {mode === 'menu' && (
            <div className="space-y-3">
              {activeSeason && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
                  <p className="text-emerald-400 font-bold text-sm">Active Season</p>
                  <p className="text-white font-black text-lg mt-0.5">{activeSeason.name}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Started: {new Date(activeSeason.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <button
                onClick={() => setMode('archive')}
                disabled={!activeSeason}
                className="w-full p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Archive className="w-5 h-5" />
                  <div>
                    <p className="font-bold">Archive Current Season</p>
                    <p className="text-xs opacity-70 mt-0.5">Mark season as completed. Players can lock 5 wrestlers.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('new')}
                className="w-full p-4 rounded-xl border border-violet-500/20 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5" />
                  <div>
                    <p className="font-bold">Start New Season</p>
                    <p className="text-xs opacity-70 mt-0.5">Create a fresh season with carry-over rosters.</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {mode === 'archive' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                This will mark <span className="text-white font-bold">{activeSeason?.name}</span> as 
                <span className="text-amber-400 font-bold"> COMPLETED</span>. Players will then be able to lock their 5 wrestlers for the next draft.
              </p>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs">
                ⚠️ This action cannot be undone. Make sure all scores are finalized.
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setMode('menu')} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-bold">
                  Back
                </button>
                <button
                  onClick={handleArchive}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  Archive Season
                </button>
              </div>
            </div>
          )}

          {mode === 'new' && (
            <div className="space-y-4">
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                placeholder="Season name (e.g. Season 5)"
                value={newSeasonName}
                onChange={e => setNewSeasonName(e.target.value)}
              />
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Season Start Date</label>
                <input
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  value={newSeasonStartDate}
                  onChange={e => setNewSeasonStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Players to Enroll</label>
                <div className="grid grid-cols-2 gap-2">
                  {allUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`p-2 rounded-lg border text-sm text-left transition-all ${
                        selectedUserIds.includes(u.id)
                          ? 'bg-violet-500/20 border-violet-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                    >
                      <CheckCircle className={`w-3 h-3 inline mr-1 ${selectedUserIds.includes(u.id) ? 'text-violet-400' : 'opacity-0'}`} />
                      {u.email.split('@')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={honorLocks}
                  onChange={e => setHonorLocks(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-500"
                />
                <span className="text-sm text-gray-300">Honor locked rosters from previous season</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setMode('menu')} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-bold">
                  Back
                </button>
                <button
                  onClick={handleNewSeason}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Start Season
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { X, Users, Split, Check, Loader2, AlertCircle } from 'lucide-react';

interface UnitManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function UnitManagerModal({ isOpen, onClose, onSuccess }: UnitManagerModalProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [roster, setRoster] = useState<any[]>([]);
  const [selectedWrestlerIds, setSelectedWrestlerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPlayerId) {
      fetchRoster(selectedPlayerId);
      setSelectedWrestlerIds([]);
    }
  }, [selectedPlayerId]);

  const fetchPlayers = async () => {
    try {
      const res = await api.get('/seasons/active');
      setPlayers(res.data.players || []);
    } catch (e) {
      console.error('Failed to fetch players');
    }
  };

  const fetchRoster = async (playerId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/rosters/${playerId}`);
      setRoster(res.data.roster || []);
    } catch (e) {
      setError('Failed to load roster');
    } finally {
      setLoading(false);
    }
  };

  const toggleWrestlerSelection = (id: string) => {
    setSelectedWrestlerIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMerge = async () => {
    if (selectedWrestlerIds.length < 2) {
      setError('Select at least 2 wrestlers to merge.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/merge-units', {
        playerSeasonId: selectedPlayerId,
        wrestlerIds: selectedWrestlerIds
      });
      onSuccess(`Successfully merged ${selectedWrestlerIds.length} wrestlers into a unit.`);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Merge failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSplit = async (slotId: string) => {
    setLoading(true);
    try {
      await api.post('/admin/split-units', { rosterSlotId: slotId });
      onSuccess('Unit split into individual wrestlers.');
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Split failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              Manage Roster Units
            </h2>
            <p className="text-gray-400 text-sm">Combine wrestlers into tag teams/stables or split them.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto">✕</button>
            </div>
          )}

          {/* Player Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Player</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    selectedPlayerId === p.id
                      ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {p.user?.email.split('@')[0]}
                </button>
              ))}
            </div>
          </div>

          {selectedPlayerId && (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
              {/* Combine Section */}
              <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-800">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Combine into Unit
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {roster.map(slot => {
                     // Only show singles for combining
                     if (slot.wrestlers.length > 1) return null;
                     const w = slot.wrestlers[0];
                     if (!w) return null;
                     const isSelected = selectedWrestlerIds.includes(w.id);
                     return (
                       <button
                         key={w.id}
                         onClick={() => toggleWrestlerSelection(w.id)}
                         className={`p-3 rounded-xl border text-sm flex items-center justify-between transition-all ${
                           isSelected
                             ? 'bg-emerald-500/20 border-emerald-500 text-white'
                             : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                         }`}
                       >
                         <span className="truncate">{w.name}</span>
                         {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                       </button>
                     );
                  })}
                </div>
                <button
                  disabled={selectedWrestlerIds.length < 2 || loading}
                  onClick={handleMerge}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                  Merge into Tag Team/Unit
                </button>
              </div>

              {/* Split Section */}
              <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-800">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
                  <Split className="w-4 h-4 text-amber-400" />
                  Split Units
                </h3>
                <div className="space-y-2">
                  {roster.some(s => s.wrestlers.length > 1) ? (
                    roster.filter(s => s.wrestlers.length > 1).map(slot => (
                      <div key={slot.id} className="p-3 bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {slot.wrestlers.map((w: any) => w.name).join(' & ')}
                          </span>
                          <span className="text-xs text-gray-500">{slot.wrestlers.length} members</span>
                        </div>
                        <button
                          onClick={() => handleSplit(slot.id)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold transition-all"
                        >
                          Split
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-sm text-gray-600 italic">No multi-wrestler units on this roster.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

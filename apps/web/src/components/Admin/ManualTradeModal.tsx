import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Loader2, Check } from 'lucide-react';
import { useStandings } from '../../hooks/useStandings';
import { useRoster } from '../../hooks/useRoster';
import { api } from '../../lib/api';

interface ManualTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function ManualTradeModal({ isOpen, onClose, onSuccess }: ManualTradeModalProps) {
  const { data: players } = useStandings();
  
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');
  
  const { data: rosterA, isLoading: loadingA } = useRoster(playerAId);
  const { data: rosterB, isLoading: loadingB } = useRoster(playerBId);

  const [selectedA, setSelectedA] = useState<string[]>([]);
  const [selectedB, setSelectedB] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedA([]);
  }, [playerAId]);

  useEffect(() => {
    setSelectedB([]);
  }, [playerBId]);

  if (!isOpen) return null;

  const toggleSelect = (id: string, side: 'A' | 'B') => {
    const list = side === 'A' ? selectedA : selectedB;
    const setter = side === 'A' ? setSelectedA : setSelectedB;
    
    if (list.includes(id)) {
      setter(list.filter(item => item !== id));
    } else {
      setter([...list, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerAId || !playerBId || (selectedA.length === 0 && selectedB.length === 0)) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/admin/execute-trade', {
        fromPlayerSeasonId: playerAId,
        toPlayerSeasonId: playerBId,
        wrestlerIdsOut: selectedA,
        wrestlerIdsIn: selectedB
      });
      onSuccess(`Successfully executed trade.`);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to execute trade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden scale-in-center max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            Manual Trade Execution
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Player A Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Player A (Initiator)</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                  value={playerAId}
                  onChange={(e) => setPlayerAId(e.target.value)}
                  required
                >
                  <option value="">Select a player...</option>
                  {players?.map(p => (
                    <option key={p.playerSeasonId} value={p.playerSeasonId} disabled={p.playerSeasonId === playerBId} className="capitalize">{p.name}</option>
                  ))}
                </select>
              </div>

              {playerAId && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Sending Away:</p>
                  <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden min-h-[120px]">
                    {loadingA ? (
                      <div className="p-8 flex justify-center text-gray-600"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    ) : rosterA?.length === 0 ? (
                      <div className="p-8 text-center text-gray-600 text-sm">Empty Roster</div>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {rosterA?.map(slot => (
                          <div 
                            key={slot.wrestler.id}
                            onClick={() => toggleSelect(slot.wrestler.id, 'A')}
                            className={`p-3 text-sm flex justify-between items-center cursor-pointer transition-colors ${
                              selectedA.includes(slot.wrestler.id) ? 'bg-indigo-500/10' : 'hover:bg-gray-800/40'
                            }`}
                          >
                            <span className={selectedA.includes(slot.wrestler.id) ? 'text-indigo-300 font-bold' : 'text-gray-400'}>
                              {slot.wrestler.name}
                            </span>
                            {selectedA.includes(slot.wrestler.id) && <Check className="w-4 h-4 text-indigo-400" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Player B Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Player B (Counterparty)</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                  value={playerBId}
                  onChange={(e) => setPlayerBId(e.target.value)}
                  required
                >
                  <option value="">Select a player...</option>
                  {players?.map(p => (
                    <option key={p.playerSeasonId} value={p.playerSeasonId} disabled={p.playerSeasonId === playerAId} className="capitalize">{p.name}</option>
                  ))}
                </select>
              </div>

              {playerBId && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Sending Away:</p>
                  <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden min-h-[120px]">
                    {loadingB ? (
                      <div className="p-8 flex justify-center text-gray-600"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    ) : rosterB?.length === 0 ? (
                      <div className="p-8 text-center text-gray-600 text-sm">Empty Roster</div>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {rosterB?.map(slot => (
                          <div 
                            key={slot.wrestler.id}
                            onClick={() => toggleSelect(slot.wrestler.id, 'B')}
                            className={`p-3 text-sm flex justify-between items-center cursor-pointer transition-colors ${
                              selectedB.includes(slot.wrestler.id) ? 'bg-indigo-500/10' : 'hover:bg-gray-800/40'
                            }`}
                          >
                            <span className={selectedB.includes(slot.wrestler.id) ? 'text-indigo-300 font-bold' : 'text-gray-400'}>
                              {slot.wrestler.name}
                            </span>
                            {selectedB.includes(slot.wrestler.id) && <Check className="w-4 h-4 text-indigo-400" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-between items-center gap-4">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            {selectedA.length} OUT <span className="mx-2">⇄</span> {selectedB.length} IN
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !playerAId || !playerBId || (selectedA.length === 0 && selectedB.length === 0)}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Execute Trade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

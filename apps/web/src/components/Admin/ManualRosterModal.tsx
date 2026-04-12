import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useStandings } from '../../hooks/useStandings';
import { useWrestlers } from '../../hooks/useWrestlers';
import { api } from '../../lib/api';

interface ManualRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function ManualRosterModal({ isOpen, onClose, onSuccess }: ManualRosterModalProps) {
  const { data: players } = useStandings();
  const { data: allWrestlers } = useWrestlers();

  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedWrestlerId, setSelectedWrestlerId] = useState('');
  const [action, setAction] = useState<'ADD' | 'DROP'>('ADD');
  const [playerRoster, setPlayerRoster] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When player or action changes, refresh their roster for the DROP list
  useEffect(() => {
    if (selectedPlayerId && action === 'DROP') {
      api.get(`/rosters/${selectedPlayerId}`)
        .then(res => setPlayerRoster(res.data.roster || []))
        .catch(() => setPlayerRoster([]));
    } else {
      setPlayerRoster([]);
    }
    setSelectedWrestlerId('');
  }, [selectedPlayerId, action]);

  if (!isOpen) return null;

  // Flatten roster slots into wrestlers for the drop list
  const rosterWrestlers = playerRoster.flatMap((slot: any) =>
    slot.wrestlers.map((w: any) => ({ ...w, slotStatus: slot.status }))
  );

  const wrestlerOptions = action === 'DROP' ? rosterWrestlers : (allWrestlers || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !selectedWrestlerId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/admin/force-roster-move', {
        playerSeasonId: selectedPlayerId,
        wrestlerId: selectedWrestlerId,
        action
      });
      onSuccess(`Successfully ${action === 'ADD' ? 'added to' : 'removed from'} roster.`);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update roster.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {action === 'ADD' ? <UserPlus className="w-5 h-5 text-emerald-400" /> : <UserMinus className="w-5 h-5 text-red-400" />}
            Manual Roster Move
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Player</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                required
              >
                <option value="">Choose a player...</option>
                {players?.map(p => (
                  <option key={p.playerSeasonId} value={p.playerSeasonId} className="capitalize">{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Move Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAction('ADD')}
                  className={`py-2 rounded-lg border text-sm font-bold transition-all ${
                    action === 'ADD' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  Force Add
                </button>
                <button
                  type="button"
                  onClick={() => setAction('DROP')}
                  className={`py-2 rounded-lg border text-sm font-bold transition-all ${
                    action === 'DROP' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  Force Drop
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {action === 'DROP' ? `Select from ${players?.find(p => p.playerSeasonId === selectedPlayerId)?.name || 'Player'}'s Roster` : 'Select Wrestler (Free Agent)'}
              </label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                value={selectedWrestlerId}
                onChange={(e) => setSelectedWrestlerId(e.target.value)}
                required
              >
                <option value="">
                  {action === 'DROP' && !selectedPlayerId
                    ? 'Select a player first...'
                    : 'Choose a wrestler...'}
                </option>
                {wrestlerOptions.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                    {action === 'DROP' && w.slotStatus ? ` [${w.slotStatus}]` : ` (${w.promotion || w.currentTeam || 'Free Agent'})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedPlayerId || !selectedWrestlerId}
              className={`flex-1 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                action === 'ADD'
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                  : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20'
              } text-white disabled:opacity-50`}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Move'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

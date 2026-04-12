import { useState, useEffect } from 'react';
import { X, Users, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

interface RosterStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE:  { label: 'ACTIVE',  color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  BENCH:   { label: 'BENCH',   color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  IR:      { label: 'IR',      color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function RosterStatusModal({ isOpen, onClose, onSuccess }: RosterStatusModalProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchPlayers();
    else { setSelectedPlayerId(''); setRoster([]); setError(null); }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPlayerId) fetchRoster(selectedPlayerId);
  }, [selectedPlayerId]);

  const fetchPlayers = async () => {
    try {
      const res = await api.get('/seasons/active');
      setPlayers(res.data.players || []);
    } catch { setError('Failed to load players'); }
  };

  const fetchRoster = async (psId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/rosters/${psId}`);
      setRoster(res.data.roster || []);
    } catch { setError('Failed to load roster'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (slotId: string, newStatus: 'ACTIVE' | 'BENCH' | 'IR') => {
    setSaving(slotId);
    setError(null);
    try {
      await api.patch(`/rosters/${slotId}/status`, { status: newStatus });
      await fetchRoster(selectedPlayerId);
      onSuccess(`Moved to ${newStatus}.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally { setSaving(null); }
  };

  if (!isOpen) return null;

  const activePlayers = roster.filter(s => s.status === 'ACTIVE');
  const benchPlayers  = roster.filter(s => s.status === 'BENCH');
  const irPlayers     = roster.filter(s => s.status === 'IR');

  const RosterSection = ({ slots, status }: { slots: any[]; status: string }) => (
    <div className="space-y-1.5">
      {slots.map(slot => (
        <div key={slot.id} className="flex items-center justify-between gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div>
            <span className="text-white font-medium text-sm">
              {slot.wrestlers.map((w: any) => w.name).join(' & ')}
            </span>
            <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border ${STATUS_LABELS[status]?.color}`}>
              {STATUS_LABELS[status]?.label}
            </span>
          </div>
          <div className="flex gap-1.5">
            {(['ACTIVE', 'BENCH', 'IR'] as const).filter(s => s !== status).map(targetStatus => (
              <button
                key={targetStatus}
                disabled={saving === slot.id}
                onClick={() => handleStatusChange(slot.id, targetStatus)}
                className={`text-[11px] px-2 py-1 rounded-lg border font-bold transition-all flex items-center gap-1 ${STATUS_LABELS[targetStatus].color} hover:opacity-80`}
              >
                {saving === slot.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                  <><ArrowRight className="w-3 h-3" />{targetStatus}</>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Roster Status Manager
            </h2>
            <p className="text-gray-400 text-sm">Move wrestlers between Active (max 10), Bench, and IR.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto">✕</button>
            </div>
          )}

          {/* Player selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Player</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    selectedPlayerId === p.id
                      ? 'bg-purple-500/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {p.user?.email.split('@')[0]}
                </button>
              ))}
            </div>
          </div>

          {selectedPlayerId && (
            <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`font-bold ${activePlayers.length >= 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {activePlayers.length}/10
                </span>
                active slots used
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-gray-600" /></div>
              ) : (
                <>
                  {activePlayers.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Active ({activePlayers.length})</h3>
                      <RosterSection slots={activePlayers} status="ACTIVE" />
                    </div>
                  )}
                  {benchPlayers.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Bench ({benchPlayers.length})</h3>
                      <RosterSection slots={benchPlayers} status="BENCH" />
                    </div>
                  )}
                  {irPlayers.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Injured Reserve ({irPlayers.length})</h3>
                      <RosterSection slots={irPlayers} status="IR" />
                    </div>
                  )}
                  {roster.length === 0 && (
                    <p className="text-center text-gray-600 py-8 italic text-sm">No wrestlers on this roster.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

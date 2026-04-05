import { useState } from 'react';
import { X, Loader2, CheckCircle2, UserPlus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useStandings } from '../../hooks/useStandings';
import { useWrestlers } from '../../hooks/useWrestlers';

interface DraftEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function DraftEntryModal({ isOpen, onClose, onSuccess }: DraftEntryModalProps) {
  const { data: standings } = useStandings();
  const { data: allWrestlers } = useWrestlers();
  const [assignments, setAssignments] = useState<{ playerSeasonId: string; wrestlerId: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setAssignments([...assignments, { playerSeasonId: '', wrestlerId: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleUpdateAssignment = (index: number, field: 'playerSeasonId' | 'wrestlerId', value: string) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;
    setAssignments(newAssignments);
  };

  const handleSubmit = async () => {
    if (assignments.some(a => !a.playerSeasonId || !a.wrestlerId)) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.post('/admin/draft', { assignments });
      onSuccess(`Successfully added ${assignments.length} draft picks.`);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Draft entry failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0d1117] border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/30">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-indigo-400" />
              Bulk Draft Entry
            </h2>
            <p className="text-gray-400 text-sm mt-1">Assign multiple wrestlers to teams in one go.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <Loader2 className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            {assignments.map((assignment, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-3 items-end p-4 bg-gray-800/20 border border-gray-800 rounded-xl animate-in slide-in-from-left-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Player Team</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                    value={assignment.playerSeasonId}
                    onChange={(e) => handleUpdateAssignment(index, 'playerSeasonId', e.target.value)}
                  >
                    <option value="">Select Team...</option>
                    {standings?.map(s => (
                      <option key={s.playerSeasonId} value={s.playerSeasonId}>{s.name} (Rank #{s.rank})</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Draft Selection</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                    value={assignment.wrestlerId}
                    onChange={(e) => handleUpdateAssignment(index, 'wrestlerId', e.target.value)}
                  >
                    <option value="">Select Wrestler...</option>
                    {allWrestlers?.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.currentTeam || 'Free Agent'})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleRemoveRow(index)}
                  className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddRow}
            className="w-full py-3 border-2 border-dashed border-gray-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl text-gray-500 hover:text-indigo-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Another Pick
          </button>
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-900/30 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-400 hover:text-white font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isLoading || assignments.length === 0}
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl text-white font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Execute Draft
          </button>
        </div>
      </div>
    </div>
  );
}

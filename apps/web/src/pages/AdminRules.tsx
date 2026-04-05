import { useState } from 'react';
import { Settings, Save, Loader2, Plus, Info, Swords, X, CheckCircle2 } from 'lucide-react';
import { useRules, useUpdateRule, useCreateRule } from '../hooks/useRules';
import type { PointRule } from '../hooks/useRules';

export default function AdminRules() {
  const { data: rules, isLoading } = useRules();
  const updateRule = useUpdateRule();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (id: string, currentPoints: number) => {
    setEditingId(id);
    setEditValue(currentPoints);
  };

  const handleSave = async (id: string) => {
    try {
      await updateRule.mutateAsync({ id, points: editValue });
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
      <div className="border-b border-gray-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent inline-flex items-center gap-3">
            <Settings className="w-8 h-8 text-amber-500" />
            Scoring Rules
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Define point values for match outcomes, show types, and special event statuses.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 overflow-hidden backdrop-blur-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-700/50">
                  <th className="p-4 text-sm font-semibold text-gray-400">Context</th>
                  <th className="p-4 text-sm font-semibold text-gray-400">Attributes</th>
                  <th className="p-4 text-sm font-semibold text-gray-400">Result</th>
                  <th className="p-4 text-sm font-semibold text-gray-400 text-right">Points</th>
                  <th className="p-4 text-sm font-semibold text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="p-4 h-12 bg-gray-800/10" />
                    </tr>
                  ))
                ) : rules?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      No rules defined for this season yet.
                    </td>
                  </tr>
                ) : (
                  rules?.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-sm">
                            {rule.showType || 'Any Show'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {rule.matchType || (rule.isMainEvent ? 'Main Event' : 'General Match')}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {rule.isMainEvent && <Badge text="ME" color="indigo" />}
                          {rule.isTitleMatch && <Badge text="Title" color="amber" />}
                          {rule.isWorldTitle && <Badge text="World" color="red" />}
                          {rule.isDefense && <Badge text="Defense" color="emerald" />}
                          {rule.isFinals && <Badge text="Finals" color="purple" />}
                          {!rule.isMainEvent && !rule.isTitleMatch && !rule.isFinals && (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {rule.result ? (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                            rule.result === 'WIN' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {rule.result}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">Appearance</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {editingId === rule.id ? (
                          <input
                            type="number"
                            className="w-16 bg-gray-800 border border-indigo-500/50 rounded px-2 py-1 text-right text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            autoFocus
                          />
                        ) : (
                          <span className="font-mono font-bold text-indigo-400">{rule.points} pts</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {editingId === rule.id ? (
                          <button
                            onClick={() => handleSave(rule.id)}
                            disabled={updateRule.isPending}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            {updateRule.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(rule.id, rule.points)}
                            className="p-1.5 text-gray-500 hover:text-white transition-colors"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-sm">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
              <Swords className="w-5 h-5 text-indigo-400" />
              Scoring Rule Logic
            </h3>
            <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
              <p>
                All matching rules for a participant are <span className="text-indigo-400 font-bold">stackable</span>.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><span className="text-emerald-400">Appearance</span>: Rule with no result (applies to any match outcome).</li>
                <li><span className="text-amber-400 font-bold">Finals</span>: Special flag for tournament finales (2.5x point target).</li>
                <li><span className="text-red-400 font-bold">World Title</span>: Major multiplier for top-tier belt wins/defenses.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <CreateRuleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${colors[color]}`}>
      {text}
    </span>
  );
}

function CreateRuleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createRule = useCreateRule();
  const [formData, setFormData] = useState<Partial<PointRule>>({
    showType: '',
    matchType: '',
    result: null,
    isMainEvent: false,
    isTournament: false,
    isFinals: false,
    isTitleMatch: false,
    isWorldTitle: false,
    isDefense: false,
    points: 0,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get the active season ID (omitted for brevity, should be fetched or from context)
      // For now, the API handles the active season if not provided
      await createRule.mutateAsync(formData);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Plus className="w-6 h-6 text-amber-500" />
            Add New Scoring Rule
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Show Type</label>
              <select 
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white"
                value={formData.showType || ''}
                onChange={e => setFormData({...formData, showType: e.target.value})}
              >
                <option value="">Any Show</option>
                <option value="TV">TV (Normal)</option>
                <option value="PPV">PPV</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Points</label>
              <input 
                type="number"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white"
                value={formData.points}
                onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <Checkbox label="Main Event" checked={!!formData.isMainEvent} onChange={val => setFormData({...formData, isMainEvent: val})} />
             <Checkbox label="Tournament" checked={!!formData.isTournament} onChange={val => setFormData({...formData, isTournament: val})} />
             <Checkbox label="Finals" checked={!!formData.isFinals} onChange={val => setFormData({...formData, isFinals: val})} />
             <Checkbox label="Title Match" checked={!!formData.isTitleMatch} onChange={val => setFormData({...formData, isTitleMatch: val})} />
             <Checkbox label="World Title" checked={!!formData.isWorldTitle} onChange={val => setFormData({...formData, isWorldTitle: val})} />
             <Checkbox label="Defense" checked={!!formData.isDefense} onChange={val => setFormData({...formData, isDefense: val})} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Required Result</label>
            <div className="flex gap-2">
              {['WIN', 'LOSS', 'DRAW', null].map(res => (
                <button
                  key={res || 'any'}
                  type="button"
                  onClick={() => setFormData({...formData, result: res as any})}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    formData.result === res 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'
                  }`}
                >
                  {res || 'Appearance'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-white transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createRule.isPending}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-black font-black text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2"
            >
              {createRule.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`px-3 py-2 rounded-lg border text-[10px] font-black uppercase transition-all ${
        checked 
          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' 
          : 'bg-gray-950 border-gray-800 text-gray-600 hover:border-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

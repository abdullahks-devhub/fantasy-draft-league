import { useState } from 'react';
import { Search, Flame, Users, AlertCircle, Loader2, PlusCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface FreeAgent {
  id: string;
  name: string;
  currentTeam: string | null;
  active: boolean;
  trendPoints?: number;
}

function useFreeAgents(seasonId?: string) {
  return useQuery({
    queryKey: ['freeAgents', seasonId],
    queryFn: async () => {
      const res = await api.get<{ freeAgents: FreeAgent[] }>('/analytics/free-agents', { params: { seasonId } });
      return res.data.freeAgents;
    }
  });
}

const PROMOTIONS = ['All', 'AEW', 'WWE', 'NXT', 'NJPW', 'ROH', 'STARDOM', 'AAA', 'NOAH'];

const PROMO_COLORS: Record<string, string> = {
  AEW:     'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
  NJPW:    'text-orange-400 border-orange-500/20 bg-orange-500/10',
  WWE:     'text-blue-400 border-blue-500/20 bg-blue-500/10',
  NXT:     'text-sky-400 border-sky-500/20 bg-sky-500/10',
  ROH:     'text-purple-400 border-purple-500/20 bg-purple-500/10',
  STARDOM: 'text-pink-400 border-pink-500/20 bg-pink-500/10',
  AAA:     'text-yellow-400 border-yellow-500/20 bg-yellow-500/10',
  NOAH:    'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
};

function AgentCard({ agent, onAdd, isAdding }: { agent: FreeAgent; onAdd: (id: string) => void; isAdding: boolean }) {
  const isHot = (agent.trendPoints ?? 0) > 20;
  const promoColor = PROMO_COLORS[agent.currentTeam ?? ''] ?? 'text-gray-400 border-gray-600/40 bg-gray-700/30';

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800/50 bg-gray-900/40 hover:bg-gray-800/40 hover:border-gray-700/60 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-black text-sm">
          {agent.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm group-hover:text-indigo-300 transition-colors">{agent.name}</span>
            {isHot && (
              <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                <Flame className="w-3 h-3" /> Hot
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {agent.currentTeam && (
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${promoColor}`}>
                {agent.currentTeam}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {agent.trendPoints ? `${agent.trendPoints} pts (4wk)` : 'No recent data'}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onAdd(agent.id)}
        disabled={isAdding}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
        aria-label={`Add ${agent.name} to waiver`}
      >
        {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
        Add to Waiver
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800/50 bg-gray-900/40">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-gray-800 animate-pulse" />
          <div className="h-3 w-20 rounded bg-gray-800 animate-pulse" />
        </div>
      </div>
      <div className="h-8 w-28 rounded-lg bg-gray-800 animate-pulse" />
    </div>
  );
}

export default function FreeAgents() {
  const [search, setSearch] = useState('');
  const [promoFilter, setPromoFilter] = useState('All');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: agents, isLoading, isError, refetch } = useFreeAgents();

  const handleAdd = async (wrestlerId: string) => {
    setAddingId(wrestlerId);
    try {
      await api.post('/waivers/submit', { wrestlerId, action: 'ADD', priority: 1, playerSeasonId: '' });
      const name = agents?.find(a => a.id === wrestlerId)?.name;
      setToast(`${name ?? 'Wrestler'} added to waiver queue!`);
      setTimeout(() => setToast(null), 3500);
    } catch {
      setToast('Failed to submit waiver request.');
      setTimeout(() => setToast(null), 3500);
    } finally {
      setAddingId(null);
    }
  };

  const filtered = (agents ?? []).filter(a => {
    const matchesPromo = promoFilter === 'All' || a.currentTeam === promoFilter;
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    return matchesPromo && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Free Agents</h1>
          <p className="text-gray-400 mt-2">Available wrestlers — claim via the waiver wire</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
          <Users className="w-4 h-4" />
          {isLoading ? '—' : `${filtered.length} available`}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <PlusCircle className="w-4 h-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            id="free-agent-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search wrestlers..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40"
          />
        </div>
        {/* Promotion pills */}
        <div className="flex gap-1.5 items-center flex-wrap">
          {PROMOTIONS.map(p => (
            <button
              key={p}
              onClick={() => setPromoFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                promoFilter === p
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">Failed to load free agents.</span>
          <button onClick={() => refetch()} className="ml-auto text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 font-bold transition-colors">Retry</button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-base">No free agents match your filters.</p>
            </div>
          )
          : filtered.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onAdd={handleAdd}
                isAdding={addingId === agent.id}
              />
            ))
        }
      </div>
    </div>
  );
}

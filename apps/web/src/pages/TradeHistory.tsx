import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Filter, AlertCircle, GitCompareArrows } from 'lucide-react';
import { api } from '../lib/api';
import { useStandings } from '../hooks/useStandings';

interface Trade {
  id: string;
  executedAt: string;
  data: {
    fromPlayerSeasonId: string;
    toPlayerSeasonId: string;
    wrestlerOutId: string;
    wrestlerInId: string;
  };
}

function useTradeHistory() {
  return useQuery({
    queryKey: ['tradeHistory'],
    queryFn: async () => {
      const res = await api.get<{ trades: Trade[] }>('/trades');
      return res.data.trades;
    }
  });
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-48 rounded bg-gray-800 animate-pulse" />
          <div className="h-3 w-32 rounded bg-gray-800 animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-24 rounded bg-gray-800 animate-pulse" />
    </div>
  );
}

export default function TradeHistory() {
  const [playerFilter, setPlayerFilter] = useState('');
  const { data: trades, isLoading, isError, refetch } = useTradeHistory();
  const { data: standings } = useStandings();

  // Map playerSeasonId → display name
  const playerMap = Object.fromEntries((standings ?? []).map(s => [s.playerSeasonId, s.name]));

  const filtered = (trades ?? []).filter(t => {
    if (!playerFilter) return true;
    return t.data.fromPlayerSeasonId === playerFilter || t.data.toPlayerSeasonId === playerFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Trade History</h1>
          <p className="text-gray-400 mt-2">All executed trades this season</p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 bg-purple-500/8 border border-purple-500/20 rounded-xl text-purple-400">
          <ArrowRightLeft className="w-4 h-4" />
          {isLoading ? '—' : `${trades?.length ?? 0} trades`}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-500 shrink-0" />
        <select
          value={playerFilter}
          onChange={e => setPlayerFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="">All Players</option>
          {standings?.map(s => (
            <option key={s.playerSeasonId} value={s.playerSeasonId} className="capitalize">
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">Failed to load trade history.</span>
          <button onClick={() => refetch()} className="ml-auto text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 font-bold transition-colors">Retry</button>
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border border-gray-800/60 bg-gray-900/50 overflow-hidden shadow-xl backdrop-blur-xl">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
            <GitCompareArrows className="w-12 h-12 opacity-20" />
            <p className="text-base">{trades?.length === 0 ? 'No trades executed yet this season.' : 'No trades match the selected filter.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {filtered.map(trade => {
              const fromName = playerMap[trade.data.fromPlayerSeasonId] ?? trade.data.fromPlayerSeasonId.slice(0, 8);
              const toName = playerMap[trade.data.toPlayerSeasonId] ?? trade.data.toPlayerSeasonId.slice(0, 8);
              const date = new Date(trade.executedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const time = new Date(trade.executedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

              return (
                <div key={trade.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 hover:bg-gray-800/20 transition-colors group gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                      <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-bold text-white capitalize">{fromName}</span>
                        <span className="text-gray-600 text-xs">sent</span>
                        <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-mono font-bold">
                          {trade.data.wrestlerOutId.slice(0, 8)}…
                        </span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-600" />
                        <span className="font-bold text-white capitalize">{toName}</span>
                        <span className="text-gray-600 text-xs">sent</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                          {trade.data.wrestlerInId.slice(0, 8)}…
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Trade ID: {trade.id.slice(0, 12)}…</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-gray-400 font-medium">{date}</p>
                    <p className="text-xs text-gray-600">{time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

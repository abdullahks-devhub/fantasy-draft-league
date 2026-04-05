import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, AlertCircle, Calendar } from 'lucide-react';
import { useStandings } from '../hooks/useStandings';
import { useHotWrestlers } from '../hooks/useHotWrestlers';
import { useSeasons, useActiveSeason } from '../hooks/useSeasons';

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800/50">
      <td className="p-4"><div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" /></td>
      <td className="p-4"><div className="h-5 w-24 rounded bg-gray-800 animate-pulse" /></td>
      <td className="p-4"><div className="w-5 h-5 rounded bg-gray-800 animate-pulse" /></td>
      <td className="p-4"><div className="h-6 w-20 rounded-md bg-gray-800 animate-pulse" /></td>
      <td className="p-4 text-right"><div className="h-6 w-12 rounded bg-gray-800 animate-pulse ml-auto" /></td>
    </tr>
  );
}

export default function Standings() {
  const { data: seasons } = useSeasons();
  const { data: activeSeason } = useActiveSeason();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  // Set default season to active season once loaded
  useEffect(() => {
    if (activeSeason && !selectedSeasonId) {
      setSelectedSeasonId(activeSeason.id);
    }
  }, [activeSeason, selectedSeasonId]);

  const { data: standings, isLoading, isError, refetch } = useStandings(selectedSeasonId);
  const { data: hotWrestlers } = useHotWrestlers();

  const currentSeason = seasons?.find(s => s.id === selectedSeasonId);
  const isPastSeason = currentSeason && !currentSeason.isActive;

  const leader = standings?.[0];
  const topHot = hotWrestlers?.[0];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Global Standings</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-gray-400">{currentSeason?.name || 'Loading season...'} — Live Data</p>
            {isPastSeason && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700 font-bold uppercase tracking-wider">Archive</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Season Selector */}
          <div className="relative mr-2">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select
              className="pl-9 pr-8 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none cursor-pointer"
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
            >
              {seasons?.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Active)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50 backdrop-blur-sm text-sm">
            <span className="text-gray-400">Total Players: </span>
            <span className="font-bold text-white">{standings?.length ?? '—'}</span>
          </div>
          <div className={`px-4 py-2 rounded-lg border backdrop-blur-sm text-sm ${isPastSeason ? 'bg-gray-900/40 border-gray-800 text-gray-500' : 'bg-indigo-900/20 border-indigo-500/20 text-indigo-400'}`}>
            <span className={isPastSeason ? 'text-gray-600' : 'text-indigo-400'}>Status: </span>
            <span className={`font-bold ${isPastSeason ? 'text-gray-500' : 'text-indigo-300'}`}>{isPastSeason ? 'Archived' : 'Active'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20 relative overflow-hidden backdrop-blur-sm">
          <Trophy className="w-24 h-24 absolute -right-4 -bottom-4 text-amber-500/10" />
          <h3 className="text-amber-500 font-semibold mb-1">Current Leader</h3>
          {isLoading ? (
            <>
              <div className="h-8 w-32 rounded bg-amber-800/30 animate-pulse mt-1 mb-2" />
              <div className="h-4 w-20 rounded bg-amber-800/20 animate-pulse" />
            </>
          ) : leader ? (
            <>
              <p className="text-3xl font-black text-white capitalize">{leader.name}</p>
              <p className="text-sm text-amber-200/60 mt-1">{leader.points} Points</p>
            </>
          ) : (
            <p className="text-gray-500 mt-2">No data yet</p>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm">
          <h3 className="text-gray-400 font-semibold mb-1">Hot Wrestler</h3>
          {topHot ? (
            <>
              <p className="text-2xl font-bold text-white">{topHot.name}</p>
              <p className="text-sm text-emerald-400 mt-1">+{topHot.trendPoints} pts (4wk)</p>
            </>
          ) : (
            <p className="text-gray-500 mt-2 text-sm">Loading...</p>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm">
          <h3 className="text-gray-400 font-semibold mb-1">Top Free Agent</h3>
          <p className="text-gray-500 text-sm mt-2">See Free Agents page →</p>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">Failed to load standings.</span>
          <button
            onClick={() => refetch()}
            className="ml-auto text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-colors font-bold"
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-800/60 bg-gray-900/50 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/80 border-b border-gray-700/50">
                <th className="p-4 text-sm font-semibold text-gray-400">Rank</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Player</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Trend</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Roster</th>
                <th className="p-4 text-sm font-semibold text-gray-400 text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : standings?.map((player) => (
                    <tr key={player.playerSeasonId} className="group hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          player.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          player.rank === 2 ? 'bg-gray-300/10 text-gray-300 border border-gray-400/20' :
                          player.rank === 3 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                          'bg-gray-800 text-gray-500'
                        }`}>
                          {player.rank}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-lg text-gray-200 capitalize group-hover:text-white transition-colors">{player.name}</td>
                      <td className="p-4">
                        {player.trend === 'up' && <TrendingUp className="w-5 h-5 text-emerald-500" />}
                        {player.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
                        {player.trend === 'stable' && <Minus className="w-5 h-5 text-gray-500" />}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-gray-800 text-xs font-medium text-gray-300 border border-gray-700">
                          {player.rosterSize}/15 Limit
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-xl text-indigo-400 font-mono">
                        {player.points}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

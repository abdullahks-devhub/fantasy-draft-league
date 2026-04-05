import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, TrendingUp, UserCheck, Users, Loader2 } from 'lucide-react';
import { useHotWrestlers } from '../hooks/useHotWrestlers';

// Chart colors for up to 10 wrestlers
const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#f43f5e', '#a78bfa', '#38bdf8', '#fb923c', '#e879f9', '#4ade80', '#facc15'];

function WrestlerCard({ wrestler, index, signed }: { wrestler: any; index: number; signed: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/40 hover:bg-gray-800/70 hover:border-gray-600/60 transition-all flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <span className={`text-lg font-black w-8 text-right tabular-nums ${
          index === 0 ? 'text-amber-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-500' : 'text-gray-600'
        }`}>
          #{index + 1}
        </span>
        <div>
          <h4 className="text-white font-bold text-sm group-hover:text-indigo-300 transition-colors">{wrestler.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-700/80 text-gray-400 border border-gray-600/50">
              {wrestler.promotion ?? wrestler.currentTeam ?? '—'}
            </span>
            {!signed && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Free Agent
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-xl font-black tabular-nums ${signed ? 'text-white' : 'text-emerald-400'}`}>
          {wrestler.trendPoints ?? wrestler.total}
        </div>
        <div className="text-xs text-gray-500">pts / 4wk</div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/40 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-6 rounded bg-gray-700 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-gray-700 animate-pulse" />
          <div className="h-3 w-16 rounded bg-gray-700 animate-pulse" />
        </div>
      </div>
      <div className="h-7 w-12 rounded bg-gray-700 animate-pulse" />
    </div>
  );
}

export default function HotWrestlers() {
  const { data: hotWrestlers, isLoading } = useHotWrestlers();

  // Build chart data from API results
  const chartData = hotWrestlers && hotWrestlers.length > 0
    ? [{ week: 'Last 4 Weeks', ...Object.fromEntries(hotWrestlers.slice(0, 5).map(w => [w.name.split(' ')[1] || w.name.split(' ')[0], w.trendPoints])) }]
    : [];

  const chartKeys = hotWrestlers?.slice(0, 5).map((w, i) => ({
    key: w.name.split(' ')[1] || w.name.split(' ')[0],
    color: COLORS[i],
  })) ?? [];

  return (
    <div className="space-y-8 animate-in duration-500">
      {/* Header */}
      <div className="border-b border-gray-800 pb-6 flex items-center gap-3">
        <Flame className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-black text-white">Hot Wrestlers</h1>
          <p className="text-gray-400 mt-1 text-sm">Top point earners over the last 4 weeks</p>
        </div>
        {isLoading && <Loader2 className="w-5 h-5 text-gray-500 ml-auto animate-spin" />}
      </div>

      {/* Chart - only render when we have meaningful multi-week data */}
      {hotWrestlers && hotWrestlers.length > 0 && (
        <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800/60 shadow-xl backdrop-blur-xl">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            4-Week Performance Trajectory
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  {chartKeys.map(({ key, color }) => (
                    <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="week" stroke="#6b7280" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#374151', borderRadius: '0.75rem', color: '#f9fafb', fontSize: 13 }}
                  formatter={(value: any) => [`${value ?? 0} pts`, '']}
                />
                {chartKeys.map(({ key, color }) => (
                  <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2.5}
                    fillOpacity={1} fill={`url(#color${key})`} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Dual List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All hot wrestlers (signed) panel */}
        <div className="rounded-2xl border border-gray-800/60 bg-gray-900/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/60 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white">Top Trending Wrestlers</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Last 4 Weeks
            </span>
          </div>
          <div className="p-4 space-y-3">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              : hotWrestlers?.length === 0
              ? <p className="text-gray-500 text-sm text-center py-6">No data yet — run the scraper first.</p>
              : hotWrestlers?.map((w, i) => (
                  <WrestlerCard key={w.id} wrestler={w} index={i} signed={true} />
                ))
            }
          </div>
        </div>

        {/* Free agents panel */}
        <div className="rounded-2xl border border-emerald-900/30 bg-gray-900/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-emerald-900/30 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white">Hot Free Agents</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Available
            </span>
          </div>
          <div className="p-4 flex items-center justify-center text-gray-500 text-sm py-10">
            <p>Visit the <span className="text-emerald-400 font-semibold">Free Agents</span> page for full waiver wire listings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

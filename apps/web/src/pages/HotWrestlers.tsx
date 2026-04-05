import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, TrendingUp, UserCheck, Users, Loader2, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { useHotWrestlers, useFreeAgentAnalytics, usePredictions } from '../hooks/useHotWrestlers';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a78bfa', '#38bdf8', '#fb923c', '#e879f9', '#4ade80', '#facc15'];

function SectionHeader({ icon: Icon, title, badge }: { icon: any; title: string; badge?: string }) {
  return (
    <div className="px-5 py-4 border-b border-gray-800/60 flex items-center gap-2 bg-gray-900/30">
      <Icon className="w-5 h-5 text-indigo-400" />
      <h3 className="font-bold text-white">{title}</h3>
      {badge && (
        <span className="ml-auto text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {badge}
        </span>
      )}
    </div>
  );
}

function PredictionCard({ prediction, index }: { prediction: any; index: number }) {
  return (
    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-12 h-12 text-indigo-400" />
      </div>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-indigo-500/40">#{index + 1}</span>
          <h4 className="text-white font-bold">{prediction.name}</h4>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-indigo-400 tabular-nums">{prediction.potentialScore}</div>
          <div className="text-[10px] text-indigo-500/60 font-bold uppercase">Potential</div>
        </div>
      </div>
      <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
        {prediction.reason}
      </p>
      <div className="flex items-center gap-3 pt-3 border-t border-indigo-500/10">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Est. Avg</span>
          <span className="text-sm font-bold text-white">{prediction.estimatedAvg} <span className="text-[10px] text-gray-500">pts</span></span>
        </div>
        <div className="ml-auto flex items-center gap-1 group/tip">
          <AlertCircle className="w-3.5 h-3.5 text-gray-600 hover:text-indigo-400 cursor-help" />
          <div className="invisible group-hover/tip:visible absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 border border-gray-700 rounded-lg text-[10px] text-gray-300 shadow-2xl z-20">
            Calculated based on match frequency, win rate, and show type weights over the last 30 days.
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleWrestlerCard({ wrestler, index, showPoints = true, detailLabel }: { 
  wrestler: any; index: number; showPoints?: boolean; detailLabel?: string 
}) {
  return (
    <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40 hover:bg-gray-800/70 transition-all flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <span className="text-sm font-black text-gray-600 w-6 text-right">{index + 1}</span>
        <div>
          <h4 className="text-white font-bold text-sm">{wrestler.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-500 uppercase font-medium">{wrestler.promotion}</span>
            {wrestler.lastMatch && (
              <span className="flex items-center gap-1 text-[10px] text-gray-600">
                <Calendar className="w-2.5 h-2.5" />
                {format(new Date(wrestler.lastMatch), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
      {showPoints && (
        <div className="text-right">
          <div className="text-sm font-black text-white">{wrestler.trendPoints ?? wrestler.matchCountYear}</div>
          <div className="text-[9px] text-gray-600 font-bold uppercase">{detailLabel || 'Points'}</div>
        </div>
      )}
    </div>
  );
}

export default function HotWrestlers() {
  const [activeTab, setActiveTab] = useState<'trending' | 'projections'>('trending');
  
  const { data: hotWrestlers, isLoading: loadingHot } = useHotWrestlers();
  const { data: freeAgents, isLoading: loadingFA } = useFreeAgentAnalytics();
  const { data: predictions, isLoading: loadingPred } = usePredictions();

  const chartData = hotWrestlers?.slice(0, 5).length 
    ? [{ week: '4wk Trend', ...Object.fromEntries(hotWrestlers.slice(0, 5).map(w => [w.name.split(' ')[1] || w.name.split(' ')[0], w.trendPoints])) }]
    : [];

  const chartKeys = hotWrestlers?.slice(0, 5).map((w, i) => ({
    key: w.name.split(' ')[1] || w.name.split(' ')[0],
    color: COLORS[i],
  })) ?? [];

  return (
    <div className="space-y-8 animate-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Analytics Lab</h1>
            <p className="text-gray-400 mt-1 font-medium italic">Data-driven insights for the championship chase.</p>
          </div>
        </div>

        <div className="flex p-1 bg-gray-900 border border-gray-800 rounded-xl">
          <button 
            onClick={() => setActiveTab('trending')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'trending' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Recent Performance
          </button>
          <button 
            onClick={() => setActiveTab('projections')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'projections' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Waiver Projections
          </button>
        </div>
      </div>

      {activeTab === 'trending' ? (
        <>
          {/* Performance Chart */}
          <div className="p-8 rounded-3xl bg-gray-900/80 border border-gray-800/60 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
            <h3 className="text-white font-bold mb-8 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              Momentum Index: Top 5 Over Last 30 Days
            </h3>
            <div className="h-72 w-full">
              {loadingHot ? (
                 <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-700" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      {chartKeys.map(({ key, color }) => (
                        <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="week" hide />
                    <YAxis stroke="#4b5563" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d1117', borderColor: '#374151', borderRadius: '1rem', color: '#f9fafb' }}
                      formatter={(value: any) => [`${value} pts`, '']}
                    />
                    {chartKeys.map(({ key, color }) => (
                      <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={3}
                        fillOpacity={1} fill={`url(#color${key})`} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Trending (Drafted) */}
            <div className="rounded-2xl border border-gray-800/60 bg-gray-900/40 overflow-hidden backdrop-blur-md">
              <SectionHeader icon={UserCheck} title="Current Elite Performers" badge="Top 10 Drafted" />
              <div className="p-5 space-y-3">
                {loadingHot ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-800/50 rounded-xl animate-pulse" />)
                  : hotWrestlers?.map((w, i) => <SimpleWrestlerCard key={w.id} wrestler={w} index={i} />)
                }
              </div>
            </div>

            {/* Top 20 Free Agents */}
            <div className="rounded-2xl border border-emerald-900/30 bg-gray-900/40 overflow-hidden backdrop-blur-md">
              <SectionHeader icon={Users} title="Top Available Free Agents" badge="Top 20 Active" />
              <div className="p-5 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {loadingFA ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-800/50 rounded-xl animate-pulse" />)
                  : freeAgents?.map((w, i) => <SimpleWrestlerCard key={w.id} wrestler={w} index={i} detailLabel="Matches (1yr)" />)
                }
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mb-2">
            <h3 className="text-indigo-300 font-bold flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              How Waiver Projections Work
            </h3>
            <p className="text-xs text-indigo-400/70 leading-relaxed max-w-3xl">
              Our algorithm analyzes recent match frequency, win ratios, and show tiers (PPV/TV) over the last 30 days to predict which unsigned wrestlers are in a "push" and likely to contribute immediate fantasy value.
            </p>
          </div>
          {loadingPred ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-gray-800/50 rounded-xl animate-pulse" />)
            : predictions?.map((p, i) => <PredictionCard key={p.id} prediction={p} index={i} />)
          }
        </div>
      )}
    </div>
  );
}

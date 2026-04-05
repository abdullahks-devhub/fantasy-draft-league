import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader2, AlertCircle, Tv, Hash } from 'lucide-react';
import { useWeeklyScores } from '../hooks/useWeeklyScores';
import { format } from 'date-fns';

function MatchRow({ match }: { match: any }) {
  const { winners, losers, drawers, isMainEvent } = match;

  const formatUnit = (participants: any[]) => {
    return participants.map((p, idx) => (
      <span key={p.id}>
        <span className="text-white font-bold">{p.name}</span>
        {p.owner && <span className="text-indigo-400 font-medium ml-1">({p.owner})</span>}
        {idx < participants.length - 1 && <span className="text-gray-500 mx-1">and</span>}
      </span>
    ));
  };

  const allParticipants = [...winners, ...losers, ...drawers];

  return (
    <div className="py-3 px-2 hover:bg-gray-800/30 transition-colors rounded-lg group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="text-sm leading-relaxed">
          {drawers.length > 0 ? (
            <>
              {formatUnit(drawers)}
              <span className="text-orange-400 font-medium mx-2 italic">draws with</span>
              {/* If it's a multi-man draw without clear sides, this might need adjustment, 
                  but usually matches are Side A vs Side B. In a draw, we show all drawers. */}
            </>
          ) : (
            <>
              {formatUnit(winners)}
              <span className="text-emerald-500 font-medium mx-2 italic">def.</span>
              {formatUnit(losers)}
            </>
          )}
          
          {/* Point Display */}
          {allParticipants.some(p => p.codes.length > 0) && (
            <span className="ml-2 text-gray-400 font-mono">
              : <span className="text-emerald-400 font-bold">
                {allParticipants.reduce((acc, p) => acc + (p.codes.length > 0 ? 1 : 0), 0)} {/* Mock points sum logic */}
              </span>
              <span className="text-[10px] ml-1 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 text-gray-500">
                ({allParticipants.flatMap(p => p.codes).join(' + ')})
              </span>
            </span>
          )}
        </div>

        {isMainEvent && (
          <span className="text-[10px] font-black tracking-tighter bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase self-start md:self-center">
            Main Event
          </span>
        )}
      </div>
    </div>
  );
}

export default function WeeklyScores() {
  const [targetWeek, setTargetWeek] = useState<number | undefined>(undefined);
  const { data, isLoading, isError, refetch } = useWeeklyScores(targetWeek);

  const shows = data?.shows ?? [];
  const weekNumber = data?.weekNumber;

  const navigateWeek = (delta: number) => {
    if (!weekNumber) return;
    const next = weekNumber + delta;
    if (next >= 1) {
      setTargetWeek(next);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-900/40 p-6 rounded-3xl border border-gray-800/60 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Hash className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Weekly Scorecard</h1>
            <p className="text-gray-500 font-medium">Official league results and point allocations.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-2xl border border-gray-800">
          <button
            onClick={() => navigateWeek(-1)}
            disabled={!weekNumber || weekNumber <= 1}
            className="p-2 rounded-xl hover:bg-gray-800 text-gray-500 hover:text-white transition-all disabled:opacity-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-gray-200">Week {weekNumber}</span>
          </div>
          <button
            onClick={() => navigateWeek(1)}
            disabled={!weekNumber}
            className="p-2 rounded-xl hover:bg-gray-800 text-gray-500 hover:text-white transition-all disabled:opacity-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center gap-4 text-gray-600">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm font-medium">Synchronizing match data...</p>
        </div>
      ) : isError ? (
        <div className="py-20 flex flex-col items-center gap-4 text-red-400 bg-red-400/5 rounded-3xl border border-red-400/10">
          <AlertCircle className="w-12 h-12" />
          <p className="font-bold">Failed to sync scores.</p>
          <button onClick={() => refetch()} className="text-xs px-4 py-2 bg-red-400/10 hover:bg-red-400/20 rounded-full border border-red-400/20 transition-all font-bold">
            Retry Connection
          </button>
        </div>
      ) : shows.length === 0 ? (
        <div className="py-32 flex flex-col items-center gap-4 text-gray-700 bg-gray-900/20 rounded-3xl border border-gray-800/40">
          <Tv className="w-16 h-16 opacity-10" />
          <p className="font-bold">No results recorded for this period.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {shows.map((show: any) => (
            <div key={show.showId} className="group relative">
              {/* Vertical line indicator */}
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-indigo-500/20 rounded-full group-hover:bg-indigo-500/40 transition-colors" />
              
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-black text-white">{show.promotion} {show.showName}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700 uppercase tracking-widest">
                    {show.showType}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-tighter">
                  <span>{format(new Date(show.date), 'MM/dd/yyyy')}</span>
                  <span>•</span>
                  <span>{show.matches.length} Matches</span>
                </div>
              </div>

              <div className="space-y-1">
                {show.matches.map((match: any) => (
                  <MatchRow key={match.matchId} match={match} />
                ))}
              </div>

              {/* Discord-style signature / metadata requested by user */}
              <div className="mt-4 pt-2 border-t border-gray-800/40 flex items-center gap-3 text-[10px] text-gray-700 font-mono italic">
                 <span>S-(1. M 2. L 3. K 4. D 5.C/A)</span>
                 <span>•</span>
                 <span>{format(new Date(show.date), 'dd/MM/yyyy, h:mm a')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

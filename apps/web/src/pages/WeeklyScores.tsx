import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader2, AlertCircle, Tv, Star, Swords } from 'lucide-react';
import { useWeeklyScores } from '../hooks/useWeeklyScores';

const RESULT_COLORS = {
  WIN:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LOSS: 'bg-red-500/10 text-red-400 border-red-500/20',
  DRAW: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const PROMO_COLORS: Record<string, string> = {
  AEW:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  NJPW:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  WWE:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ROH:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  STARDOM: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  AAA:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  NOAH:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  NXT:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

function ShowTypeBadge({ type }: { type: string }) {
  const isPPV = type?.toUpperCase() === 'PPV';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${isPPV ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'bg-gray-700/60 text-gray-400 border-gray-600/40'}`}>
      {isPPV ? <span className="flex items-center gap-1"><Star className="w-3 h-3" />{type}</span> : type}
    </span>
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
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">Weekly Scores</h1>
          <p className="text-gray-400 mt-2">
            {weekNumber ? `Week ${weekNumber}` : 'Latest week'} — match results &amp; points
          </p>
        </div>

        {/* Week navigator */}
        <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-xl px-2 py-1.5">
          <button
            onClick={() => navigateWeek(-1)}
            disabled={!weekNumber || weekNumber <= 1}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-300 px-2 min-w-[90px] text-center flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            {weekNumber ? `Week ${weekNumber}` : 'Latest'}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            disabled={!weekNumber}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">Failed to load weekly scores.</span>
          <button onClick={() => refetch()} className="ml-auto text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 font-bold transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading shows...</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && shows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
          <Tv className="w-12 h-12 opacity-20" />
          <p className="text-base">No shows scraped for this week yet.</p>
          <p className="text-sm text-gray-600">Run the Cagematch scraper from the Admin panel.</p>
        </div>
      )}

      {/* Shows */}
      <div className="space-y-6">
        {shows.map(show => (
          <div key={show.showId} className="rounded-2xl border border-gray-800/60 bg-gray-900/50 overflow-hidden shadow-xl backdrop-blur-xl">
            {/* Show header */}
            <div className="px-6 py-4 border-b border-gray-800/50 flex flex-wrap items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-white">{show.showName}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{new Date(show.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${PROMO_COLORS[show.promotion] ?? 'bg-gray-700/50 text-gray-400 border-gray-600/40'}`}>
                  {show.promotion}
                </span>
                <ShowTypeBadge type={show.showType} />
              </div>
            </div>

            {/* Matches */}
            <div className="divide-y divide-gray-800/40">
              {show.matches.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-6">No matches recorded.</p>
              ) : show.matches.map(match => (
                <div key={match.matchId} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Swords className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-500 font-medium">{match.matchType}</span>
                    {match.isMainEvent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        MAIN EVENT
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {match.participants.map(p => (
                      <div key={p.wrestlerId} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/40">
                        <span className="text-sm font-semibold text-gray-200">{p.wrestlerName}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${RESULT_COLORS[p.result]}`}>
                          {p.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

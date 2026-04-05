import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Trophy, Calendar, Users, Star, ChevronDown, ChevronUp, History } from 'lucide-react';

interface HistorySeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  winner: string | null;
  standings: {
    playerId: string;
    playerName: string;
    totalPoints: number;
    roster: {
      id: string;
      status: string;
      wrestlers: string[];
    }[];
  }[];
}

export default function HistoryArchive() {
  const { data: historyData, isLoading } = useQuery<{ history: HistorySeason[] }>({
    queryKey: ['seasonHistory'],
    queryFn: async () => {
      const res = await api.get('/seasons/history');
      return res.data;
    }
  });

  const [expandedSeasons, setExpandedSeasons] = useState<Record<string, boolean>>({});

  const toggleSeason = (id: string) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const seasons = historyData?.history || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-gray-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent inline-flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Hall of Fame & History
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-2xl">
            A comprehensive archive of past Fantasy Draft seasons. View historical champions, final point standings, and end-of-season rosters.
          </p>
        </div>
      </div>

      {seasons.length === 0 ? (
        <div className="p-12 text-center border border-gray-800 rounded-2xl bg-gray-900/50">
          <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Historical Data</h3>
          <p className="text-gray-400">Past seasons will appear here once completed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {seasons.map((season) => {
            const isExpanded = expandedSeasons[season.id];
            
            return (
              <div key={season.id} className="border border-gray-800 rounded-2xl bg-gray-900/50 overflow-hidden transition-all">
                {/* Header / Summary */}
                <button 
                  onClick={() => toggleSeason(season.id)}
                  className="w-full text-left p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Trophy className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{season.name}</h2>
                      <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(season.startDate).getFullYear()}</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {season.standings.length} Players</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Champion</p>
                      <p className="text-xl font-bold text-amber-400 capitalize flex items-center gap-2">
                        {season.winner || 'Unknown'} 
                        <Star className="w-5 h-5 fill-amber-400" />
                      </p>
                    </div>
                    <div className="p-2 bg-gray-800 rounded-full">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-800 p-6 bg-gray-900 backdrop-blur-sm animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-bold text-white mb-4">Final Standings</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {season.standings.map((player, rank) => (
                        <div key={player.playerId} className={`p-4 rounded-xl border ${rank === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-gray-800/30 border-gray-700/50'}`}>
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800/50">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                rank === 0 ? 'bg-amber-500 text-black' : rank === 1 ? 'bg-gray-300 text-black' : rank === 2 ? 'bg-orange-400 text-black' : 'bg-gray-800 text-gray-400'
                              }`}>
                                {rank + 1}
                              </span>
                              <span className={`text-lg font-bold capitalize ${rank === 0 ? 'text-amber-400' : 'text-white'}`}>
                                {player.playerName}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-black text-white">{player.totalPoints}</span>
                              <span className="text-xs text-gray-500 ml-1">pts</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Final Roster</p>
                            <div className="flex flex-wrap gap-2">
                              {player.roster.filter(r => r.status === 'ACTIVE').flatMap(r => r.wrestlers).map((wName, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-md border border-gray-700">
                                  {wName}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

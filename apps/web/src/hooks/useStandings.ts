import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface StandingsEntry {
  playerSeasonId: string;
  name: string;
  points: number;
  trend: 'up' | 'down' | 'stable';
  rosterSize: number;
  rank: number;
}

export interface HistoricalStanding {
  id: string;
  playerSeasonId: string;
  weekNumber: number;
  totalPoints: number;
  rank: number;
  playerSeason: {
    user: {
      email: string;
    };
  };
}

export function useStandings(seasonId?: string) {
  return useQuery({
    queryKey: ['standings', seasonId],
    queryFn: async () => {
      const response = await api.get<{ standings: StandingsEntry[] }>('/standings', {
        params: { seasonId }
      });
      return response.data.standings;
    }
  });
}

export function useStandingsHistory(seasonId?: string) {
  return useQuery({
    queryKey: ['standingsHistory', seasonId],
    queryFn: async () => {
      const response = await api.get<{ history: HistoricalStanding[] }>('/standings/history', {
        params: { seasonId }
      });
      return response.data.history;
    }
  });
}

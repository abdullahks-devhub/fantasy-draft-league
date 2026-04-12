import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Participant {
  id: string;
  name: string;
  owner: string | null;
  codes: string[];
}

export interface MatchResult {
  matchId: string;
  matchType: string;
  isMainEvent: boolean;
  winners: Participant[];
  losers: Participant[];
  drawers: Participant[];
  resultType: string;
}

export interface ShowResult {
  showId: string;
  showName: string;
  date: string;
  promotion: string;
  showType: string;
  matches: MatchResult[];
}

export function useWeeklyScores(weekNumber?: number) {
  return useQuery({
    queryKey: ['weeklyScores', weekNumber],
    queryFn: async () => {
      const response = await api.get<{ shows: ShowResult[]; weekNumber: number }>('/shows/weekly', {
        params: { weekNumber }
      });
      return response.data;
    }
  });
}

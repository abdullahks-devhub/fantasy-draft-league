import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ShowResult {
  showId: string;
  showName: string;
  date: string;
  promotion: string;
  showType: string;
  matches: {
    matchId: string;
    matchType: string;
    isMainEvent: boolean;
    participants: {
      wrestlerName: string;
      wrestlerId: string;
      result: 'WIN' | 'LOSS' | 'DRAW';
    }[];
  }[];
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

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface HotWrestler {
  id: string;
  name: string;
  promotion: string;
  trendPoints: number;
}

export function useHotWrestlers(seasonId?: string) {
  return useQuery({
    queryKey: ['hotWrestlers', seasonId],
    queryFn: async () => {
      const response = await api.get<{ hotWrestlers: HotWrestler[] }>('/analytics/hot', {
        params: { seasonId }
      });
      return response.data.hotWrestlers;
    }
  });
}

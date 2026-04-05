import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const response = await api.get<{ seasons: Season[] }>('/seasons');
      return response.data.seasons;
    }
  });
}

export function useActiveSeason() {
  return useQuery({
    queryKey: ['activeSeason'],
    queryFn: async () => {
      const response = await api.get<{ season: Season }>('/seasons/active');
      return response.data.season;
    }
  });
}

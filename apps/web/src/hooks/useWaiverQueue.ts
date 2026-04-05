import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface WaiverMove {
  id: string;
  action: 'ADD' | 'DROP';
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  priority: number;
  createdAt: string;
  wrestler?: {
    id: string;
    name: string;
    currentTeam: string | null;
  };
  playerSeason?: {
    totalPoints: number;
    user: {
      email: string;
    };
  };
}

export function useWaiverQueue(seasonId?: string) {
  return useQuery({
    queryKey: ['waiverQueue', seasonId],
    queryFn: async () => {
      const response = await api.get<{ pending: WaiverMove[] }>('/waivers/pending', {
        params: { seasonId }
      });
      return response.data.pending;
    }
  });
}

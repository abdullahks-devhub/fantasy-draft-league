import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface RosterSlot {
  id: string;
  playerSeasonId: string;
  wrestlerId: string;
  status: string;
  wrestler: {
    id: string;
    name: string;
    currentTeam: string | null;
    active: boolean;
  };
}

export function useRoster(playerSeasonId: string) {
  return useQuery({
    queryKey: ['roster', playerSeasonId],
    queryFn: async () => {
      const response = await api.get<{ roster: RosterSlot[] }>(`/rosters/${playerSeasonId}`);
      return response.data.roster;
    },
    enabled: !!playerSeasonId
  });
}

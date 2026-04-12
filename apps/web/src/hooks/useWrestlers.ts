import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface WrestlerAlias {
  id: string;
  alias: string;
}

export interface ChampionStatus {
  id: string;
  titleName: string;
}

export interface Wrestler {
  id: string;
  name: string;
  currentTeam: string | null;
  active: boolean;
  isHeel: boolean;
  promotion: string;
  aliases?: WrestlerAlias[];
  championships?: ChampionStatus[];
}

export function useWrestlers(search?: string, promotion?: string, active?: boolean) {
  return useQuery({
    queryKey: ['wrestlers', search, promotion, active],
    queryFn: async () => {
      const response = await api.get<{ wrestlers: Wrestler[] }>('/wrestlers', {
        params: { search, promotion, active }
      });
      return response.data.wrestlers;
    }
  });
}

export function useWrestlerDetail(id: string) {
  return useQuery({
    queryKey: ['wrestler', id],
    queryFn: async () => {
      const response = await api.get<{ wrestler: Wrestler }>(`/wrestlers/${id}`);
      return response.data.wrestler;
    },
    enabled: !!id
  });
}

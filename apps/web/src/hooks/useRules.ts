import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface PointRule {
  id: string;
  seasonId: string;
  showType: string | null;
  matchType: string | null;
  result: 'WIN' | 'LOSS' | 'DRAW' | null;
  isMainEvent: boolean | null;
  isTournament: boolean | null;
  isFinals: boolean | null;
  isTitleMatch: boolean | null;
  isWorldTitle: boolean | null;
  isDefense: boolean | null;
  points: number;
}

export function useRules(seasonId?: string) {
  return useQuery({
    queryKey: ['rules', seasonId],
    queryFn: async () => {
      const response = await api.get<{ rules: PointRule[] }>('/rules', {
        params: { seasonId }
      });
      return response.data.rules;
    }
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, points }: { id: string; points: number }) => {
      const response = await api.put<{ rule: PointRule }>(`/rules/${id}`, { points });
      return response.data.rule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    }
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PointRule>) => {
      const response = await api.post<{ rule: PointRule }>('/rules', data);
      return response.data.rule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    }
  });
}

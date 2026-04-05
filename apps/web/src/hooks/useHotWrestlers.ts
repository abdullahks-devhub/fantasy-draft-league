import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface HotWrestler {
  id: string;
  name: string;
  promotion: string;
  trendPoints: number;
}

export interface Prediction {
  id: string;
  name: string;
  potentialScore: number;
  estimatedAvg: string;
  reason: string;
}

export interface FreeAgent {
  id: string;
  name: string;
  promotion: string;
  lastMatch: string;
  matchCountYear: number;
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

export function useFreeAgentAnalytics(seasonId?: string) {
  return useQuery({
    queryKey: ['freeAgentsAnalytics', seasonId],
    queryFn: async () => {
      const response = await api.get<{ freeAgents: FreeAgent[] }>('/analytics/free-agents', {
        params: { seasonId }
      });
      return response.data.freeAgents;
    }
  });
}

export function usePredictions(seasonId?: string) {
  return useQuery({
    queryKey: ['predictions', seasonId],
    queryFn: async () => {
      const response = await api.get<{ predictions: Prediction[] }>('/analytics/predictions', {
        params: { seasonId }
      });
      return response.data.predictions;
    }
  });
}

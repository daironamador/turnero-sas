
import { useQuery } from '@tanstack/react-query';
import { ServiceType } from '@/lib/types';
import { getTodayStats } from '@/services/ticketService';
import { supabase } from '@/lib/supabase';

export interface QueueStat {
  serviceType: ServiceType;
  waitingCount: number;
  inService: number;
}

export function useDashboardData() {
  // Fetch today's stats (total tickets, completed, etc)
  const statsQuery = useQuery({
    queryKey: ['todayStats'],
    queryFn: getTodayStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch active counters (rooms)
  const countersQuery = useQuery({
    queryKey: ['activeCounters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch queue stats by service type
  const queueStatsQuery = useQuery({
    queryKey: ['queueStats'],
    queryFn: async (): Promise<QueueStat[]> => {
      const serviceTypes: ServiceType[] = ['CG', 'RX', 'RR', 'EX', 'OT'];
      const stats: QueueStat[] = [];

      // For each service type, get waiting and serving counts
      for (const serviceType of serviceTypes) {
        // Get waiting count
        const { data: waitingData, error: waitingError, count: waitingCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'waiting')
          .eq('service_type', serviceType);

        if (waitingError) throw waitingError;

        // Get in service count
        const { data: servingData, error: servingError, count: servingCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'serving')
          .eq('service_type', serviceType);

        if (servingError) throw servingError;

        stats.push({
          serviceType,
          waitingCount: waitingCount || 0,
          inService: servingCount || 0,
        });
      }

      return stats;
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  return {
    statsQuery,
    countersQuery,
    queueStatsQuery,
  };
}

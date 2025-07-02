
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
    queryFn: async () => {
      console.log('Fetching today stats...');
      try {
        const stats = await getTodayStats();
        console.log('Today stats result:', stats);
        return stats;
      } catch (error) {
        console.error('Error fetching today stats:', error);
        throw error;
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch active counters (rooms)
  const countersQuery = useQuery({
    queryKey: ['activeCounters'],
    queryFn: async () => {
      console.log('Fetching active counters...');
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('is_active', true);
        
        if (error) {
          console.error('Error fetching active counters:', error);
          throw error;
        }
        console.log('Active counters result:', data);
        return data;
      } catch (error) {
        console.error('Error in counters query:', error);
        throw error;
      }
    },
    refetchInterval: 20000, // Refresh every 20 seconds
  });

  // Fetch queue stats by service type
  const queueStatsQuery = useQuery({
    queryKey: ['queueStats'],
    queryFn: async (): Promise<QueueStat[]> => {
      console.log('Fetching queue stats...');
      try {
        const serviceTypes: ServiceType[] = ['CG', 'RX', 'RR', 'EX', 'OT'];
        const stats: QueueStat[] = [];
        
        // Get today's date bounds
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

        console.log('Date range:', { startOfDay, endOfDay });

        // For each service type, get waiting and serving counts
        for (const serviceType of serviceTypes) {
          // Get waiting count for today
          const { data: waitingData, error: waitingError, count: waitingCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'waiting')
            .eq('service_type', serviceType)
            .gte('created_at', startOfDay)
            .lt('created_at', endOfDay);

          if (waitingError) {
            console.error(`Error fetching waiting tickets for ${serviceType}:`, waitingError);
            throw waitingError;
          }

          // Get in service count for today
          const { data: servingData, error: servingError, count: servingCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'serving')
            .eq('service_type', serviceType)
            .gte('created_at', startOfDay)
            .lt('created_at', endOfDay);

          if (servingError) {
            console.error(`Error fetching serving tickets for ${serviceType}:`, servingError);
            throw servingError;
          }

          stats.push({
            serviceType,
            waitingCount: waitingCount || 0,
            inService: servingCount || 0,
          });
        }

        console.log('Queue stats result:', stats);
        return stats;
      } catch (error) {
        console.error('Error in queue stats query:', error);
        throw error;
      }
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  return {
    statsQuery,
    countersQuery,
    queueStatsQuery,
  };
}

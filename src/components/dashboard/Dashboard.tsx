
import React from 'react';
import { Ticket, Users, CheckCheck, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ServiceType, ServiceTypeLabels } from '@/lib/types';
import StatsCard from './StatsCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardData } from './useDashboardData';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, dd 'de' MMMM, yyyy");
  
  // Use our custom hook to fetch data
  const { statsQuery, countersQuery, queueStatsQuery } = useDashboardData();
  
  // Extract data for easier access
  const todayStats = statsQuery.data || { total: 0, waiting: 0, completed: 0 };
  const activeCounters = countersQuery.data?.length || 0;
  const queueStats = queueStatsQuery.data || [];
  
  // Loading states for different sections
  const isStatsLoading = statsQuery.isLoading;
  const isQueueStatsLoading = queueStatsQuery.isLoading;
  
  // Debug information
  React.useEffect(() => {
    console.log('Dashboard render - Stats:', {
      statsLoading: statsQuery.isLoading,
      statsError: statsQuery.error,
      statsData: statsQuery.data,
      countersLoading: countersQuery.isLoading,
      countersError: countersQuery.error,
      countersData: countersQuery.data,
      queueStatsLoading: queueStatsQuery.isLoading,
      queueStatsError: queueStatsQuery.error,
      queueStatsData: queueStatsQuery.data,
    });
  }, [statsQuery, countersQuery, queueStatsQuery]);
  
  return (
    <div className="space-y-8 animate-slide-down">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 capitalize">{formattedDate}</p>
        </div>
        <div className="flex gap-3">
          <Button 
            size="sm" 
            variant="outline"
            className="border-ocular-200 text-ocular-700 hover:bg-ocular-50"
            onClick={() => navigate('/tickets')}
          >
            <Ticket className="w-4 h-4 mr-2" />
            Generar Ticket
          </Button>
          <Button 
            size="sm" 
            className="bg-ocular-600 hover:bg-ocular-700 text-white"
            onClick={() => navigate('/display')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Ver Pantalla
          </Button>
        </div>
      </div>

      {/* General statistics - Now first section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Resumen del Día</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isStatsLoading ? (
            // Show skeleton loaders when loading
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="h-20 flex items-center justify-center">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatsCard 
                title="Tickets hoy" 
                value={todayStats.total} 
                icon={Ticket} 
                iconClassName="bg-blue-100/50"
              />
              <StatsCard 
                title="En espera" 
                value={todayStats.waiting} 
                icon={Clock} 
                iconClassName="bg-purple-100/50"
              />
              <StatsCard 
                title="Atendidos hoy" 
                value={todayStats.completed} 
                icon={CheckCheck} 
                iconClassName="bg-green-100/50"
              />
              <StatsCard 
                title="Ventanillas activas" 
                value={activeCounters} 
                icon={Users} 
                iconClassName="bg-amber-100/50"
              />
            </>
          )}
        </div>
      </div>

      {/* Queue stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Estado de las Colas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {isQueueStatsLoading ? (
            // Show skeleton loaders when loading
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="h-24 flex items-center justify-center">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            queueStats.map((queue) => (
              <Card key={queue.serviceType} className="hover-scale">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">
                    {ServiceTypeLabels[queue.serviceType]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-ocular-700">
                          {queue.waitingCount}
                        </span>
                        <span className="text-sm text-gray-500">en espera</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-medium text-ocular-600">
                          {queue.inService}
                        </span>
                        <span className="text-sm text-gray-500">en atención</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-ocular-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-ocular-600">{queue.serviceType}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <div className="flex justify-end mt-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/tickets')}
          >
            Administrar colas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

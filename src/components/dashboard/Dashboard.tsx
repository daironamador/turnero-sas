
import React from 'react';
import { Ticket, Users, CheckCheck, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ServiceType, ServiceTypeLabels } from '@/lib/types';
import StatsCard from './StatsCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for demonstration
const mockQueueStats = [
  { serviceType: 'CG' as ServiceType, waitingCount: 4, inService: 1 },
  { serviceType: 'RX' as ServiceType, waitingCount: 2, inService: 1 },
  { serviceType: 'RR' as ServiceType, waitingCount: 3, inService: 0 },
  { serviceType: 'EX' as ServiceType, waitingCount: 1, inService: 0 },
  { serviceType: 'OT' as ServiceType, waitingCount: 0, inService: 0 },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, dd 'de' MMMM, yyyy");
  
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
          <StatsCard 
            title="Tickets hoy" 
            value={42} 
            icon={Ticket} 
            trend={5}
            iconClassName="bg-blue-100/50"
          />
          <StatsCard 
            title="En espera" 
            value={mockQueueStats.reduce((acc, q) => acc + q.waitingCount, 0)} 
            icon={Clock} 
            iconClassName="bg-purple-100/50"
          />
          <StatsCard 
            title="Atendidos hoy" 
            value={37} 
            icon={CheckCheck} 
            iconClassName="bg-green-100/50"
          />
          <StatsCard 
            title="Ventanillas activas" 
            value={2} 
            icon={Users} 
            iconClassName="bg-amber-100/50"
          />
        </div>
      </div>

      {/* Queue stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Estado de las Colas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {mockQueueStats.map((queue) => (
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
          ))}
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

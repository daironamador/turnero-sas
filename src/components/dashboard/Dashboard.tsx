
import React from 'react';
import { Calendar, Users, CheckCheck, AlertCircle, Clock, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardStats, ServiceType, ServiceTypeLabels } from '@/lib/types';
import StatsCard from './StatsCard';
import AppointmentCard from '../appointments/AppointmentCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data for demonstration
const mockStats: DashboardStats = {
  todayAppointments: 8,
  upcomingAppointments: 24,
  completedToday: 5,
  cancelledToday: 1,
  newPatientsToday: 2,
};

// Mock active queues data
const mockQueueStats = [
  { serviceType: 'CG' as ServiceType, waitingCount: 4, inService: 1 },
  { serviceType: 'RX' as ServiceType, waitingCount: 2, inService: 1 },
  { serviceType: 'RR' as ServiceType, waitingCount: 3, inService: 0 },
  { serviceType: 'EX' as ServiceType, waitingCount: 1, inService: 0 },
  { serviceType: 'OT' as ServiceType, waitingCount: 0, inService: 0 },
];

const mockAppointmentsToday = [
  {
    id: '1',
    patientId: '101',
    patient: {
      id: '101',
      firstName: 'Ana',
      lastName: 'González',
      email: 'ana@example.com',
      phone: '555-123-4567',
      birthDate: new Date(1985, 5, 15),
      recordNumber: 'OCL-1001',
      createdAt: new Date(),
    },
    date: new Date(),
    time: '09:00',
    duration: 30,
    status: 'scheduled' as const,
    type: 'consultation' as const,
    createdAt: new Date(),
  },
  {
    id: '2',
    patientId: '102',
    patient: {
      id: '102',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos@example.com',
      phone: '555-987-6543',
      birthDate: new Date(1972, 8, 21),
      recordNumber: 'OCL-1002',
      createdAt: new Date(),
    },
    date: new Date(),
    time: '10:30',
    duration: 45,
    status: 'scheduled' as const,
    type: 'examination' as const,
    createdAt: new Date(),
  },
  {
    id: '3',
    patientId: '103',
    patient: {
      id: '103',
      firstName: 'María',
      lastName: 'Rodríguez',
      email: 'maria@example.com',
      phone: '555-456-7890',
      birthDate: new Date(1990, 3, 10),
      recordNumber: 'OCL-1003',
      createdAt: new Date(),
    },
    date: new Date(),
    time: '11:45',
    duration: 30,
    status: 'scheduled' as const,
    type: 'follow-up' as const,
    createdAt: new Date(),
  },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, dd 'de' MMMM, yyyy");
  
  const onStatusChange = (id: string, status: string) => {
    console.log(`Appointment ${id} status changed to ${status}`);
    // In a real app, this would update the appointment status
  };

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
            onClick={() => navigate('/tickets/generate')}
          >
            <Ticket className="w-4 h-4 mr-2" />
            Generar Ticket
          </Button>
          <Button 
            size="sm" 
            className="bg-ocular-600 hover:bg-ocular-700 text-white"
            onClick={() => navigate('/display')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Ver Pantalla
          </Button>
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

      {/* General statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Tickets hoy" 
          value={mockStats.todayAppointments + 4} 
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
          value={mockStats.completedToday + 12} 
          icon={CheckCheck} 
          iconClassName="bg-green-100/50"
        />
        <StatsCard 
          title="Cancelados hoy" 
          value={mockStats.cancelledToday} 
          icon={AlertCircle} 
          iconClassName="bg-red-100/50"
        />
        <StatsCard 
          title="Ventanillas activas" 
          value={2} 
          icon={Users} 
          iconClassName="bg-amber-100/50"
        />
      </div>

      {/* Recent activity section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Próximos turnos de hoy</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/appointments')}
          >
            Ver todos
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockAppointmentsToday.map((appointment) => (
            <AppointmentCard 
              key={appointment.id} 
              appointment={appointment} 
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

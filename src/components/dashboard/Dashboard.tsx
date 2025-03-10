
import React from 'react';
import { Calendar, Users, CheckCheck, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardStats } from '@/lib/types';
import StatsCard from './StatsCard';
import AppointmentCard from '../appointments/AppointmentCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Mock data for demonstration
const mockStats: DashboardStats = {
  todayAppointments: 8,
  upcomingAppointments: 24,
  completedToday: 5,
  cancelledToday: 1,
  newPatientsToday: 2,
};

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
        <Button 
          size="sm" 
          className="bg-ocular-600 hover:bg-ocular-700 text-white"
          onClick={() => navigate('/appointments/new')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Nuevo turno
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Turnos hoy" 
          value={mockStats.todayAppointments} 
          icon={Calendar} 
          trend={5}
          iconClassName="bg-blue-100/50"
        />
        <StatsCard 
          title="Turnos pendientes" 
          value={mockStats.upcomingAppointments} 
          icon={Clock} 
          iconClassName="bg-purple-100/50"
        />
        <StatsCard 
          title="Completados hoy" 
          value={mockStats.completedToday} 
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
          title="Nuevos pacientes" 
          value={mockStats.newPatientsToday} 
          icon={Users} 
          iconClassName="bg-amber-100/50"
        />
      </div>

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

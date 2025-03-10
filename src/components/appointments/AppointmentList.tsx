
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar, Filter, Plus, Search } from 'lucide-react';
import { Appointment } from '@/lib/types';
import AppointmentCard from './AppointmentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for demonstration
const mockAppointments: Appointment[] = [
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
    status: 'scheduled',
    type: 'consultation',
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
    status: 'scheduled',
    type: 'examination',
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
    status: 'completed',
    type: 'follow-up',
    doctorNotes: 'El paciente muestra mejoría significativa en la visión periférica. Se recomienda continuar con el tratamiento actual.',
    createdAt: new Date(),
  },
  {
    id: '4',
    patientId: '104',
    patient: {
      id: '104',
      firstName: 'Jorge',
      lastName: 'Sánchez',
      email: 'jorge@example.com',
      phone: '555-789-0123',
      birthDate: new Date(1965, 11, 5),
      recordNumber: 'OCL-1004',
      createdAt: new Date(),
    },
    date: new Date(),
    time: '14:15',
    duration: 60,
    status: 'cancelled',
    type: 'surgery',
    createdAt: new Date(),
  },
  {
    id: '5',
    patientId: '105',
    patient: {
      id: '105',
      firstName: 'Lucía',
      lastName: 'Torres',
      email: 'lucia@example.com',
      phone: '555-321-6547',
      birthDate: new Date(1988, 1, 28),
      recordNumber: 'OCL-1005',
      createdAt: new Date(),
    },
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    time: '10:00',
    duration: 30,
    status: 'scheduled',
    type: 'consultation',
    createdAt: new Date(),
  },
  {
    id: '6',
    patientId: '106',
    patient: {
      id: '106',
      firstName: 'Roberto',
      lastName: 'Díaz',
      email: 'roberto@example.com',
      phone: '555-654-9870',
      birthDate: new Date(1979, 6, 12),
      recordNumber: 'OCL-1006',
      createdAt: new Date(),
    },
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    time: '15:30',
    duration: 45,
    status: 'scheduled',
    type: 'examination',
    createdAt: new Date(),
  },
];

const AppointmentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState('all');
  
  const filterAppointments = () => {
    let filtered = [...mockAppointments];
    
    // Filter by tab (date)
    if (selectedTab === 'today') {
      filtered = filtered.filter(
        (apt) => format(apt.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      );
    } else if (selectedTab === 'upcoming') {
      filtered = filtered.filter(
        (apt) => apt.date > new Date() && apt.status === 'scheduled'
      );
    } else if (selectedTab === 'past') {
      filtered = filtered.filter(
        (apt) => apt.date < new Date() || apt.status === 'completed' || apt.status === 'cancelled'
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) => 
          apt.patient?.firstName.toLowerCase().includes(query) ||
          apt.patient?.lastName.toLowerCase().includes(query) ||
          apt.patient?.recordNumber.toLowerCase().includes(query)
      );
    }
    
    // Filter by appointment type
    if (selectedType !== 'all') {
      filtered = filtered.filter((apt) => apt.type === selectedType);
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((apt) => apt.status === selectedStatus);
    }
    
    return filtered;
  };
  
  const filteredAppointments = filterAppointments();
  
  const handleStatusChange = (id: string, status: Appointment['status']) => {
    console.log(`Appointment ${id} status changed to ${status}`);
    // In a real app, this would update the appointment status
  };

  return (
    <div className="space-y-6 animate-slide-down">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Turnos</h1>
        <Button 
          onClick={() => navigate('/appointments/new')}
          className="bg-ocular-600 hover:bg-ocular-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo turno
        </Button>
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="w-full border-b">
          <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
          <TabsTrigger value="today" className="flex-1">Hoy</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1">Próximos</TabsTrigger>
          <TabsTrigger value="past" className="flex-1">Pasados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo de turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="examination">Examen</SelectItem>
                  <SelectItem value="follow-up">Seguimiento</SelectItem>
                  <SelectItem value="surgery">Cirugía</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no-show">No asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron turnos con los filtros actuales.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="today" className="mt-4">
          {/* The content is duplicated in each tab for demonstration purposes */}
          {/* In a real app, we would reuse the same content with different filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo de turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="examination">Examen</SelectItem>
                  <SelectItem value="follow-up">Seguimiento</SelectItem>
                  <SelectItem value="surgery">Cirugía</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no-show">No asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron turnos con los filtros actuales.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-4">
          {/* Same structure as above, but different data */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo de turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="examination">Examen</SelectItem>
                  <SelectItem value="follow-up">Seguimiento</SelectItem>
                  <SelectItem value="surgery">Cirugía</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron turnos con los filtros actuales.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-4">
          {/* Same structure as above, but different data */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no-show">No asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron turnos con los filtros actuales.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppointmentList;

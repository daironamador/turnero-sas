
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Search, Sliders } from 'lucide-react';
import { Patient } from '@/lib/types';
import PatientCard from './PatientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Mock data for demonstration
const mockPatients: Patient[] = [
  {
    id: '101',
    firstName: 'Ana',
    lastName: 'González',
    email: 'ana@example.com',
    phone: '555-123-4567',
    birthDate: new Date(1985, 5, 15),
    recordNumber: 'OCL-1001',
    lastVisit: new Date(2023, 10, 5),
    createdAt: new Date(2022, 5, 10),
  },
  {
    id: '102',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    email: 'carlos@example.com',
    phone: '555-987-6543',
    birthDate: new Date(1972, 8, 21),
    recordNumber: 'OCL-1002',
    lastVisit: new Date(2023, 11, 12),
    createdAt: new Date(2022, 6, 15),
  },
  {
    id: '103',
    firstName: 'María',
    lastName: 'Rodríguez',
    email: 'maria@example.com',
    phone: '555-456-7890',
    birthDate: new Date(1990, 3, 10),
    recordNumber: 'OCL-1003',
    lastVisit: new Date(2023, 11, 28),
    createdAt: new Date(2022, 7, 20),
  },
  {
    id: '104',
    firstName: 'Jorge',
    lastName: 'Sánchez',
    email: 'jorge@example.com',
    phone: '555-789-0123',
    birthDate: new Date(1965, 11, 5),
    recordNumber: 'OCL-1004',
    lastVisit: new Date(2023, 9, 15),
    createdAt: new Date(2022, 8, 5),
  },
  {
    id: '105',
    firstName: 'Lucía',
    lastName: 'Torres',
    email: 'lucia@example.com',
    phone: '555-321-6547',
    birthDate: new Date(1988, 1, 28),
    recordNumber: 'OCL-1005',
    createdAt: new Date(2023, 0, 10),
  },
  {
    id: '106',
    firstName: 'Roberto',
    lastName: 'Díaz',
    email: 'roberto@example.com',
    phone: '555-654-9870',
    birthDate: new Date(1979, 6, 12),
    recordNumber: 'OCL-1006',
    lastVisit: new Date(2023, 10, 20),
    createdAt: new Date(2023, 2, 5),
  },
];

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterVisit, setFilterVisit] = useState('all');
  
  const filterPatients = () => {
    let filtered = [...mockPatients];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (patient) => 
          patient.firstName.toLowerCase().includes(query) ||
          patient.lastName.toLowerCase().includes(query) ||
          patient.recordNumber.toLowerCase().includes(query) ||
          patient.email.toLowerCase().includes(query) ||
          patient.phone.includes(query)
      );
    }
    
    // Filter by last visit
    if (filterVisit === 'visited') {
      filtered = filtered.filter((patient) => patient.lastVisit);
    } else if (filterVisit === 'not-visited') {
      filtered = filtered.filter((patient) => !patient.lastVisit);
    }
    
    // Sort patients
    if (sortBy === 'name') {
      filtered.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortBy === 'last-visit') {
      filtered.sort((a, b) => {
        if (!a.lastVisit && !b.lastVisit) return 0;
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
        return b.lastVisit.getTime() - a.lastVisit.getTime();
      });
    }
    
    return filtered;
  };
  
  const filteredPatients = filterPatients();
  
  const handleScheduleAppointment = (patientId: string) => {
    navigate(`/appointments/new?patientId=${patientId}`);
  };
  
  const handleViewDetails = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  return (
    <div className="space-y-6 animate-slide-down">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
        <Button 
          onClick={() => navigate('/patients/new')}
          className="bg-ocular-600 hover:bg-ocular-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo paciente
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar pacientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <Sliders className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="last-visit">Última visita</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterVisit} onValueChange={setFilterVisit}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por visita" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="visited">Con visitas</SelectItem>
              <SelectItem value="not-visited">Sin visitas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron pacientes con los filtros actuales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              onScheduleAppointment={handleScheduleAppointment}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;

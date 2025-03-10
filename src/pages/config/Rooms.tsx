
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, Edit, Power, FileWarning } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Room, Service } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const mockServices: Service[] = [
  {
    id: '1',
    code: 'CG',
    name: 'Consulta General',
    description: 'Atención oftalmológica general',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '2',
    code: 'RX',
    name: 'Rayos X',
    description: 'Servicio de radiografías',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '3',
    code: 'RR',
    name: 'Recoger Resultados',
    description: 'Entrega de resultados de exámenes',
    isActive: true,
    createdAt: new Date()
  },
];

const mockRooms: Room[] = [
  {
    id: '1',
    number: '101',
    name: 'Consulta 1',
    serviceId: '1',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '2',
    number: '102',
    name: 'Consulta 2',
    serviceId: '1',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '3',
    number: '201',
    name: 'Sala de Rayos X',
    serviceId: '2',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '4',
    number: '301',
    name: 'Recepción de Resultados',
    serviceId: '3',
    isActive: false,
    createdAt: new Date()
  },
];

// Add services to rooms for display
const roomsWithServices = mockRooms.map(room => ({
  ...room,
  service: mockServices.find(s => s.id === room.serviceId)
}));

const RoomForm: React.FC<{
  room?: Room;
  services: Service[];
  onSave: (room: Partial<Room>) => void;
  onCancel: () => void;
}> = ({ room, services, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Room>>(
    room || {
      number: '',
      name: '',
      serviceId: '',
      isActive: true
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Número de Sala</Label>
          <Input
            id="number"
            name="number"
            value={formData.number}
            onChange={handleChange}
            required
            placeholder="Ej: 101"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de Sala</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Consulta 1"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="serviceId">Servicio Asignado</Label>
        <Select
          value={formData.serviceId}
          onValueChange={(value) => 
            setFormData(prev => ({ ...prev, serviceId: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar servicio" />
          </SelectTrigger>
          <SelectContent>
            {services
              .filter(service => service.isActive)
              .map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} ({service.code})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, isActive: checked }))
          }
        />
        <Label htmlFor="isActive">Sala Activa</Label>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {room ? 'Actualizar Sala' : 'Crear Sala'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const Rooms: React.FC = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>(roomsWithServices);
  const [services] = useState<Service[]>(mockServices);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | undefined>(undefined);

  const handleSaveRoom = (roomData: Partial<Room>) => {
    if (currentRoom) {
      // Update existing room
      const updatedRooms = rooms.map(r => {
        if (r.id === currentRoom.id) {
          const updatedRoom = { 
            ...r, 
            ...roomData,
            service: services.find(s => s.id === roomData.serviceId)
          };
          return updatedRoom;
        }
        return r;
      });
      setRooms(updatedRooms);
      toast({
        title: "Sala actualizada",
        description: `Se ha actualizado la sala ${roomData.name}`,
      });
    } else {
      // Create new room
      const newRoom: Room = {
        id: crypto.randomUUID(),
        number: roomData.number || '',
        name: roomData.name || '',
        serviceId: roomData.serviceId || '',
        service: services.find(s => s.id === roomData.serviceId),
        isActive: roomData.isActive !== undefined ? roomData.isActive : true,
        createdAt: new Date(),
      };
      setRooms([...rooms, newRoom]);
      toast({
        title: "Sala creada",
        description: `Se ha creado la sala ${newRoom.name}`,
      });
    }
    setIsDialogOpen(false);
    setCurrentRoom(undefined);
  };

  const toggleRoomStatus = (id: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === id) {
        const newStatus = !room.isActive;
        toast({
          title: newStatus ? "Sala activada" : "Sala desactivada",
          description: `Se ha ${newStatus ? 'activado' : 'desactivado'} la sala ${room.name}`,
        });
        return { ...room, isActive: newStatus };
      }
      return room;
    });
    setRooms(updatedRooms);
  };

  const openEditDialog = (room: Room) => {
    setCurrentRoom(room);
    setIsDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Link 
              to="/config" 
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver a Configuración
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Salas</h1>
            <p className="text-muted-foreground">
              Gestione las salas y asígnelas a los servicios correspondientes
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setCurrentRoom(undefined);
                  setIsDialogOpen(true);
                }}
                className="bg-ocular-600 hover:bg-ocular-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Nueva Sala
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  {currentRoom ? 'Editar Sala' : 'Crear Nueva Sala'}
                </DialogTitle>
                <DialogDescription>
                  {currentRoom
                    ? 'Modifique los datos de la sala existente'
                    : 'Complete los datos para crear una nueva sala'}
                </DialogDescription>
              </DialogHeader>
              
              <RoomForm 
                room={currentRoom}
                services={services}
                onSave={handleSaveRoom}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setCurrentRoom(undefined);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {rooms.length === 0 ? (
          <Card className="border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-center">No hay salas configuradas</p>
              <p className="text-muted-foreground text-center mt-1 mb-4">
                Cree su primera sala para organizar la atención de servicios
              </p>
              <Button
                onClick={() => {
                  setCurrentRoom(undefined);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Crear Sala
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <Card key={room.id} className={`${!room.isActive ? 'opacity-70' : ''} hover:shadow-sm transition-shadow`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{room.name}</span>
                      {!room.isActive && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-500">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(room)}>
                        <Edit className="h-4 w-4 text-ocular-600" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => toggleRoomStatus(room.id)}
                      >
                        <Power className={`h-4 w-4 ${room.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-800">
                        Sala {room.number}
                      </Badge>
                      
                      {room.service && (
                        <Badge className="bg-ocular-100 text-ocular-800 hover:bg-ocular-200">
                          {room.service.code}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Servicio: {room.service?.name || 'No asignado'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Rooms;


import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, Edit, Power, FileWarning, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Service } from '@/lib/types';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";

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

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Administrador',
    email: 'admin@ocularclinic.com',
    role: 'admin',
    isActive: true,
    serviceIds: ['1', '2', '3'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    username: 'recepcion',
    name: 'Recepcionista',
    email: 'recepcion@ocularclinic.com',
    role: 'operator',
    isActive: true,
    serviceIds: ['1', '3'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    username: 'radiologia',
    name: 'Técnico de Radiología',
    email: 'radiologia@ocularclinic.com',
    role: 'operator',
    isActive: false,
    serviceIds: ['2'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
];

// Add services to users for display
const usersWithServices = mockUsers.map(user => ({
  ...user,
  services: mockServices.filter(s => user.serviceIds.includes(s.id))
}));

const UserForm: React.FC<{
  user?: User;
  services: Service[];
  onSave: (user: Partial<User>) => void;
  onCancel: () => void;
}> = ({ user, services, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<User>>(
    user || {
      username: '',
      name: '',
      email: '',
      role: 'operator',
      isActive: true,
      serviceIds: []
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

  const toggleService = (serviceId: string) => {
    setFormData(prev => {
      const currentServiceIds = prev.serviceIds || [];
      const newServiceIds = currentServiceIds.includes(serviceId)
        ? currentServiceIds.filter(id => id !== serviceId)
        : [...currentServiceIds, serviceId];
      
      return {
        ...prev,
        serviceIds: newServiceIds
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Nombre de Usuario</Label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Ej: jperez"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Completo</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Juan Pérez"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="correo@ejemplo.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          value={formData.role}
          onValueChange={(value: 'admin' | 'operator' | 'viewer') => 
            setFormData(prev => ({ ...prev, role: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="operator">Operador</SelectItem>
            <SelectItem value="viewer">Visualizador</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Los administradores tienen acceso a todas las funciones, los operadores pueden gestionar tickets, y los visualizadores solo pueden ver información.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Servicios Asignados</Label>
        <div className="border rounded-md p-4">
          {services
            .filter(service => service.isActive)
            .map(service => (
              <div key={service.id} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`service-${service.id}`}
                  checked={(formData.serviceIds || []).includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                />
                <Label htmlFor={`service-${service.id}`} className="cursor-pointer">
                  {service.name} ({service.code})
                </Label>
              </div>
            ))}
            
          {services.filter(service => service.isActive).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay servicios activos disponibles
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, isActive: checked }))
          }
        />
        <Label htmlFor="isActive">Usuario Activo</Label>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {user ? 'Actualizar Usuario' : 'Crear Usuario'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const Users: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(usersWithServices);
  const [services] = useState<Service[]>(mockServices);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);

  const handleSaveUser = (userData: Partial<User>) => {
    if (currentUser) {
      // Update existing user
      const updatedUsers = users.map(u => {
        if (u.id === currentUser.id) {
          const updatedUser = { 
            ...u, 
            ...userData,
            services: services.filter(s => (userData.serviceIds || []).includes(s.id))
          };
          return updatedUser;
        }
        return u;
      });
      setUsers(updatedUsers);
      toast({
        title: "Usuario actualizado",
        description: `Se ha actualizado el usuario ${userData.name}`,
      });
    } else {
      // Create new user
      const newUser: User = {
        id: crypto.randomUUID(),
        username: userData.username || '',
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'operator',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        serviceIds: userData.serviceIds || [],
        services: services.filter(s => (userData.serviceIds || []).includes(s.id)),
        createdAt: new Date(),
      };
      setUsers([...users, newUser]);
      toast({
        title: "Usuario creado",
        description: `Se ha creado el usuario ${newUser.name}`,
      });
    }
    setIsDialogOpen(false);
    setCurrentUser(undefined);
  };

  const toggleUserStatus = (id: string) => {
    const updatedUsers = users.map(user => {
      if (user.id === id) {
        const newStatus = !user.isActive;
        toast({
          title: newStatus ? "Usuario activado" : "Usuario desactivado",
          description: `Se ha ${newStatus ? 'activado' : 'desactivado'} el usuario ${user.name}`,
        });
        return { ...user, isActive: newStatus };
      }
      return user;
    });
    setUsers(updatedUsers);
  };

  const openEditDialog = (user: User) => {
    setCurrentUser(user);
    setIsDialogOpen(true);
  };

  const getRoleBadge = (role: 'admin' | 'operator' | 'viewer') => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Administrador</Badge>;
      case 'operator':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Operador</Badge>;
      case 'viewer':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Visualizador</Badge>;
      default:
        return null;
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
            <p className="text-muted-foreground">
              Gestione los usuarios y sus permisos en el sistema
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setCurrentUser(undefined);
                  setIsDialogOpen(true);
                }}
                className="bg-ocular-600 hover:bg-ocular-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  {currentUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </DialogTitle>
                <DialogDescription>
                  {currentUser
                    ? 'Modifique los datos del usuario existente'
                    : 'Complete los datos para crear un nuevo usuario'}
                </DialogDescription>
              </DialogHeader>
              
              <UserForm 
                user={currentUser}
                services={services}
                onSave={handleSaveUser}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setCurrentUser(undefined);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {users.length === 0 ? (
          <Card className="border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-center">No hay usuarios configurados</p>
              <p className="text-muted-foreground text-center mt-1 mb-4">
                Cree su primer usuario para comenzar a gestionar el sistema
              </p>
              <Button
                onClick={() => {
                  setCurrentUser(undefined);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Crear Usuario
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <Card key={user.id} className={`${!user.isActive ? 'opacity-70' : ''} hover:shadow-sm transition-shadow`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{user.name}</span>
                      {!user.isActive && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-500">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4 text-ocular-600" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => toggleUserStatus(user.id)}
                      >
                        <Power className={`h-4 w-4 ${user.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                  </div>
                  
                  <p className="text-sm">
                    <span className="text-gray-500">Usuario:</span> {user.username}
                  </p>
                  
                  <p className="text-sm">
                    <span className="text-gray-500">Email:</span> {user.email}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-gray-500 mr-1">Servicios:</span>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 text-xs">
                          <UserCog className="h-3 w-3 mr-1" />
                          {user.services?.length || 0} Servicios
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-2">
                        <div className="text-sm font-medium mb-2">Servicios Asignados</div>
                        {user.services && user.services.length > 0 ? (
                          <ul className="space-y-1">
                            {user.services.map(service => (
                              <li key={service.id} className="text-sm">
                                • {service.name} ({service.code})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Sin servicios asignados
                          </p>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Creado: {format(user.createdAt, "dd/MM/yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Users;

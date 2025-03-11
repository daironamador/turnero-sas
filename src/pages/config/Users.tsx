
import React, { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { supabase, createUser } from '@/lib/supabase';

const UserForm: React.FC<{
  user?: User;
  services: Service[];
  onSave: (user: Partial<User>, password?: string) => void;
  onCancel: () => void;
  isCreating: boolean;
}> = ({ user, services, onSave, onCancel, isCreating }) => {
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePasswords = () => {
    if (isCreating) {
      if (!password) {
        setPasswordError('La contraseña es obligatoria');
        return false;
      }
      if (password.length < 6) {
        setPasswordError('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      if (password !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden');
        return false;
      }
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }
    
    onSave(formData, isCreating ? password : undefined);
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
      
      {isCreating && (
        <>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isCreating}
              placeholder="Contraseña (mínimo 6 caracteres)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={isCreating}
              placeholder="Repita la contraseña"
            />
          </div>
          
          {passwordError && (
            <Alert variant="destructive">
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}
        </>
      )}
      
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
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real users and services from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*');
          
        if (servicesError) {
          throw servicesError;
        }
        
        // Load users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');
          
        if (usersError) {
          throw usersError;
        }
        
        // Transform users data to match our User type
        const transformedUsers = usersData.map(user => ({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          serviceIds: user.service_ids || [],
          services: servicesData.filter(s => (user.service_ids || []).includes(s.id)),
          createdAt: new Date(user.created_at)
        }));
        
        setServices(servicesData);
        setUsers(transformedUsers);
      } catch (error: any) {
        console.error('Error al cargar datos:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleSaveUser = async (userData: Partial<User>, password?: string) => {
    try {
      if (currentUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            username: userData.username,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            is_active: userData.isActive,
            service_ids: userData.serviceIds
          })
          .eq('id', currentUser.id);
          
        if (error) throw error;
        
        // Update local state
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
        // Create new user with auth
        if (!password) {
          throw new Error('Se requiere contraseña para crear un nuevo usuario');
        }
        
        const { user, error, message } = await createUser(
          userData.email || '',
          password,
          {
            name: userData.name,
            username: userData.username,
            role: userData.role,
            serviceIds: userData.serviceIds
          }
        );
        
        if (error) {
          // Special handling for email rate limit error
          if (error.name === 'EmailRateLimit') {
            toast({
              title: "Usuario creado con advertencia",
              description: error.message,
              variant: "warning"
            });
            
            // Get the created user from the database to add to UI
            const { data: newUserData } = await supabase
              .from('users')
              .select('*')
              .eq('email', userData.email)
              .single();
              
            if (newUserData) {
              const newUser: User = {
                id: newUserData.id,
                username: newUserData.username,
                name: newUserData.name,
                email: newUserData.email,
                role: newUserData.role as 'admin' | 'operator' | 'viewer',
                isActive: newUserData.is_active,
                serviceIds: newUserData.service_ids || [],
                services: services.filter(s => (newUserData.service_ids || []).includes(s.id)),
                createdAt: new Date(newUserData.created_at),
              };
              
              setUsers([...users, newUser]);
              setIsDialogOpen(false);
              setCurrentUser(undefined);
              return;
            }
          } else {
            throw error;
          }
        }
        
        if (user) {
          // Add to local state
          const newUser: User = {
            id: user.id,
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
            description: message || `Se ha creado el usuario ${newUser.name}`,
          });
        }
      }
      
      setIsDialogOpen(false);
      setCurrentUser(undefined);
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) return;
      
      const newStatus = !user.isActive;
      
      // Update in database
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update in local state
      const updatedUsers = users.map(user => {
        if (user.id === id) {
          toast({
            title: newStatus ? "Usuario activado" : "Usuario desactivado",
            description: `Se ha ${newStatus ? 'activado' : 'desactivado'} el usuario ${user.name}`,
          });
          return { ...user, isActive: newStatus };
        }
        return user;
      });
      
      setUsers(updatedUsers);
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
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
                isCreating={!currentUser}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocular-600"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : users.length === 0 ? (
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

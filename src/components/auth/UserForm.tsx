
import React, { useState } from 'react';
import { User, Service } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface UserFormProps {
  user?: User;
  services: Service[];
  onSave: (user: Partial<User>, password?: string) => void;
  onCancel: () => void;
  isCreating: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  services, 
  onSave, 
  onCancel, 
  isCreating 
}) => {
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

export default UserForm;

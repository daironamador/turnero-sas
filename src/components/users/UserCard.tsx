
import React from 'react';
import { format } from 'date-fns';
import { Edit, Power, UserCog } from 'lucide-react';
import { User, Service } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onToggleStatus: (id: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onToggleStatus }) => {
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
    <Card className={`${!user.isActive ? 'opacity-70' : ''} hover:shadow-sm transition-shadow`}>
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
            <Button size="icon" variant="ghost" onClick={() => onEdit(user)}>
              <Edit className="h-4 w-4 text-ocular-600" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onToggleStatus(user.id)}
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
  );
};

export default UserCard;

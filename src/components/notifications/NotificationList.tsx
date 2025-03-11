
import React from 'react';
import { Notification } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, EyeOff, Image, YoutubeIcon, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onEdit: (notification: Notification) => void;
  onDelete: (id: string) => void;
  onToggleActive: (notification: Notification) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocular-600"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No hay notificaciones configuradas. Cree una nueva para comenzar.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'youtube':
        return <YoutubeIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notifications.map((notification) => (
        <Card key={notification.id} className="overflow-hidden">
          <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getTypeIcon(notification.type)}
                  <h3 className="font-semibold text-lg line-clamp-1">{notification.title}</h3>
                </div>
                <Badge variant={notification.active ? "default" : "outline"}>
                  {notification.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onToggleActive(notification)}
                  title={notification.active ? "Desactivar" : "Activar"}
                >
                  {notification.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEdit(notification)}
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDelete(notification.id)}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-1 text-sm text-muted-foreground">
              {notification.type === 'text' && (
                <p className="line-clamp-3">{notification.content}</p>
              )}
              {notification.type === 'image' && notification.imageUrl && (
                <div className="aspect-video relative overflow-hidden rounded-md bg-muted mb-2">
                  <img 
                    src={notification.imageUrl} 
                    alt={notification.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              {notification.type === 'youtube' && (
                <div className="text-sm truncate mb-2">
                  {notification.youtubeUrl}
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-2 flex justify-between text-xs text-muted-foreground">
              <span>Intervalo: {notification.intervalInSeconds} segundos</span>
              <span>
                {formatDistanceToNow(notification.createdAt, { 
                  addSuffix: true,
                  locale: es 
                })}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default NotificationList;

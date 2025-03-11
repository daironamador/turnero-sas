
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import NotificationList from './NotificationList';
import NotificationDialog from './NotificationDialog';
import { getNotifications, createNotification, updateNotification, deleteNotification } from '@/services/notificationService';
import { Notification } from '@/lib/types';
import { toast } from 'sonner';

const NotificationManager: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  
  const queryClient = useQueryClient();
  
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications
  });
  
  const createMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificación creada correctamente');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error al crear notificación: ${error.message}`);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Omit<Notification, 'id' | 'createdAt'>> }) => 
      updateNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificación actualizada correctamente');
      setIsDialogOpen(false);
      setEditingNotification(null);
    },
    onError: (error) => {
      toast.error(`Error al actualizar notificación: ${error.message}`);
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificación eliminada correctamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar notificación: ${error.message}`);
    }
  });
  
  const handleCreateOrUpdate = (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    if (editingNotification) {
      updateMutation.mutate({ id: editingNotification.id, data: notificationData });
    } else {
      createMutation.mutate(notificationData);
    }
  };
  
  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta notificación?')) {
      deleteMutation.mutate(id);
    }
  };
  
  const handleToggleActive = (notification: Notification) => {
    updateMutation.mutate({ 
      id: notification.id, 
      data: { active: !notification.active }
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Listado de Notificaciones</h2>
          <p className="text-muted-foreground">
            {notificationsQuery.data?.length || 0} notificaciones configuradas
          </p>
        </div>
        
        <Button onClick={() => {
          setEditingNotification(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Notificación
        </Button>
      </div>
      
      <NotificationList 
        notifications={notificationsQuery.data || []}
        isLoading={notificationsQuery.isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />
      
      <NotificationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        notification={editingNotification}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default NotificationManager;

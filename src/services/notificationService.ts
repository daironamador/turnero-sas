
import { supabase } from '@/integrations/supabase/client';
import { Notification, NotificationType } from '@/lib/types';

export const getNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }

  return data.map((notification) => ({
    id: notification.id,
    title: notification.title,
    content: notification.content,
    type: notification.type as NotificationType,
    imageUrl: notification.image_url,
    youtubeUrl: notification.youtube_url,
    active: notification.active,
    intervalInSeconds: notification.interval_in_seconds,
    createdAt: new Date(notification.created_at),
  }));
};

export const getActiveNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener notificaciones activas:', error);
    throw error;
  }

  return data.map((notification) => ({
    id: notification.id,
    title: notification.title,
    content: notification.content,
    type: notification.type as NotificationType,
    imageUrl: notification.image_url,
    youtubeUrl: notification.youtube_url,
    active: notification.active,
    intervalInSeconds: notification.interval_in_seconds,
    createdAt: new Date(notification.created_at),
  }));
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        title: notification.title,
        content: notification.content,
        type: notification.type,
        image_url: notification.imageUrl,
        youtube_url: notification.youtubeUrl,
        active: notification.active,
        interval_in_seconds: notification.intervalInSeconds,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    type: data.type as NotificationType,
    imageUrl: data.image_url,
    youtubeUrl: data.youtube_url,
    active: data.active,
    intervalInSeconds: data.interval_in_seconds,
    createdAt: new Date(data.created_at),
  };
};

export const updateNotification = async (id: string, notification: Partial<Omit<Notification, 'id' | 'createdAt'>>): Promise<void> => {
  const updateData: Record<string, any> = {};
  
  if (notification.title !== undefined) updateData.title = notification.title;
  if (notification.content !== undefined) updateData.content = notification.content;
  if (notification.type !== undefined) updateData.type = notification.type;
  if (notification.imageUrl !== undefined) updateData.image_url = notification.imageUrl;
  if (notification.youtubeUrl !== undefined) updateData.youtube_url = notification.youtubeUrl;
  if (notification.active !== undefined) updateData.active = notification.active;
  if (notification.intervalInSeconds !== undefined) updateData.interval_in_seconds = notification.intervalInSeconds;

  const { error } = await supabase
    .from('notifications')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar notificación:', error);
    throw error;
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar notificación:', error);
    throw error;
  }
};

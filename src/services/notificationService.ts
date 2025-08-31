
import { initializeFirebase } from '@/lib/firebase';
import { Notification, NotificationType } from '@/lib/types';

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, collection, getDocs, orderBy, query } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(notificationsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        type: data.type as NotificationType,
        imageUrl: data.image_url,
        youtubeUrl: data.youtube_url,
        active: data.active,
        intervalInSeconds: data.interval_in_seconds,
        createdAt: new Date(data.created_at),
      };
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};

export const getActiveNotifications = async (): Promise<Notification[]> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('active', '==', true),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(notificationsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        type: data.type as NotificationType,
        imageUrl: data.image_url,
        youtubeUrl: data.youtube_url,
        active: data.active,
        intervalInSeconds: data.interval_in_seconds,
        createdAt: new Date(data.created_at),
      };
    });
  } catch (error) {
    console.error('Error al obtener notificaciones activas:', error);
    throw error;
  }
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, collection, addDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    const now = new Date().toISOString();
    
    const docRef = await addDoc(collection(db, 'notifications'), {
      title: notification.title,
      content: notification.content,
      type: notification.type,
      image_url: notification.imageUrl,
      youtube_url: notification.youtubeUrl,
      active: notification.active,
      interval_in_seconds: notification.intervalInSeconds,
      created_at: now
    });
    
    return {
      id: docRef.id,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      imageUrl: notification.imageUrl,
      youtubeUrl: notification.youtubeUrl,
      active: notification.active,
      intervalInSeconds: notification.intervalInSeconds,
      createdAt: new Date(now),
    };
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

export const updateNotification = async (id: string, notification: Partial<Omit<Notification, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    const updateData: Record<string, string | number | boolean> = {};
    
    if (notification.title !== undefined) updateData.title = notification.title;
    if (notification.content !== undefined) updateData.content = notification.content;
    if (notification.type !== undefined) updateData.type = notification.type;
    if (notification.imageUrl !== undefined) updateData.image_url = notification.imageUrl;
    if (notification.youtubeUrl !== undefined) updateData.youtube_url = notification.youtubeUrl;
    if (notification.active !== undefined) updateData.active = notification.active;
    if (notification.intervalInSeconds !== undefined) updateData.interval_in_seconds = notification.intervalInSeconds;
    
    await updateDoc(doc(db, 'notifications', id), updateData);
  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    throw error;
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, deleteDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    await deleteDoc(doc(db, 'notifications', id));
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    throw error;
  }
};

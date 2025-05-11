
import { initializeFirebase } from '@/lib/firebase';
import { Room } from '@/lib/types';

export const fetchRoomsWithServices = async () => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Get rooms
    const roomsRef = collection(db, 'rooms');
    const roomsSnapshot = await getDocs(roomsRef);
    
    // Get services (to join with rooms)
    const servicesRef = collection(db, 'services');
    const servicesSnapshot = await getDocs(servicesRef);
    
    // Create services map
    const servicesMap = new Map();
    servicesSnapshot.forEach(doc => {
      servicesMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    // Join rooms with services
    return roomsSnapshot.docs.map(doc => {
      const roomData = doc.data();
      const service = servicesMap.get(roomData.service_id);
      
      return {
        id: doc.id,
        number: roomData.number,
        name: roomData.name,
        serviceId: roomData.service_id,
        isActive: roomData.is_active,
        createdAt: new Date(roomData.created_at),
        service: service || { id: roomData.service_id, code: 'unknown', name: 'Unknown Service' }
      };
    }).filter((room: Room & { service: any, isActive: boolean }) => room.isActive);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }
};

export const fetchActiveServices = async () => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    const servicesRef = collection(db, 'services');
    const servicesQuery = query(
      servicesRef,
      where('is_active', '==', true)
    );
    
    const snapshot = await getDocs(servicesQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.is_active,
        createdAt: new Date(data.created_at)
      };
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
};


import { useState, useEffect } from 'react';
import { initializeFirebase } from '@/lib/firebase';

export const useRooms = () => {
  const [rooms, setRooms] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const app = await initializeFirebase();
        
        if (!app) {
          throw new Error('Firebase not configured');
        }
        
        const { getFirestore, collection, getDocs } = await import('firebase/firestore');
        const db = getFirestore(app);
        
        const roomsRef = collection(db, 'rooms');
        const snapshot = await getDocs(roomsRef);
        
        const roomsMap: {[key: string]: string} = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          roomsMap[doc.id] = `${data.number} - ${data.name}`;
        });
        
        setRooms(roomsMap);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, []);
  
  const getRoomDisplay = (counterNumber: string | null) => {
    if (!counterNumber) return '-';
    
    if (counterNumber.includes('-')) {
      return rooms[counterNumber] || counterNumber;
    }
    
    return counterNumber;
  };
  
  return {
    rooms,
    loading,
    getRoomDisplay
  };
};

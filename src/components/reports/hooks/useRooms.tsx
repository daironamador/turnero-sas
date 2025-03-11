
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useRooms = () => {
  const [rooms, setRooms] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('id, name, number');
        
        if (!error && data) {
          const roomsMap: {[key: string]: string} = {};
          data.forEach(room => {
            roomsMap[room.id] = `${room.number} - ${room.name}`;
          });
          setRooms(roomsMap);
        }
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

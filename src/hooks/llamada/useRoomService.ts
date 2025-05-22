
import { supabase } from '@/lib/supabase';
import { Room } from '@/lib/types';

export const fetchRoomsWithServices = async () => {
  try {
    // Get rooms with joined services
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select(`
        id,
        number,
        name,
        service_id,
        is_active,
        created_at,
        services:service_id (
          id,
          code,
          name,
          description,
          is_active,
          created_at
        )
      `);
    
    if (roomsError) {
      console.error("Error fetching rooms:", roomsError);
      return [];
    }
    
    // Transform the data to match the expected format
    return rooms
      .map((room: any) => ({
        id: room.id,
        number: room.number,
        name: room.name,
        serviceId: room.service_id,
        isActive: room.is_active,
        createdAt: new Date(room.created_at),
        service: room.services || { 
          id: room.service_id, 
          code: 'unknown', 
          name: 'Unknown Service' 
        }
      }))
      .filter((room: Room & { service: any, isActive: boolean }) => room.isActive);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }
};

export const fetchActiveServices = async () => {
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error("Error fetching services:", error);
      return [];
    }
    
    return services.map(service => ({
      id: service.id,
      code: service.code,
      name: service.name,
      description: service.description,
      isActive: service.is_active,
      createdAt: new Date(service.created_at)
    }));
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
};

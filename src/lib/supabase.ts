
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Real-time subscription setup
export const setupRealtimeSubscriptions = () => {
  // Subscribe to tickets table
  const ticketsSubscription = supabase
    .channel('tickets-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tickets' }, 
      payload => {
        console.log('Tickets change received!', payload);
        // We'll dispatch events that components will listen to
        window.dispatchEvent(new CustomEvent('tickets-updated', { detail: payload }));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(ticketsSubscription);
  };
};


import { createClient } from '@supabase/supabase-js';

// Supabase setup with persistent session storage
const supabaseUrl = 'https://ymiohanwjypzkhjrtqlf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaW9oYW53anlwemtoanJ0cWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NzQ4MTksImV4cCI6MjA1NzE1MDgxOX0.ELDyIr-4-YPmciAtSAguD7HmdW31SgSkGchLpeIHqFI';

// Create a singleton instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
    detectSessionInUrl: false
  }
});

// Export the singleton instance
export default supabase;

// For backward compatibility
export const initSupabase = () => {
  console.warn('initSupabase() is deprecated, use the default export instead');
  return supabase;
};

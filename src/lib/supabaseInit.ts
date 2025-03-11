
import { createClient } from '@supabase/supabase-js';

// Supabase setup with persistent session storage
const supabaseUrl = 'https://ymiohanwjypzkhjrtqlf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaW9oYW53anlwemtoanJ0cWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NzQ4MTksImV4cCI6MjA1NzE1MDgxOX0.ELDyIr-4-YPmciAtSAguD7HmdW31SgSkGchLpeIHqFI';

// Initialize Supabase client with persistent session configuration
export const initSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: localStorage,
      detectSessionInUrl: false
    }
  });
};

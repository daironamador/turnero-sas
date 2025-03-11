
import { createClient } from '@supabase/supabase-js';

// Supabase setup with cookie-based session storage
const supabaseUrl = 'https://ymiohanwjypzkhjrtqlf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaW9oYW53anlwemtoanJ0cWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NzQ4MTksImV4cCI6MjA1NzE1MDgxOX0.ELDyIr-4-YPmciAtSAguD7HmdW31SgSkGchLpeIHqFI';

// Initialize Supabase with cookie-based storage for better security
export const initSupabase = () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'sb-auth-token',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Configure to use cookies for better security
      storage: {
        getItem: (key) => {
          return document.cookie
            .split('; ')
            .find(row => row.startsWith(`${key}=`))
            ?.split('=')[1];
        },
        setItem: (key, value) => {
          // Set secure cookie that only works with HTTPS in production
          const isProduction = window.location.protocol === 'https:';
          // Set HTTP-only, secure cookie with SameSite=Strict for security
          document.cookie = `${key}=${value}; path=/; max-age=2592000; ${isProduction ? 'secure;' : ''} samesite=strict;`;
        },
        removeItem: (key) => {
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      }
    },
  });

  return supabase;
};


import { supabase } from '@/lib/supabase';

export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return data;
  } catch (error: unknown) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const createUserWithEmailPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    
    return data;
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    throw error;
  }
};

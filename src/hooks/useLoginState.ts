
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithEmailPassword } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { CompanySettings } from '@/lib/types';
import { Database } from '@/lib/database.types';

// Create a custom hook for fetching company settings from Supabase
const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .single();
        
        if (error) {
          console.error('Error loading settings:', error);
          return;
        }
        
        if (data) {
          // Convert database row to CompanySettings type
          const companySettings: CompanySettings = {
            id: data.id,
            name: data.name,
            address: data.address,
            phone: data.phone,
            email: data.email,
            logo: data.logo || undefined,
            ticketFooter: data.ticket_footer || undefined,
            displayMessage: data.display_message || undefined
          };
          setSettings(companySettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  return settings;
};

export const useLoginState = () => {
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true); // Default to true
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const settings = useCompanySettings();
  
  const from = location.state?.from || '/';

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      console.log('Login: Checking for existing session...');
      setSessionLoading(true);
      
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log('Login: Active session found, redirecting to:', from);
          navigate(from, { replace: true });
        } else {
          console.log('Login: No active session, showing login form');
        }
      } catch (error) {
        console.error('Login: Error checking session:', error);
      } finally {
        setSessionLoading(false);
      }
    };
    
    checkSession();
  }, [navigate, from]);

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Por favor ingrese correo electrónico y contraseña');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Intentando iniciar sesión con: ${email}`);
      
      await signInWithEmailPassword(email, password);
      await refreshUser(); // Make sure we refresh the user info
      navigate(from, { replace: true });
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sessionLoading,
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    settings,
    rememberMe,
    setRememberMe,
    handleLogin
  };
};

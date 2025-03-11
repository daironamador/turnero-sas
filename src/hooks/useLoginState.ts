
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { getCompanySettings } from '@/services/settingsService';
import { CompanySettings } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export const useLoginState = () => {
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [rememberMe, setRememberMe] = useState(true); // Default to true
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  
  const from = location.state?.from || '/';

  // Load company settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getCompanySettings();
        setSettings(data);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    };
    
    loadSettings();
  }, []);

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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
        // No need to specify options here as persistence is configured globally in supabaseInit.ts
      });
      
      if (error) {
        console.log('Error de autenticación:', error.message);
        throw error;
      }
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema",
      });
      
      await refreshUser(); // Make sure we refresh the user info
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Error al iniciar sesión');
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

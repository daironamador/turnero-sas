
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCompanySettings } from '@/services/settingsService';
import { CompanySettings } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthTokens, storeAuthTokens } from '@/lib/authUtils';

export const useLoginState = () => {
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setPersistence, refreshUser } = useAuth();
  
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
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          console.log('Login: Active session found, redirecting to:', from);
          navigate(from, { replace: true });
          return;
        }
        
        console.log('Login: No active session, checking localStorage...');
        // Check localStorage for tokens
        const { accessToken, refreshToken } = getAuthTokens();
        
        if (accessToken && refreshToken) {
          console.log('Login: Found stored tokens, attempting to restore');
          const success = await refreshUser();
          
          if (success) {
            console.log('Login: Session restored successfully, redirecting to:', from);
            navigate(from, { replace: true });
            return;
          } else {
            console.log('Login: Failed to restore session, showing login form');
          }
        } else {
          console.log('Login: No stored tokens found, showing login form');
        }
      } catch (error) {
        console.error('Login: Error checking session:', error);
      } finally {
        setSessionLoading(false);
      }
    };
    
    checkSession();
  }, [navigate, from, refreshUser]);

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
      });
      
      // Set persistence based on user preference
      setPersistence(rememberMe);
      
      if (error) {
        console.log('Error de autenticación:', error.message);
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        
        if (!userError && userData && userData.is_active) {
          console.log('El usuario existe en la tabla pero no en auth, intentando registrarlo');
          
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: userData.name,
                username: userData.username,
                role: userData.role,
                service_ids: userData.service_ids || []
              }
            }
          });
          
          if (signUpError) {
            if (signUpError.message.includes('email rate limit')) {
              toast({
                title: "Advertencia de autenticación",
                description: "Hay un problema temporal con la verificación, pero puede continuar usando el sistema.",
                variant: "default"
              });
              
              setPersistence(rememberMe);
              
              navigate(from, { replace: true });
              return;
            }
            throw signUpError;
          }
          
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (retryError) {
            throw retryError;
          }
          
          setPersistence(rememberMe);
          
          toast({
            title: "Inicio de sesión exitoso",
            description: "Bienvenido al sistema",
          });
          
          // Store tokens after successful login
          if (retryData && retryData.session) {
            storeAuthTokens(
              retryData.session.access_token, 
              retryData.session.refresh_token
            );
          }
          
          navigate(from, { replace: true });
          return;
        }
        
        throw error;
      }
      
      setPersistence(rememberMe);
      
      // Store tokens explicitly in localStorage
      if (data && data.session) {
        storeAuthTokens(
          data.session.access_token,
          data.session.refresh_token
        );
      }
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema",
      });
      
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


import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCompanySettings } from '@/services/settingsService';
import { CompanySettings } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { initializeFirebase } from '@/lib/firebase';

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
  const { user, signIn, refreshUser } = useAuth();
  
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
        const app = await initializeFirebase();
        
        if (!app) {
          setSessionLoading(false);
          return;
        }

        const { getAuth } = await import('firebase/auth');
        const auth = getAuth(app);
        
        if (auth.currentUser) {
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
      
      await signIn(email, password);
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

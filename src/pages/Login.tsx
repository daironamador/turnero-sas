
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getCompanySettings } from '@/services/settingsService';
import { CompanySettings } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
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
  
  // Get the return URL from location state (if available)
  const from = location.state?.from || '/';

  // Cargar configuración de la empresa para mostrar el logo
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

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      console.log('Login: Checking for existing session...');
      setSessionLoading(true);
      
      try {
        // First try supabase session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          console.log('Login: Active session found, redirecting to:', from);
          navigate(from, { replace: true });
          return;
        }
        
        // No active session, try to restore from localStorage
        console.log('Login: No active session, checking localStorage...');
        const storedSession = localStorage.getItem('supabase-auth-session');
        
        if (storedSession) {
          console.log('Login: Found stored session, attempting to restore');
          const restored = await refreshUser();
          
          if (restored) {
            console.log('Login: Session restored successfully, redirecting to:', from);
            navigate(from, { replace: true });
            return;
          } else {
            console.log('Login: Failed to restore session, showing login form');
          }
        } else {
          console.log('Login: No stored session found, showing login form');
        }
      } catch (error) {
        console.error('Login: Error checking session:', error);
      } finally {
        setSessionLoading(false);
      }
    };
    
    checkSession();
  }, [navigate, from, refreshUser]);

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
      
      // Sign in with Supabase Auth (prioritize Auth)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // Apply the remember me setting to control persistence beyond browser session
      setPersistence(rememberMe);
      
      // If there's an auth error
      if (error) {
        console.log('Error de autenticación:', error.message);
        
        // Check if user exists in the users table but not in auth
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        
        if (!userError && userData && userData.is_active) {
          console.log('El usuario existe en la tabla pero no en auth, intentando registrarlo');
          
          // Try to create user in auth
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
              // Inform user about the situation and allow them to continue
              toast({
                title: "Advertencia de autenticación",
                description: "Hay un problema temporal con la verificación, pero puede continuar usando el sistema.",
                variant: "default"
              });
              
              // Apply the remember me setting
              setPersistence(rememberMe);
              
              navigate(from, { replace: true });
              return;
            }
            throw signUpError;
          }
          
          // Try to sign in again
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (retryError) {
            throw retryError;
          }
          
          // Apply the remember me setting
          setPersistence(rememberMe);
          
          toast({
            title: "Inicio de sesión exitoso",
            description: "Bienvenido al sistema",
          });
          
          navigate(from, { replace: true });
          return;
        }
        
        throw error;
      }
      
      // Apply the remember me setting
      setPersistence(rememberMe);
      
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

  // If still checking session, show loading spinner
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocular-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            {settings?.logo ? (
              <img 
                src={settings.logo} 
                alt={settings?.name || 'Logo'} 
                className="h-20 object-contain" 
              />
            ) : (
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">CO</span>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl text-center font-bold">
            {settings?.name || 'Sistema de Gestión de Turnos'}
          </CardTitle>
          <CardDescription className="text-center">
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com" 
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rememberMe" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                Permanecer conectado incluso si cierra el navegador
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-ocular-600 hover:bg-ocular-700" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;

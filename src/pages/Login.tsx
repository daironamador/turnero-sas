
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getCompanySettings } from '@/services/settingsService';
import { CompanySettings } from '@/lib/types';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      
      // Intentar inicio de sesión directamente con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // Si hay un error de autenticación
      if (error) {
        // Verificar si el usuario existe en la tabla users pero no en auth
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        
        if (!userError && userData && userData.is_active) {
          console.log('El usuario existe en la tabla pero no en auth, intentando registrarlo');
          
          // Intentar crear el usuario en auth
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
              // Informar al usuario sobre la situación y permitir continuar
              toast({
                title: "Advertencia de autenticación",
                description: "Hay un problema temporal con la verificación, pero puede continuar usando el sistema.",
                variant: "default"
              });
              navigate('/');
              return;
            }
            throw signUpError;
          }
          
          // Intentar iniciar sesión nuevamente
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (retryError) {
            throw retryError;
          }
          
          toast({
            title: "Inicio de sesión exitoso",
            description: "Bienvenido al sistema",
          });
          
          navigate('/');
          return;
        }
        
        throw error;
      }
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

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

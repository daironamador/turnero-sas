
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
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast: uiToast } = useToast();
  const { setSession, user } = useAuth();
  
  // Get the return URL from location state (if available)
  const from = location.state?.from || '/';

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(from);
    }
  }, [user, navigate, from]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Por favor ingrese correo electrónico y contraseña');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Intentando iniciar sesión con: ${email}, mantener sesión: ${stayLoggedIn}`);
      
      // Set up session storage type based on user preference
      if (!stayLoggedIn) {
        // Use 'memory' storage for non-persistent sessions
        supabase.auth.setAuth({ persistSession: false });
        console.log('Using memory storage for session (will not persist)');
      } else {
        // Use 'local' storage for persistent sessions
        console.log('Using local storage for session (will persist)');
      }
      
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // If there's an auth error
      if (error) {
        console.log('Error de autenticación:', error.message);
        throw error;
      }
      
      toast("Inicio de sesión exitoso. Bienvenido al sistema");
      
      // Ensure session is properly set before navigating
      if (data.session) {
        setSession(data.session);
      }
      
      navigate(from);
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
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="stayLoggedIn" 
                checked={stayLoggedIn} 
                onCheckedChange={(checked) => setStayLoggedIn(checked === true)}
              />
              <Label htmlFor="stayLoggedIn" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Permanecer logueado
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

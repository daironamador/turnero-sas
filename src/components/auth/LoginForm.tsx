
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CompanySettings } from '@/lib/types';

interface LoginFormProps {
  loading: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  error: string | null;
  rememberMe: boolean;
  setRememberMe: (checked: boolean) => void;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  settings: CompanySettings | null;
}

const LoginForm: React.FC<LoginFormProps> = ({
  loading,
  email,
  setEmail,
  password,
  setPassword,
  error,
  rememberMe,
  setRememberMe,
  handleLogin,
  settings
}) => {
  return (
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
              <span className="text-2xl font-bold text-gray-500">TA</span>
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
              checked={true}
              disabled={true}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal cursor-default text-gray-500">
              Sesión persistente (siempre activa)
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
  );
};

export default LoginForm;

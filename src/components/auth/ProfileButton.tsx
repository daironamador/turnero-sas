
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ProfileButton = () => {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const [userInitial, setUserInitial] = useState('U');

  useEffect(() => {
    if (user?.email) {
      setUserInitial(user.email.charAt(0).toUpperCase());
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      console.log('Signing out user');
      await signOut();
      toast("Ha cerrado sesión correctamente");
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast("No se pudo cerrar la sesión");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full bg-ocular-100 text-ocular-700"
        >
          {userInitial}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Rol: {userRole === 'admin' ? 'Administrador' : 
               userRole === 'operator' ? 'Operador' : 'Visualizador'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/perfil')}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/config')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileButton;

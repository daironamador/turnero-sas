
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Users, Ticket, Home } from 'lucide-react';
import OcularLogo from '@/components/ui-components/OcularLogo';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  return (
    <header className="border-b border-border bg-background">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <OcularLogo />
            <span className="font-semibold">OcularClinic</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Link
            to="/"
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-ocular-600",
              isActive('/') 
                ? "text-ocular-700 border-b-2 border-ocular-600" 
                : "text-muted-foreground"
            )}
          >
            <Home className="w-4 h-4 mr-2" />
            <span>Inicio</span>
          </Link>
          
          <Link
            to="/tickets"
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-ocular-600",
              isActive('/tickets') 
                ? "text-ocular-700 border-b-2 border-ocular-600" 
                : "text-muted-foreground"
            )}
          >
            <Ticket className="w-4 h-4 mr-2" />
            <span>Tickets</span>
          </Link>
          
          <Link
            to="/appointments"
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-ocular-600",
              isActive('/appointments') 
                ? "text-ocular-700 border-b-2 border-ocular-600" 
                : "text-muted-foreground"
            )}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            <span>Turnos</span>
          </Link>
          
          <Link
            to="/patients"
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-ocular-600",
              isActive('/patients') 
                ? "text-ocular-700 border-b-2 border-ocular-600" 
                : "text-muted-foreground"
            )}
          >
            <Users className="w-4 h-4 mr-2" />
            <span>Pacientes</span>
          </Link>

          <Link
            to="/display"
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-ocular-600 ml-4 text-ocular-600",
              isActive('/display') 
                ? "text-ocular-700 border-b-2 border-ocular-600" 
                : ""
            )}
          >
            <span>Ver Pantalla</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;

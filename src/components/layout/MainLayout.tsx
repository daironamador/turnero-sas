
import React, { useState, useEffect } from 'react';
import { Home, Ticket, PhoneCall, LayoutTemplate, BarChart3, Settings, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ProfileButton from '@/components/auth/ProfileButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getCompanySettings } from '@/services/settingsService';
import { CompanySettings } from '@/lib/types';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getCompanySettings();
        setSettings(data);
      } catch (error) {
        console.error('Error al cargar la configuración:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex-1 flex items-center gap-2">
          {settings?.logo ? (
            <img 
              src={settings.logo} 
              alt="Logo" 
              className="h-8 w-auto object-contain" 
            />
          ) : (
            <h1 className="font-semibold text-lg md:text-xl">
              {settings?.name || 'Sistema de Gestión de Turnos'}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </Link>
            <Link 
              to="/tickets" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/tickets' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-1">
                <Ticket className="h-4 w-4" />
                <span>Tickets</span>
              </div>
            </Link>
            <Link 
              to="/llamada" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/llamada' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-1">
                <PhoneCall className="h-4 w-4" />
                <span>Llamada</span>
              </div>
            </Link>
            <Link 
              to="/display" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/display' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-1">
                <LayoutTemplate className="h-4 w-4" />
                <span>Display</span>
              </div>
            </Link>
            <Link 
              to="/notification" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/notification' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                <span>Notificación</span>
              </div>
            </Link>
            <Link 
              to="/reports" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/reports' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>Reportes</span>
              </div>
            </Link>
            <Link 
              to="/config" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname.includes('/config') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </div>
            </Link>
          </nav>
          
          {/* Mobile menu dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/tickets" className="flex items-center">
                  <Ticket className="mr-2 h-4 w-4" />
                  <span>Tickets</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/llamada" className="flex items-center">
                  <PhoneCall className="mr-2 h-4 w-4" />
                  <span>Llamada</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/display" className="flex items-center">
                  <LayoutTemplate className="mr-2 h-4 w-4" />
                  <span>Display</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/notification" className="flex items-center">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notificación</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/reports" className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Reportes</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/config" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ProfileButton />
        </div>
      </header>

      <main className="p-4">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;

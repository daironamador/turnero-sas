
import React, { useState } from 'react';
import { Menu, X, Home, Ticket, PhoneCall, LayoutTemplate, BarChart3, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ProfileButton from '@/components/auth/ProfileButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-xl">Sistema de Gestión de Turnos</h1>
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
                <Menu className="h-5 w-5" />
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

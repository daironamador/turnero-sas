
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Home, Users } from 'lucide-react';
import OcularLogo from '../ui-components/OcularLogo';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Patients', href: '/patients', icon: Users },
  ];

  return (
    <header className="glass sticky top-0 z-50 w-full px-6 py-3 flex justify-between items-center">
      <OcularLogo />
      
      <nav className="flex items-center space-x-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-muted'
              )}
            >
              <item.icon className={cn('h-4 w-4 mr-2')} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;

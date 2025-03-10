
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, Building, Presentation } from 'lucide-react';

const Config: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Gestione los servicios, salas, usuarios y ajustes de la aplicación</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/config/services">
            <Card className="hover:shadow-md transition-shadow cursor-pointer hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Presentation className="mr-2 h-5 w-5 text-ocular-600" />
                  Servicios
                </CardTitle>
                <CardDescription>
                  Gestione los servicios disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Cree, edite o desactive los servicios que ofrece su clínica.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/config/rooms">
            <Card className="hover:shadow-md transition-shadow cursor-pointer hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5 text-ocular-600" />
                  Salas
                </CardTitle>
                <CardDescription>
                  Gestione las salas y su asignación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Asigne servicios a salas específicas para organizar la atención.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/config/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-ocular-600" />
                  Usuarios
                </CardTitle>
                <CardDescription>
                  Gestione los usuarios del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Cree y administre cuentas de usuario con diferentes niveles de acceso.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/config/settings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-ocular-600" />
                  Ajustes
                </CardTitle>
                <CardDescription>
                  Configure los datos de la empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Establezca el nombre, dirección, logo y otros datos que aparecerán en tickets e informes.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default Config;

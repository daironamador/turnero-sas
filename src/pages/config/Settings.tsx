
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanySettings } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const mockSettings: CompanySettings = {
  id: '1',
  name: 'OcularClinic',
  address: 'Av. Principal #123, Ciudad',
  phone: '(123) 456-7890',
  email: 'contacto@ocularclinic.com',
  logo: '',
  ticketFooter: 'Gracias por su visita. Por favor conserve este ticket.',
  displayMessage: 'Bienvenido a OcularClinic. Por favor espere a ser llamado.',
};

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CompanySettings>(mockSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to a server
      // Here we're just creating a data URL for preview
      const reader = new FileReader();
      reader.onload = () => {
        setSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    // In a real app, you would save this to your backend
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido guardados exitosamente",
      });
    }, 1000);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Link 
              to="/config" 
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver a Configuración
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
            <p className="text-muted-foreground">
              Configure los datos de su empresa y personalice la aplicación
            </p>
          </div>
          
          <Button 
            onClick={handleSaveSettings}
            className="bg-ocular-600 hover:bg-ocular-700"
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" /> 
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
        
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company">Datos de la Empresa</TabsTrigger>
            <TabsTrigger value="appearance">Apariencia</TabsTrigger>
            <TabsTrigger value="messages">Mensajes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la Empresa</Label>
                    <Input
                      id="name"
                      name="name"
                      value={settings.name}
                      onChange={handleChange}
                      placeholder="Nombre de su clínica"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      name="address"
                      value={settings.address}
                      onChange={handleChange}
                      placeholder="Dirección de su clínica"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={settings.phone}
                      onChange={handleChange}
                      placeholder="Número de teléfono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={settings.email}
                      onChange={handleChange}
                      placeholder="Email de contacto"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo e Identidad Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo de la Empresa</Label>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 border rounded flex items-center justify-center overflow-hidden bg-gray-50">
                      {settings.logo ? (
                        <img 
                          src={settings.logo} 
                          alt="Logo de la empresa" 
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm text-center px-2">
                          Sin logo
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <label className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Subir Logo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </label>
                      </Button>
                      
                      {settings.logo && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setSettings(prev => ({ ...prev, logo: '' }))}
                        >
                          Eliminar Logo
                        </Button>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Formatos: JPG, PNG. Máx 2MB.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mensajes Personalizados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticketFooter">Mensaje en Tickets</Label>
                  <Textarea
                    id="ticketFooter"
                    name="ticketFooter"
                    value={settings.ticketFooter || ''}
                    onChange={handleChange}
                    placeholder="Mensaje que aparecerá en la parte inferior de los tickets"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este mensaje se imprimirá en todos los tickets generados
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayMessage">Mensaje en Pantalla</Label>
                  <Textarea
                    id="displayMessage"
                    name="displayMessage"
                    value={settings.displayMessage || ''}
                    onChange={handleChange}
                    placeholder="Mensaje que aparecerá en la pantalla de visualización"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este mensaje se mostrará en la pantalla de turnos
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;

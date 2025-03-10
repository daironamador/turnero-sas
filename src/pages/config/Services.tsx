
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, Edit, Power, FileWarning } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Service } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";

// Mock data
const mockServices: Service[] = [
  {
    id: '1',
    code: 'CG',
    name: 'Consulta General',
    description: 'Atención oftalmológica general',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '2',
    code: 'RX',
    name: 'Rayos X',
    description: 'Servicio de radiografías',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '3',
    code: 'RR',
    name: 'Recoger Resultados',
    description: 'Entrega de resultados de exámenes',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '4',
    code: 'EX',
    name: 'Exámenes',
    description: 'Pruebas diagnósticas especializadas',
    isActive: false,
    createdAt: new Date()
  },
];

const ServiceForm: React.FC<{
  service?: Service;
  onSave: (service: Partial<Service>) => void;
  onCancel: () => void;
}> = ({ service, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Service>>(
    service || {
      code: '',
      name: '',
      description: '',
      isActive: true
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código (2 letras)</Label>
          <Input
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            maxLength={2}
            required
            className="uppercase"
            placeholder="Ej: CG"
          />
          <p className="text-xs text-muted-foreground">
            Este código aparecerá en los tickets (ej: CG001)
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Servicio</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Consulta General"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Descripción del servicio"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, isActive: checked }))
          }
        />
        <Label htmlFor="isActive">Servicio Activo</Label>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {service ? 'Actualizar Servicio' : 'Crear Servicio'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const Services: React.FC = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>(mockServices);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | undefined>(undefined);

  const handleSaveService = (serviceData: Partial<Service>) => {
    if (currentService) {
      // Update existing service
      const updatedServices = services.map(s => 
        s.id === currentService.id ? { ...s, ...serviceData } : s
      );
      setServices(updatedServices);
      toast({
        title: "Servicio actualizado",
        description: `Se ha actualizado el servicio ${serviceData.name}`,
      });
    } else {
      // Create new service
      const newService: Service = {
        id: crypto.randomUUID(),
        code: serviceData.code?.toUpperCase() || '',
        name: serviceData.name || '',
        description: serviceData.description,
        isActive: serviceData.isActive !== undefined ? serviceData.isActive : true,
        createdAt: new Date(),
      };
      setServices([...services, newService]);
      toast({
        title: "Servicio creado",
        description: `Se ha creado el servicio ${newService.name}`,
      });
    }
    setIsDialogOpen(false);
    setCurrentService(undefined);
  };

  const toggleServiceStatus = (id: string) => {
    const updatedServices = services.map(service => {
      if (service.id === id) {
        const newStatus = !service.isActive;
        toast({
          title: newStatus ? "Servicio activado" : "Servicio desactivado",
          description: `Se ha ${newStatus ? 'activado' : 'desactivado'} el servicio ${service.name}`,
        });
        return { ...service, isActive: newStatus };
      }
      return service;
    });
    setServices(updatedServices);
  };

  const openEditDialog = (service: Service) => {
    setCurrentService(service);
    setIsDialogOpen(true);
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
            <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
            <p className="text-muted-foreground">
              Gestione los servicios disponibles en su clínica
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setCurrentService(undefined);
                  setIsDialogOpen(true);
                }}
                className="bg-ocular-600 hover:bg-ocular-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  {currentService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
                </DialogTitle>
                <DialogDescription>
                  {currentService
                    ? 'Modifique los datos del servicio existente'
                    : 'Complete los datos para crear un nuevo servicio'}
                </DialogDescription>
              </DialogHeader>
              
              <ServiceForm 
                service={currentService}
                onSave={handleSaveService}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setCurrentService(undefined);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {services.length === 0 ? (
          <Card className="border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-center">No hay servicios configurados</p>
              <p className="text-muted-foreground text-center mt-1 mb-4">
                Cree su primer servicio para comenzar a generar tickets
              </p>
              <Button
                onClick={() => {
                  setCurrentService(undefined);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Crear Servicio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => (
              <Card key={service.id} className={`${!service.isActive ? 'opacity-70' : ''} hover:shadow-sm transition-shadow`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{service.name}</span>
                      {!service.isActive && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-500">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(service)}>
                        <Edit className="h-4 w-4 text-ocular-600" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => toggleServiceStatus(service.id)}
                      >
                        <Power className={`h-4 w-4 ${service.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-ocular-100 text-ocular-800 hover:bg-ocular-200">
                      Código: {service.code}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {service.description || 'Sin descripción'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Services;

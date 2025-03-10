
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceType, ServiceTypeLabels, Ticket } from '@/lib/types';
import { format } from 'date-fns';
import { Ticket as TicketIcon, Printer, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock function to generate a unique ticket number
const generateTicketNumber = (serviceType: ServiceType) => {
  // In a real app, this would use the database to ensure uniqueness
  const randomNum = Math.floor(Math.random() * 1000);
  return `${serviceType}${randomNum.toString().padStart(3, '0')}`;
};

// Mock save ticket function
const saveTicket = async (ticket: Ticket): Promise<Ticket> => {
  // In a real app, this would save to a database
  console.log('Saving ticket:', ticket);
  return ticket;
};

interface TicketGeneratorProps {
  onTicketGenerated?: (ticket: Ticket) => void;
}

const TicketGenerator: React.FC<TicketGeneratorProps> = ({ onTicketGenerated }) => {
  const { toast } = useToast();
  const [generatedTicket, setGeneratedTicket] = useState<Ticket | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateTicket = async (serviceType: ServiceType) => {
    setIsGenerating(true);
    
    try {
      const ticketNumber = generateTicketNumber(serviceType);
      
      const newTicket: Ticket = {
        id: crypto.randomUUID(),
        ticketNumber,
        serviceType,
        status: 'waiting',
        createdAt: new Date(),
      };
      
      // In a real application, save to database
      const savedTicket = await saveTicket(newTicket);
      
      setGeneratedTicket(savedTicket);
      
      if (onTicketGenerated) {
        onTicketGenerated(savedTicket);
      }
      
      toast({
        title: "Ticket generado",
        description: `Ticket ${ticketNumber} para ${ServiceTypeLabels[serviceType]}`,
      });
    } catch (error) {
      console.error('Error generating ticket:', error);
      toast({
        title: "Error",
        description: "Error al generar el ticket",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handlePrintTicket = () => {
    if (!generatedTicket) return;
    
    // In a real application, this would send to printer
    console.log('Printing ticket:', generatedTicket);
    
    // Simulate printing with a toast
    toast({
      title: "Imprimiendo ticket",
      description: `Ticket ${generatedTicket.ticketNumber} enviado a la impresora`,
    });
    
    // Reset the generated ticket after printing
    setTimeout(() => {
      setGeneratedTicket(null);
    }, 3000);
  };
  
  return (
    <div className="space-y-6 animate-slide-down">
      <h1 className="text-3xl font-bold tracking-tight">Generador de Tickets</h1>
      <p className="text-muted-foreground">Seleccione el tipo de servicio para generar un ticket</p>
      
      {generatedTicket ? (
        <Card className="w-full max-w-md mx-auto border-2 border-ocular-600">
          <CardHeader className="text-center pb-2 bg-ocular-50">
            <CardTitle className="text-xl">Ticket Generado</CardTitle>
            <CardDescription>
              {format(generatedTicket.createdAt, "dd/MM/yyyy HH:mm")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-ocular-100 rounded-full flex items-center justify-center">
                <TicketIcon className="w-10 h-10 text-ocular-600" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-ocular-700 mb-2">
              #{generatedTicket.ticketNumber}
            </h2>
            <p className="text-lg font-medium text-gray-700">
              {ServiceTypeLabels[generatedTicket.serviceType]}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 pt-0">
            <Button 
              className="bg-ocular-600 hover:bg-ocular-700 w-full" 
              onClick={handlePrintTicket}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Ticket
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(ServiceTypeLabels) as ServiceType[]).map((serviceType) => (
            <Card 
              key={serviceType} 
              className="hover:shadow-md transition-shadow cursor-pointer hover-scale"
              onClick={() => generateTicket(serviceType)}
            >
              <CardHeader className="pb-2">
                <CardTitle>{ServiceTypeLabels[serviceType]}</CardTitle>
                <CardDescription>
                  Generar ticket para {ServiceTypeLabels[serviceType].toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-4 flex justify-center">
                <div className="w-12 h-12 bg-ocular-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-ocular-600">{serviceType}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-center">
                <Button 
                  className="bg-ocular-600 hover:bg-ocular-700 w-full"
                  disabled={isGenerating}
                >
                  <TicketIcon className="w-4 h-4 mr-2" />
                  Generar Ticket
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketGenerator;

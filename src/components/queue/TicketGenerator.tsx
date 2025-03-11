
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceType, ServiceTypeLabels, Ticket } from '@/lib/types';
import { format } from 'date-fns';
import { Ticket as TicketIcon, Printer, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { createTicket } from '@/services/ticketService';
import { printTicket } from '@/utils/printUtils';

interface TicketGeneratorProps {
  onTicketGenerated?: (ticket: Ticket) => void;
}

const TicketGenerator: React.FC<TicketGeneratorProps> = ({ onTicketGenerated }) => {
  const { toast } = useToast();
  const [generatedTicket, setGeneratedTicket] = useState<Ticket | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVip, setIsVip] = useState(false);
  
  const handleGenerateTicket = async (serviceType: ServiceType) => {
    setIsGenerating(true);
    
    try {
      // Create ticket in the database
      const newTicket = await createTicket(serviceType, isVip);
      
      setGeneratedTicket(newTicket);
      
      if (onTicketGenerated) {
        onTicketGenerated(newTicket);
      }
      
      toast({
        title: isVip ? "Ticket VIP generado" : "Ticket generado",
        description: `Ticket ${newTicket.ticketNumber} para ${ServiceTypeLabels[serviceType]}`,
      });
      
      // Reset VIP status for next ticket
      setIsVip(false);
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
    
    // Print using our printing utility
    printTicket(generatedTicket);
    
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
      
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox 
          id="isVip" 
          checked={isVip} 
          onCheckedChange={(checked) => setIsVip(checked === true)}
        />
        <Label 
          htmlFor="isVip" 
          className="flex items-center cursor-pointer"
        >
          <span>Ticket VIP</span>
          <Star className="ml-2 h-4 w-4 text-yellow-500" />
        </Label>
      </div>
      
      {generatedTicket ? (
        <Card className={`w-full max-w-md mx-auto border-2 ${generatedTicket.isVip ? 'border-yellow-500 bg-yellow-50' : 'border-ocular-600'}`}>
          <CardHeader className={`text-center pb-2 ${generatedTicket.isVip ? 'bg-yellow-100' : 'bg-ocular-50'}`}>
            <CardTitle className="text-xl flex items-center justify-center">
              Ticket Generado
              {generatedTicket.isVip && <Star className="ml-2 h-5 w-5 text-yellow-500" />}
            </CardTitle>
            <CardDescription>
              {format(generatedTicket.createdAt, "dd/MM/yyyy HH:mm")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-4 text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${generatedTicket.isVip ? 'bg-yellow-100' : 'bg-ocular-100'}`}>
                <TicketIcon className={`w-10 h-10 ${generatedTicket.isVip ? 'text-yellow-600' : 'text-ocular-600'}`} />
              </div>
            </div>
            <h2 className={`text-4xl font-bold mb-2 ${generatedTicket.isVip ? 'text-yellow-700' : 'text-ocular-700'}`}>
              #{generatedTicket.ticketNumber}
            </h2>
            <p className="text-lg font-medium text-gray-700">
              {ServiceTypeLabels[generatedTicket.serviceType]}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 pt-0">
            <Button 
              className={`w-full ${generatedTicket.isVip ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-ocular-600 hover:bg-ocular-700'}`} 
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
              className={`hover:shadow-md transition-shadow cursor-pointer hover-scale ${isVip ? 'border-yellow-300' : ''}`}
              onClick={() => handleGenerateTicket(serviceType)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  {ServiceTypeLabels[serviceType]}
                  {isVip && <Star className="ml-2 h-4 w-4 text-yellow-500" />}
                </CardTitle>
                <CardDescription>
                  Generar ticket para {ServiceTypeLabels[serviceType].toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-4 flex justify-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isVip ? 'bg-yellow-100' : 'bg-ocular-100'}`}>
                  <span className={`text-lg font-bold ${isVip ? 'text-yellow-600' : 'text-ocular-600'}`}>{serviceType}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-center">
                <Button 
                  className={`w-full ${isVip ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-ocular-600 hover:bg-ocular-700'}`}
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

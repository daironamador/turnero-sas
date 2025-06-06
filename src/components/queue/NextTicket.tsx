
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PhoneCall, Clock, User, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket } from '@/lib/types';

interface NextTicketProps {
  nextTicket?: Ticket;
  onCallNext: () => void;
  isCallPending: boolean;
}

const NextTicket: React.FC<NextTicketProps> = ({
  nextTicket,
  onCallNext,
  isCallPending
}) => {
  const isVip = nextTicket?.isVip;
  
  return (
    <Card className={`bg-white border ${
      isVip 
        ? 'border-yellow-300 bg-yellow-50'
        : nextTicket 
          ? 'border-primary/20' 
          : 'border-muted'
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          Siguiente Ticket
          {nextTicket && (
            <div className="flex items-center">
              <Badge 
                variant={isVip ? "default" : "outline"}
                className={isVip ? "bg-yellow-500 border-yellow-500 text-white" : ""}
              >
                {nextTicket.ticketNumber}
              </Badge>
              {isVip && <Star className="ml-1 h-4 w-4 text-yellow-500 fill-yellow-500" />}
            </div>
          )}
        </CardTitle>
        <CardDescription>
          {nextTicket ? 'Próximo ticket a ser llamado' : 'No hay tickets en espera'}
        </CardDescription>
      </CardHeader>
      
      {nextTicket ? (
        <>
          <CardContent className="pt-0 pb-2">
            <div className="space-y-2">
              {nextTicket.patientName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Paciente:</span> 
                  <span>{nextTicket.patientName}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  En espera desde {format(new Date(nextTicket.createdAt), "h:mm a", { locale: es })}
                </span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-2">
            <Button 
              className={`w-full ${isVip ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
              onClick={onCallNext} 
              disabled={isCallPending || !nextTicket}
            >
              {isCallPending ? 'Llamando...' : 'Llamar Ticket'}
              <PhoneCall className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </>
      ) : (
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No hay tickets en espera</p>
        </CardContent>
      )}
    </Card>
  );
};

export default NextTicket;

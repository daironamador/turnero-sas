
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCheck, ChevronsUpDown, XCircle, Clock, User, Calendar, Volume2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket } from '@/lib/types';

interface CurrentTicketProps {
  currentTicket?: Ticket;
  onComplete: () => void;
  onCancel: () => void;
  onRedirect: () => void;
  onCallAgain?: () => void;
  isCompletePending: boolean;
  isCancelPending: boolean;
  isRedirectPending: boolean;
}

const CurrentTicket: React.FC<CurrentTicketProps> = ({
  currentTicket,
  onComplete,
  onCancel,
  onRedirect,
  onCallAgain,
  isCompletePending,
  isCancelPending,
  isRedirectPending
}) => {
  return (
    <Card className={`bg-white border ${currentTicket ? 'border-primary/20' : 'border-muted'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          Ticket Actual
          {currentTicket && <Badge>{currentTicket.ticketNumber}</Badge>}
        </CardTitle>
        <CardDescription>
          {currentTicket ? 'Información del ticket en atención' : 'No hay ticket en atención'}
        </CardDescription>
      </CardHeader>
      
      {currentTicket ? (
        <>
          <CardContent className="pt-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Paciente:</span> 
                <span>{currentTicket.patientName || 'Sin nombre'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-normal">{currentTicket.serviceType}</Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {currentTicket.status === 'serving' ? 'En atención' : currentTicket.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(new Date(currentTicket.createdAt), "dd/MM/yyyy", { locale: es })}
                </span>
              </div>
              
              {currentTicket.calledAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Llamado a las {format(new Date(currentTicket.calledAt), "h:mm a", { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-wrap justify-end gap-2 pt-2">
            {onCallAgain && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onCallAgain}
                className="mr-auto"
              >
                Volver a Llamar
                <Volume2 className="w-4 h-4 ml-2" />
              </Button>
            )}
            <Button 
              variant="destructive" 
              size="sm"
              onClick={onCancel} 
              disabled={isCancelPending}
            >
              {isCancelPending ? 'Cancelando...' : 'Cancelar'}
              <XCircle className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={onRedirect}
              disabled={isRedirectPending}
            >
              Redirigir
              <ChevronsUpDown className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={onComplete} 
              disabled={isCompletePending}
            >
              {isCompletePending ? 'Completando...' : 'Completar'}
              <CheckCheck className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </>
      ) : (
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No hay ticket actual</p>
        </CardContent>
      )}
    </Card>
  );
};

export default CurrentTicket;

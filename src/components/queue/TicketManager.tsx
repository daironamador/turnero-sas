
import React, { useState, useEffect } from 'react';
import { Service, Ticket, Room, ServiceType } from '@/lib/types';
import { useTicketMutations } from '@/hooks/useTicketMutations';
import { useTicketAnnouncer } from '@/hooks/useTicketAnnouncer';
import TicketActions from './TicketActions';
import { toast } from 'sonner';

interface TicketManagerProps {
  currentTicket?: Ticket;
  waitingTickets: Ticket[];
  rooms: Room[];
  services: Service[];
  counterNumber: string;
  counterName?: string;
  onTicketChange: () => void;
}

const TicketManager: React.FC<TicketManagerProps> = ({ 
  currentTicket, 
  waitingTickets, 
  rooms, 
  services, 
  counterNumber,
  counterName,
  onTicketChange
}) => {
  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);

  const nextTicket = waitingTickets.length > 0 ? waitingTickets[0] : undefined;
  
  const { announceTicket } = useTicketAnnouncer();
  const {
    callTicketMutation,
    completeTicketMutation,
    cancelTicketMutation,
    redirectTicketMutation,
    recallTicketMutation
  } = useTicketMutations(counterNumber, onTicketChange);

  // Intentar conseguir permisos de audio al inicio
  useEffect(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log("Permisos de audio concedidos");
          setAudioPermissionGranted(true);
        })
        .catch(error => {
          console.warn("No se pudo obtener permisos de audio:", error);
          // No mostrar error aquí ya que sólo es para reproducción y puede funcionar igualmente
        });
    }
  }, []);

  const handleCallNext = () => {
    if (!nextTicket) return;
    
    // Intentar reproducir un sonido corto para activar audio en móviles
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(0, audioContext.currentTime); // Frecuencia 0 para que no se escuche
      oscillator.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.01);
    } catch (e) {
      console.log("No se pudo crear el contexto de audio:", e);
    }
    
    callTicketMutation.mutate({ 
      ticketId: nextTicket.id, 
      counterNumber 
    }, {
      onSuccess: () => {
        // Anunciar el ticket después de llamarlo exitosamente
        if (counterName) {
          const announced = announceTicket(nextTicket, counterName, rooms);
          if (!announced) {
            toast.warning("Es posible que el anuncio de voz no funcione. Intente llamar otra vez después.");
          }
        }
      }
    });
  };

  const handleComplete = () => {
    if (!currentTicket) return;
    completeTicketMutation.mutate({ 
      ticketId: currentTicket.id 
    });
  };

  const handleCancel = () => {
    if (!currentTicket) return;
    cancelTicketMutation.mutate({ 
      ticketId: currentTicket.id 
    });
  };

  const handleRedirect = () => {
    if (!currentTicket || !selectedService) return;
    
    const serviceTypeValue = selectedService as ServiceType;
    
    redirectTicketMutation.mutate({ 
      ticketId: currentTicket.id, 
      serviceType: serviceTypeValue
    });
    setIsRedirectDialogOpen(false);
  };

  const handleCallAgain = () => {
    if (!currentTicket || !counterName) return;
    
    // Intentar reproducir un sonido corto para activar audio en móviles
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(0, audioContext.currentTime); // Frecuencia 0 para que no se escuche
      oscillator.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.01);
    } catch (e) {
      console.log("No se pudo crear el contexto de audio:", e);
    }
    
    const announced = announceTicket(currentTicket, counterName, rooms);
    if (!announced) {
      toast.warning("Es posible que el anuncio de voz no funcione en este dispositivo.");
    }
  };

  const handleRecallFromHistory = (ticket: Ticket) => {
    if (!counterName) return;
    
    // Crear un objeto de ticket correctamente formateado antes de llamar
    const recallTicket = {
      ...ticket,
      counterNumber: counterNumber // Mantener como string para la mutación
    };
    
    recallTicketMutation.mutate({ 
      ticket: recallTicket
    }, {
      onSuccess: () => {
        // Para anuncio, asegurarse de usar el formato correcto para el anuncio
        announceTicket({
          ...ticket,
          counterNumber: counterNumber, // Mantener como string para el anuncio
          status: "serving"
        }, counterName, rooms);
      }
    });
  };

  return (
    <TicketActions
      currentTicket={currentTicket}
      nextTicket={nextTicket}
      waitingTickets={waitingTickets}
      counterNumber={counterNumber}
      rooms={rooms}
      services={services}
      onCallNext={handleCallNext}
      onComplete={handleComplete}
      onCancel={handleCancel}
      onRedirect={() => setIsRedirectDialogOpen(true)}
      onCallAgain={handleCallAgain}
      onRecallFromHistory={handleRecallFromHistory}
      isCompletePending={completeTicketMutation.isPending}
      isCancelPending={cancelTicketMutation.isPending}
      isRedirectPending={redirectTicketMutation.isPending}
      isCallPending={callTicketMutation.isPending}
      isRedirectDialogOpen={isRedirectDialogOpen}
      selectedService={selectedService}
      onSelectService={setSelectedService}
      onOpenRedirectChange={setIsRedirectDialogOpen}
      onConfirmRedirect={handleRedirect}
    />
  );
};

export default TicketManager;

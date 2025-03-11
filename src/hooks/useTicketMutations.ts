
import { useMutation } from "@tanstack/react-query";
import { toast } from 'sonner';
import { 
  callTicket, 
  completeTicket, 
  cancelTicket, 
  redirectTicket,
  recallTicket
} from '@/services/ticketService';
import { Ticket, ServiceType } from '@/lib/types';

// Define types for mutation parameters
type CallTicketParams = { ticketId: string; counterNumber: string };
type CompleteTicketParams = { ticketId: string };
type CancelTicketParams = { ticketId: string };
type RedirectTicketParams = { ticketId: string; serviceType: ServiceType };
type RecallTicketParams = { ticket: Ticket };

export function useTicketMutations(counterNumber: string, onTicketChange: () => void) {
  // Call ticket mutation
  const callTicketMutation = useMutation({
    mutationFn: (params: CallTicketParams) => 
      callTicket(params.ticketId, params.counterNumber),
    onSuccess: (_, variables) => {
      toast.success(`Se ha llamado al ticket en la sala seleccionada`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo llamar al ticket");
    },
  });

  // Complete ticket mutation
  const completeTicketMutation = useMutation({
    mutationFn: (params: CompleteTicketParams) => completeTicket(params.ticketId),
    onSuccess: () => {
      toast.success(`Se ha completado el ticket`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo completar el ticket");
    },
  });

  // Cancel ticket mutation
  const cancelTicketMutation = useMutation({
    mutationFn: (params: CancelTicketParams) => cancelTicket(params.ticketId),
    onSuccess: () => {
      toast.success(`Se ha cancelado el ticket`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo cancelar el ticket");
    },
  });

  // Redirect ticket mutation
  const redirectTicketMutation = useMutation({
    mutationFn: (params: RedirectTicketParams) => 
      redirectTicket(params.ticketId, params.serviceType),
    onSuccess: (_, variables) => {
      toast.success(`Se ha redirigido el ticket al servicio ${variables.serviceType}`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo redirigir el ticket");
    },
  });

  // Recall ticket mutation
  const recallTicketMutation = useMutation({
    mutationFn: (params: RecallTicketParams) => 
      recallTicket(params.ticket.id, counterNumber),
    onSuccess: (_, variables) => {
      toast.success(`Se ha vuelto a llamar al ticket ${variables.ticket.ticketNumber}`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo rellamar al ticket");
    },
  });

  return {
    callTicketMutation,
    completeTicketMutation,
    cancelTicketMutation,
    redirectTicketMutation,
    recallTicketMutation
  };
}

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Hook optimizado para anuncios en tiempo real
 * Prioriza velocidad y respuesta inmediata
 */
export function useRealtimeAnnouncement() {
  const isProcessingRef = useRef(false);
  const lastAnnouncementRef = useRef<string | null>(null);

  // Format ticket number for pronunciation (optimized)
  const formatTicketNumber = useCallback((ticketNumber: string): string => {
    return ticketNumber.replace(/[^a-zA-Z0-9]/g, '').split('').join(' ');
  }, []);

  // Create announcement text (optimized)
  const createAnnouncementText = useCallback((
    ticketNumber: string,
    counterName: string,
    redirectedFrom?: string,
    originalRoomName?: string
  ): string => {
    const formattedNumber = formatTicketNumber(ticketNumber);
    
    if (redirectedFrom && originalRoomName) {
      return `Turno ${formattedNumber}, referido de ${originalRoomName}, pasar a ${counterName}`;
    }
    
    return `Turno ${formattedNumber}, pasar a ${counterName}`;
  }, [formatTicketNumber]);

  // Immediate speech synthesis (no delays, no retries)
  const speakImmediate = useCallback(async (text: string): Promise<boolean> => {
    if (!window.speechSynthesis || isProcessingRef.current) {
      return false;
    }

    // Prevent duplicate announcements
    if (lastAnnouncementRef.current === text) {
      return true;
    }

    isProcessingRef.current = true;
    lastAnnouncementRef.current = text;

    try {
      // Cancel any ongoing speech immediately
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1;
      utterance.rate = 1; // Normal speed for clarity
      utterance.pitch = 1;
      utterance.lang = 'es-419';

      // Find Spanish voice (no waiting)
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => 
        voice.lang.includes('es') && voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => voice.lang.includes('es'));

      if (spanishVoice) {
        utterance.voice = spanishVoice;
        utterance.lang = spanishVoice.lang;
      }

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          isProcessingRef.current = false;
          resolve(false);
        }, 3000); // Shorter timeout for real-time

        utterance.onend = () => {
          clearTimeout(timeout);
          isProcessingRef.current = false;
          // Clear last announcement immediately for next call
          setTimeout(() => {
            lastAnnouncementRef.current = null;
          }, 500);
          resolve(true);
        };

        utterance.onerror = () => {
          clearTimeout(timeout);
          isProcessingRef.current = false;
          lastAnnouncementRef.current = null;
          resolve(false);
        };

        // Speak immediately
        window.speechSynthesis.speak(utterance);
      });

    } catch (error) {
      isProcessingRef.current = false;
      lastAnnouncementRef.current = null;
      return false;
    }
  }, []);

  // Optimized broadcast (minimal delay)
  const broadcastAnnouncement = useCallback((messageData: object): boolean => {
    if (typeof BroadcastChannel === 'undefined') {
      return false;
    }

    try {
      const channel = new BroadcastChannel('ticket-announcements');
      channel.postMessage(messageData);
      
      // Close immediately after sending
      setTimeout(() => channel.close(), 10);
      
      return true;
    } catch (error) {
      console.error('Broadcast error:', error);
      return false;
    }
  }, []);

  // Main announce function optimized for real-time
  const announceTicketRealtime = useCallback(async (
    ticketNumber: string,
    counterName: string,
    ticketId?: string,
    redirectedFrom?: string,
    originalRoomName?: string
  ): Promise<boolean> => {
    const text = createAnnouncementText(ticketNumber, counterName, redirectedFrom, originalRoomName);
    
    // Dual approach: broadcast + immediate speech (parallel)
    const broadcastPromise = Promise.resolve(
      broadcastAnnouncement({
        type: 'announce-ticket',
        messageId: `${ticketId || ticketNumber}-${Date.now()}`,
        ticket: {
          id: ticketId,
          ticketNumber,
          status: 'serving'
        },
        counterName,
        redirectedFrom,
        originalRoomName,
        timestamp: Date.now()
      })
    );

    const speechPromise = speakImmediate(text);

    // Wait for both (parallel execution)
    const [broadcastSuccess, speechSuccess] = await Promise.all([
      broadcastPromise,
      speechPromise
    ]);

    // Show immediate feedback
    if (speechSuccess) {
      toast.success(`🔊 ${ticketNumber}`, { duration: 2000 });
    } else if (broadcastSuccess) {
      toast.info(`📡 ${ticketNumber} (enviado a displays)`, { duration: 2000 });
    } else {
      toast.error('❌ Error en anuncio', { duration: 2000 });
    }

    return broadcastSuccess || speechSuccess;
  }, [createAnnouncementText, broadcastAnnouncement, speakImmediate]);

  return { 
    announceTicketRealtime,
    isProcessing: isProcessingRef.current 
  };
}
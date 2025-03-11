
import { useState, useCallback } from 'react';
import { useSpeechInit } from './hooks/useSpeechInit';
import { useSpeechQueue } from './hooks/useSpeechQueue';
import { formatTicketNumber } from './utils/voiceUtils';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { voices, isReady, initialize } = useSpeechInit();
  const { queueSpeech } = useSpeechQueue({ voices, setIsSpeaking });

  // Function to announce ticket via speech synthesis
  const announceTicket = useCallback((
    ticketNumber: string, 
    counterName: string, 
    redirectedFrom?: string, 
    originalRoomName?: string
  ) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported in this browser");
      return;
    }
    
    // If speech synthesis is not ready, try to initialize it
    if (!isReady && window.speechSynthesis) {
      console.log("Speech synthesis not yet ready, initializing...");
      initialize();
    }

    const formattedNumber = formatTicketNumber(ticketNumber);
    
    // Construct the announcement text
    let announcementText = '';
    if (redirectedFrom && originalRoomName) {
      // For redirected tickets
      announcementText = `Turno ${formattedNumber}, referido de ${originalRoomName}, pasar a ${counterName}`;
    } else {
      // For regular tickets
      announcementText = `Turno ${formattedNumber}, pasar a ${counterName}`;
    }
    
    console.log(`Queueing announcement: "${announcementText}"`);
    
    // Add to queue
    queueSpeech(announcementText);
    
    return announcementText;
  }, [queueSpeech, isReady, initialize]);

  return { announceTicket, isSpeaking };
}

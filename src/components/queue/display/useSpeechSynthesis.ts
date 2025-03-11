
import { useEffect, useState } from 'react';

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Make sure voices are loaded
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Format the ticket number to remove leading zeros and convert to a natural number
  const formatTicketNumber = (ticketNumber: string): string => {
    // Remove any non-numeric characters first
    const numericOnly = ticketNumber.replace(/\D/g, '');
    // Parse as integer to remove leading zeros
    const numberValue = parseInt(numericOnly, 10);
    
    // Handle specific cases like 100, 200, etc.
    if (numberValue % 100 === 0 && numberValue <= 900) {
      const hundreds = numberValue / 100;
      return hundreds === 1 ? "cien" : `${hundreds}cientos`;
    }
    
    // Return the number as a string (already without leading zeros due to parseInt)
    return numberValue.toString();
  };

  // Function to announce ticket via speech synthesis
  const announceTicket = (
    ticketNumber: string, 
    counterName: string, 
    redirectedFrom?: string, 
    originalRoomName?: string
  ) => {
    if (!window.speechSynthesis) return;
    
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
    
    const speech = new SpeechSynthesisUtterance();
    speech.text = announcementText;
    speech.volume = 1;
    speech.rate = 0.9;
    speech.pitch = 1;
    
    // Try to find a Spanish Latin American voice first - prioritize these specific regions
    const latinAmericanVoices = voices.filter(voice => 
      (voice.lang.includes('es-MX') || 
       voice.lang.includes('es-419') || 
       voice.lang.includes('es-US') || 
       voice.lang.includes('es-CO') || 
       voice.lang.includes('es-AR'))
    );
    
    // If we find Latin American voices, prioritize female voices
    if (latinAmericanVoices.length > 0) {
      const femaleVoice = latinAmericanVoices.find(v => v.name.includes('Female') || v.name.includes('female'));
      speech.voice = femaleVoice || latinAmericanVoices[0];
      speech.lang = speech.voice.lang;
    } else {
      // Fallback to any Spanish voice, but try to avoid es-ES (Spain) if possible
      const spanishVoices = voices.filter(voice => 
        voice.lang.includes('es') && !voice.lang.includes('es-ES')
      );
      
      // If no non-Spain Spanish voices found, use any Spanish voice
      const availableSpanishVoices = spanishVoices.length > 0 ? 
        spanishVoices : 
        voices.filter(voice => voice.lang.includes('es'));
      
      if (availableSpanishVoices.length > 0) {
        const femaleVoice = availableSpanishVoices.find(v => v.name.includes('Female') || v.name.includes('female'));
        speech.voice = femaleVoice || availableSpanishVoices[0];
        speech.lang = speech.voice.lang;
      } else {
        // Last resort: use default voice but set language to Spanish Latin America
        speech.lang = 'es-419'; // Spanish Latin America
      }
    }
    
    console.log(`Using voice: ${speech.voice?.name || 'Default'} (${speech.lang})`);
    console.log(`Saying: "${speech.text}"`);
    
    window.speechSynthesis.speak(speech);
  };

  return { announceTicket };
}

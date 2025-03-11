
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

  // Format the ticket number to spell out service code letters and format the numeric part
  const formatTicketNumber = (ticketNumber: string): string => {
    // Extract service code prefix (like CG, RX) and the numeric part
    const serviceCodeMatch = ticketNumber.match(/^([A-Z]+)(\d+)$/);
    
    if (serviceCodeMatch) {
      const serviceCode = serviceCodeMatch[1]; // e.g., "CG"
      const numericPart = serviceCodeMatch[2]; // e.g., "001"
      
      // Convert numeric part to integer to remove leading zeros
      const numberValue = parseInt(numericPart, 10);
      
      // Spell out each letter individually in the service code
      // This creates pronunciations like "C G" for "CG"
      const spellOutServiceCode = serviceCode.split('').join(' ');
      
      // Handle specific cases like 100, 200, etc.
      if (numberValue % 100 === 0 && numberValue <= 900) {
        const hundreds = numberValue / 100;
        return `${spellOutServiceCode} ${hundreds === 1 ? "cien" : `${hundreds}cientos`}`;
      }
      
      // Return the service code spelled out + formatted number
      return `${spellOutServiceCode} ${numberValue.toString()}`;
    }
    
    // Fallback for tickets without a service code prefix
    const numericOnly = ticketNumber.replace(/\D/g, '');
    const numberValue = parseInt(numericOnly, 10);
    
    if (numberValue % 100 === 0 && numberValue <= 900) {
      const hundreds = numberValue / 100;
      return hundreds === 1 ? "cien" : `${hundreds}cientos`;
    }
    
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

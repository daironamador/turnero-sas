
/**
 * Utility functions for voice synthesis and ticket announcements
 */

export const formatTicketNumber = (ticketNumber: string): string => {
  // Remove any non-alphanumeric characters and format for better pronunciation
  const cleaned = ticketNumber.replace(/[^a-zA-Z0-9]/g, '');
  
  // If it's just numbers, add spaces between digits for better pronunciation
  if (/^\d+$/.test(cleaned)) {
    return cleaned.split('').join(' ');
  }
  
  // If it has letters and numbers, separate them
  return cleaned.replace(/([a-zA-Z])(\d)/g, '$1 $2').replace(/(\d)([a-zA-Z])/g, '$1 $2');
};

export const findBestSpanishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  if (!voices || voices.length === 0) return null;
  
  // Priority order for Spanish voices
  const priorities = [
    /es-ES.*female/i,    // Spanish (Spain) female
    /es-ES/i,            // Spanish (Spain) any
    /es-MX.*female/i,    // Spanish (Mexico) female  
    /es-MX/i,            // Spanish (Mexico) any
    /es-AR/i,            // Spanish (Argentina)
    /es-.*female/i,      // Any Spanish female
    /es/i,               // Any Spanish
  ];
  
  for (const pattern of priorities) {
    const match = voices.find(voice => 
      pattern.test(voice.name) || pattern.test(voice.lang)
    );
    if (match) return match;
  }
  
  // Fallback to first available voice
  return voices[0] || null;
};

export const createAnnouncementText = (
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
};

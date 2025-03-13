
/**
 * Utility functions for voice synthesis
 */

// Format the ticket number for better pronunciation
export const formatTicketNumber = (ticketNumber: string): string => {
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

// Find the best Spanish voice from available voices
export const findBestSpanishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
  console.log(`Finding best Spanish voice from ${voices.length} available voices`);
  
  if (voices.length === 0) {
    // If no voices are available, return undefined
    console.warn("No voices available for selection");
    return undefined;
  }
  
  // Log all available voices for debugging
  voices.forEach(voice => {
    console.log(`Voice: ${voice.name}, Language: ${voice.lang}, Default: ${voice.default}`);
  });
  
  // Try to find a Spanish Latin American voice first
  const latinAmericanVoices = voices.filter(voice => 
    (voice.lang.includes('es-MX') || 
      voice.lang.includes('es-419') || 
      voice.lang.includes('es-US') || 
      voice.lang.includes('es-CO') || 
      voice.lang.includes('es-AR'))
  );
  
  // If we find Latin American voices, prioritize female voices
  if (latinAmericanVoices.length > 0) {
    console.log(`Found ${latinAmericanVoices.length} Latin American Spanish voices`);
    const femaleVoice = latinAmericanVoices.find(v => 
      v.name.includes('Female') || 
      v.name.includes('female') || 
      v.name.includes('Paulina') || 
      v.name.includes('Rosa')
    );
    return femaleVoice || latinAmericanVoices[0];
  }
  
  // Fallback to any Spanish voice, but try to avoid es-ES (Spain) if possible
  const spanishVoices = voices.filter(voice => 
    voice.lang.includes('es') && !voice.lang.includes('es-ES')
  );
  
  // If no non-Spain Spanish voices found, use any Spanish voice
  const availableSpanishVoices = spanishVoices.length > 0 ? 
    spanishVoices : 
    voices.filter(voice => voice.lang.includes('es'));
  
  if (availableSpanishVoices.length > 0) {
    console.log(`Found ${availableSpanishVoices.length} Spanish voices`);
    const femaleVoice = availableSpanishVoices.find(v => 
      v.name.includes('Female') || 
      v.name.includes('female') || 
      v.name.includes('Monica')
    );
    return femaleVoice || availableSpanishVoices[0];
  }
  
  // Last fallback - use any available voice, preferably default
  console.log("No Spanish voices found, using any available voice");
  return voices.find(v => v.default) || voices[0];
};

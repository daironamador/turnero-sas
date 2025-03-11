
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

  // Function to announce ticket via speech synthesis
  const announceTicket = (ticketNumber: string, counterName: string) => {
    if (!window.speechSynthesis) return;
    
    const speech = new SpeechSynthesisUtterance();
    speech.text = `Turno #${ticketNumber}, pasar a ${counterName}`;
    speech.volume = 1;
    speech.rate = 0.9;
    speech.pitch = 1;
    
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
      const femaleVoice = latinAmericanVoices.find(v => v.name.includes('Female') || v.name.includes('female'));
      speech.voice = femaleVoice || latinAmericanVoices[0];
      speech.lang = speech.voice.lang;
    } else {
      // Fallback to any Spanish voice
      const spanishVoices = voices.filter(voice => voice.lang.includes('es'));
      
      if (spanishVoices.length > 0) {
        const femaleVoice = spanishVoices.find(v => v.name.includes('Female') || v.name.includes('female'));
        speech.voice = femaleVoice || spanishVoices[0];
        speech.lang = speech.voice.lang;
      } else {
        // Last resort: use default voice but set language to Spanish
        speech.lang = 'es-419'; // Spanish Latin America
      }
    }
    
    console.log(`Using voice: ${speech.voice?.name || 'Default'} (${speech.lang})`);
    
    window.speechSynthesis.speak(speech);
  };

  return { announceTicket };
}

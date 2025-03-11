
import { useEffect } from 'react';

export function useSpeechSynthesis() {
  // Make sure voices are loaded
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
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
    speech.lang = 'es-ES';
    speech.volume = 1;
    speech.rate = 0.9;
    speech.pitch = 1;
    
    // Try to find a female Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoices = voices.filter(voice => 
      voice.lang.includes('es') && voice.name.includes('Female')
    );
    
    if (spanishVoices.length > 0) {
      speech.voice = spanishVoices[0];
    } else {
      // Use any Spanish voice as fallback
      const anySpanishVoice = voices.filter(voice => voice.lang.includes('es'));
      if (anySpanishVoice.length > 0) {
        speech.voice = anySpanishVoice[0];
      }
    }
    
    window.speechSynthesis.speak(speech);
  };

  return { announceTicket };
}

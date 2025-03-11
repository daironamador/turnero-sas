
import { useEffect, useState, useRef } from 'react';

export function useSpeechInit() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthesisReadyRef = useRef(false);
  
  // Make sure voices are loaded
  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis) {
        // First clear any pending speech
        window.speechSynthesis.cancel();
        
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        synthesisReadyRef.current = true;
        console.log("Voice synthesis ready. Loaded voices:", availableVoices.length);
        
        // Log available Spanish voices
        const spanishVoices = availableVoices.filter(v => v.lang.includes('es'));
        if (spanishVoices.length) {
          console.log("Available Spanish voices:", spanishVoices.map(v => `${v.name} (${v.lang})`).join(', '));
        } else {
          console.warn("No Spanish voices found");
        }
      }
    };
    
    // Reset speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Initial load attempt
    loadVoices();
    
    // Setup event handler for when voices are loaded later
    if (window.speechSynthesis?.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Reset the speech synthesis periodically to avoid Chrome bugs
    const resetSynthesisInterval = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking && !synthesisReadyRef.current) {
        console.log("Periodic speech synthesis reset");
        window.speechSynthesis.cancel();
      }
    }, 10000);
    
    // Ensure speech synthesis is not paused when page visibility changes
    const handleVisibilityChange = () => {
      if (window.speechSynthesis) {
        if (document.hidden) {
          window.speechSynthesis.pause();
          console.log("Speech synthesis paused due to tab visibility change");
        } else {
          window.speechSynthesis.resume();
          console.log("Speech synthesis resumed due to tab visibility change");
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(resetSynthesisInterval);
    };
  }, []);

  return { 
    voices, 
    isReady: synthesisReadyRef.current,
    initialize: () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Clear any pending speech
        window.speechSynthesis.getVoices(); // Force voice loading
        synthesisReadyRef.current = true;
      }
    }
  };
}

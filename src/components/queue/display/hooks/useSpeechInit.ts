
import { useEffect, useState, useRef } from 'react';

export function useSpeechInit() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isReadyState, setIsReadyState] = useState(false);
  const synthesisReadyRef = useRef(false);
  
  // Function to force load voices
  const forceLoadVoices = () => {
    if (window.speechSynthesis) {
      // First clear any pending speech
      window.speechSynthesis.cancel();
      
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      synthesisReadyRef.current = true;
      setIsReadyState(true);
      
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
  
  // Make sure voices are loaded
  useEffect(() => {
    // Reset speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Initial load attempt
    forceLoadVoices();
    
    // Setup event handler for when voices are loaded later
    if (window.speechSynthesis?.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = forceLoadVoices;
    }
    
    // Try to load voices again after a short delay
    const loadVoicesTimeout = setTimeout(() => {
      if (!synthesisReadyRef.current && window.speechSynthesis) {
        console.log("Retrying voice loading after timeout...");
        forceLoadVoices();
      }
    }, 1000);
    
    // Reset the speech synthesis periodically to avoid Chrome bugs
    const resetSynthesisInterval = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking && synthesisReadyRef.current) {
        console.log("Periodic speech synthesis reset");
        window.speechSynthesis.cancel();
      }
    }, 10000);
    
    // Ensure speech synthesis is not paused when page visibility changes
    const handleVisibilityChange = () => {
      if (window.speechSynthesis) {
        if (document.hidden) {
          console.log("Speech synthesis paused due to tab visibility change");
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
          }
        } else {
          console.log("Speech synthesis resumed due to tab visibility change");
          window.speechSynthesis.resume();
          
          // Force reload voices when returning to tab
          setTimeout(forceLoadVoices, 300);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(resetSynthesisInterval);
      clearTimeout(loadVoicesTimeout);
    };
  }, []);

  return { 
    voices, 
    isReady: isReadyState,
    initialize: () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Clear any pending speech
        forceLoadVoices(); // Force voice loading
        synthesisReadyRef.current = true;
        setIsReadyState(true);
      }
    }
  };
}

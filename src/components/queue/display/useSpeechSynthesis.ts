
import { useEffect, useState, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingQueue = useRef<string[]>([]);
  const processingRef = useRef(false);
  const synthesisReadyRef = useRef(false);

  // Make sure voices are loaded
  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis) {
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
    
    // Initial load attempt
    loadVoices();
    
    // Setup event handler for when voices are loaded later
    if (window.speechSynthesis?.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Reset speech synthesis on load to clear any stuck utterances
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Ensure speech synthesis is not paused when page visibility changes
    const handleVisibilityChange = () => {
      if (window.speechSynthesis) {
        if (document.hidden) {
          window.speechSynthesis.pause();
          console.log("Speech synthesis paused due to tab visibility change");
        } else {
          window.speechSynthesis.resume();
          console.log("Speech synthesis resumed due to tab visibility change");
          
          // Process queue after resuming
          setTimeout(() => {
            processQueue();
          }, 500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up recurring check to ensure synthesis hasn't stalled
    const checkSynthesisInterval = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking && speakingQueue.current.length > 0) {
        console.log("Speech synthesis may have stalled. Restarting queue processing...");
        processingRef.current = false;
        setTimeout(processQueue, 100);
      }
    }, 3000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkSynthesisInterval);
    };
  }, []);

  // Process the speech queue
  const processQueue = useCallback(() => {
    if (speakingQueue.current.length > 0 && !processingRef.current && window.speechSynthesis) {
      processingRef.current = true;
      const text = speakingQueue.current.shift()!;
      
      // Skip empty text
      if (!text || text.trim() === '') {
        processingRef.current = false;
        setTimeout(processQueue, 100);
        return;
      }
      
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const speech = new SpeechSynthesisUtterance(text);
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
        
        console.log(`Speaking (voice: ${speech.voice?.name || 'Default'}, lang: ${speech.lang}): "${speech.text}"`);
        
        // Set up speech events to track speaking state
        speech.onstart = () => {
          setIsSpeaking(true);
          console.log("Speech started");
        };
        
        speech.onend = () => {
          setIsSpeaking(false);
          console.log("Speech ended");
          processingRef.current = false;
          // Continue processing the queue after a short delay
          setTimeout(processQueue, 300);
        };
        
        speech.onerror = (event) => {
          console.error("Speech error:", event);
          setIsSpeaking(false);
          processingRef.current = false;
          // Try to continue processing the queue even after an error
          setTimeout(processQueue, 500);
        };
        
        // Ensure utterance is spoken and not ignored by the browser
        window.speechSynthesis.speak(speech);
      } catch (error) {
        console.error("Error speaking:", error);
        processingRef.current = false;
        // Try to continue processing the queue even after an error
        setTimeout(processQueue, 500);
      }
    }
  }, [voices]);

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
    
    // Initialize speech synthesis if needed
    if (!synthesisReadyRef.current) {
      window.speechSynthesis.getVoices();
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
    speakingQueue.current.push(announcementText);
    
    // Start processing queue if not already processing
    if (!processingRef.current) {
      processQueue();
    }
    
    return announcementText;
  }, [voices, processQueue]);

  return { announceTicket, isSpeaking };
}

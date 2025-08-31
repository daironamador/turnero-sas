import { useCallback, useState, useRef, useEffect } from 'react';
import { findBestSpanishVoice, createAnnouncementText } from '../utils/voiceUtils';
import { toast } from 'sonner';

interface SpeechConfig {
  volume: number;
  rate: number;
  pitch: number;
  lang: string;
}

export function useRobustSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  
  const defaultConfig: SpeechConfig = {
    volume: 1,
    rate: 0.9,
    pitch: 1,
    lang: 'es-419'
  };

  // Load voices with retry logic
  const loadVoices = useCallback((): boolean => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      return false;
    }

    try {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      if (availableVoices.length > 0) {
        const spanishVoices = availableVoices.filter(v => v.lang.includes('es'));
        console.log(`Loaded ${availableVoices.length} voices, ${spanishVoices.length} Spanish`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error loading voices:", error);
      return false;
    }
  }, []);

  // Initialize speech synthesis
  const initialize = useCallback(async (): Promise<void> => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    if (isInitialized) {
      return Promise.resolve();
    }

    initPromiseRef.current = new Promise<void>((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      try {
        window.speechSynthesis.cancel();
        
        const testUtterance = new SpeechSynthesisUtterance(' ');
        testUtterance.volume = 0.01;

        const timeout = setTimeout(() => {
          reject(new Error('Initialization timeout'));
        }, 5000);

        testUtterance.onend = () => {
          clearTimeout(timeout);
          setIsInitialized(true);
          resolve();
        };

        testUtterance.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };

        window.speechSynthesis.speak(testUtterance);
      } catch (error) {
        reject(error);
      }
    });

    try {
      await initPromiseRef.current;
    } finally {
      initPromiseRef.current = null;
    }
  }, [isInitialized]);

  // Announce ticket with robust error handling
  const announceTicket = useCallback(async (
    ticketNumber: string,
    counterName: string,
    redirectedFrom?: string,
    originalRoomName?: string
  ): Promise<void> => {
    try {
      // Ensure initialized
      await initialize();

      // Cancel any ongoing speech
      if (currentUtteranceRef.current) {
        window.speechSynthesis.cancel();
        currentUtteranceRef.current = null;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const text = createAnnouncementText(
        ticketNumber,
        counterName,
        redirectedFrom,
        originalRoomName
      );

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;

      // Configure utterance
      Object.assign(utterance, defaultConfig);
      
      const bestVoice = findBestSpanishVoice(voices);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      }

      return new Promise<void>((resolve, reject) => {
        let resolved = false;

        const cleanup = () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          currentUtteranceRef.current = null;
          setIsSpeaking(false);
        };

        const handleSuccess = () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve();
          }
        };

        const handleError = (error: unknown) => {
          if (!resolved) {
            resolved = true;
            cleanup();
            console.error('Speech error:', error);
            toast.error('Error en anuncio de voz');
            reject(error);
          }
        };

        utterance.onstart = () => {
          setIsSpeaking(true);
          console.log('Speech started:', text);
        };

        utterance.onend = handleSuccess;
        utterance.onerror = handleError;

        // Set timeout as fallback
        timeoutRef.current = setTimeout(() => {
          handleError(new Error('Speech timeout'));
        }, 10000);

        // Speak with retry logic
        try {
          window.speechSynthesis.speak(utterance);
          
          // Verify speech started
          setTimeout(() => {
            if (!window.speechSynthesis.speaking && currentUtteranceRef.current === utterance) {
              console.log('Retrying speech...');
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(utterance);
              
              // Final fallback
              setTimeout(() => {
                if (!window.speechSynthesis.speaking && currentUtteranceRef.current === utterance) {
                  handleError(new Error('Failed to start speech'));
                }
              }, 1000);
            }
          }, 500);
        } catch (error) {
          handleError(error);
        }
      });
    } catch (error) {
      console.error('Error announcing ticket:', error);
      setIsSpeaking(false);
      throw error;
    }
  }, [initialize, voices]);

  // Initialize on mount
  useEffect(() => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not available');
      return;
    }

    // Load voices immediately
    loadVoices();

    // Set up voice change listener
    const handleVoicesChanged = () => {
      console.log('Voices changed, reloading...');
      loadVoices();
    };

    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

    // Periodic voice reload
    const voiceInterval = setInterval(() => {
      if (voices.length === 0) {
        loadVoices();
      }
    }, 2000);

    // Cleanup stuck speech states
    const cleanupInterval = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        if (isSpeaking) {
          setIsSpeaking(false);
        }
      }
    }, 5000);

    return () => {
      clearInterval(voiceInterval);
      clearInterval(cleanupInterval);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [loadVoices, voices.length, isSpeaking]);

  return {
    announceTicket,
    isSpeaking,
    isInitialized,
    voices: voices.length > 0,
    initialize
  };
}
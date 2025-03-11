
import { useCallback, useRef } from 'react';
import { findBestSpanishVoice } from '../utils/voiceUtils';

interface UseSpeechQueueProps {
  voices: SpeechSynthesisVoice[];
  setIsSpeaking: (speaking: boolean) => void;
}

export function useSpeechQueue({ voices, setIsSpeaking }: UseSpeechQueueProps) {
  const speakingQueue = useRef<string[]>([]);
  const processingRef = useRef(false);
  
  // Process the speech queue
  const processQueue = useCallback(() => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not available");
      return;
    }
    
    if (speakingQueue.current.length > 0 && !processingRef.current) {
      processingRef.current = true;
      const text = speakingQueue.current.shift()!;
      
      // Skip empty text
      if (!text || text.trim() === '') {
        processingRef.current = false;
        setTimeout(processQueue, 100);
        return;
      }
      
      try {
        // Cancel any ongoing speech to avoid queuing problems
        window.speechSynthesis.cancel();
        
        const speech = new SpeechSynthesisUtterance(text);
        speech.volume = 1;
        speech.rate = 0.9;
        speech.pitch = 1;
        
        // Find the best voice for Spanish
        const bestVoice = findBestSpanishVoice(voices);
        
        if (bestVoice) {
          speech.voice = bestVoice;
          speech.lang = bestVoice.lang;
        } else {
          // Last resort: use default voice but set language to Spanish Latin America
          speech.lang = 'es-419'; // Spanish Latin America
          console.log("No Spanish voices found, using default voice with Spanish language");
        }
        
        console.log(`Speaking (voice: ${speech.voice?.name || 'Default'}, lang: ${speech.lang}): "${text}"`);
        
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
          setTimeout(() => {
            if (speakingQueue.current.length > 0) {
              processQueue();
            }
          }, 300);
        };
        
        speech.onerror = (event) => {
          console.error("Speech error:", event);
          setIsSpeaking(false);
          processingRef.current = false;
          // Try to continue processing the queue even after an error
          setTimeout(() => {
            if (speakingQueue.current.length > 0) {
              processQueue();
            }
          }, 500);
        };
        
        // Ensure utterance is spoken
        window.speechSynthesis.speak(speech);
      } catch (error) {
        console.error("Error speaking:", error);
        processingRef.current = false;
        // Try to continue processing the queue even after an error
        setTimeout(() => {
          if (speakingQueue.current.length > 0) {
            processQueue();
          }
        }, 500);
      }
    }
  }, [voices, setIsSpeaking]);

  // Queue a new text to be spoken
  const queueSpeech = useCallback((text: string) => {
    speakingQueue.current.push(text);
    
    // Start processing queue if not already processing
    if (!processingRef.current) {
      processQueue();
    }
  }, [processQueue]);

  return {
    queueSpeech,
    isProcessing: () => processingRef.current,
    queueLength: () => speakingQueue.current.length
  };
}

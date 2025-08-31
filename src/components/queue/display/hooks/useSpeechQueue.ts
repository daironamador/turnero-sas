
import { useCallback, useRef, useState } from 'react';
import { findBestSpanishVoice } from '../utils/voiceUtils';
import { toast } from 'sonner';

interface UseSpeechQueueProps {
  voices: SpeechSynthesisVoice[];
  setIsSpeaking: (speaking: boolean) => void;
}

export function useSpeechQueue({ voices, setIsSpeaking }: UseSpeechQueueProps) {
  const speakingQueue = useRef<string[]>([]);
  const processingRef = useRef(false);
  const [isProcessingState, setIsProcessingState] = useState(false);
  const attemptCountRef = useRef<Map<string, number>>(new Map());
  const maxAttempts = 3;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Process the speech queue
  const processQueue = useCallback(() => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not available");
      return;
    }
    
    if (speakingQueue.current.length > 0 && !processingRef.current) {
      processingRef.current = true;
      setIsProcessingState(true);
      const text = speakingQueue.current.shift()!;
      
      // Skip empty text
      if (!text || text.trim() === '') {
        processingRef.current = false;
        setIsProcessingState(false);
        setTimeout(processQueue, 100);
        return;
      }
      
      try {
        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();
        
        const speech = new SpeechSynthesisUtterance(text);
        utteranceRef.current = speech;
        
        speech.volume = 1;
        speech.rate = 0.9; // Slightly slower for better clarity
        speech.pitch = 1;
        
        // Find the best voice for Spanish
        const bestVoice = findBestSpanishVoice(voices);
        
        if (bestVoice) {
          speech.voice = bestVoice;
          speech.lang = bestVoice.lang;
          console.log(`Using voice: ${bestVoice.name}, language: ${bestVoice.lang}`);
        } else {
          // Last resort: use default voice but set language to Spanish Latin America
          speech.lang = 'es-419'; // Spanish Latin America
          console.log("No Spanish voices found, using default voice with Spanish language");
        }
        
        console.log(`Speaking (voice: ${speech.voice?.name || 'Default'}, lang: ${speech.lang}): "${text}"`);
        
        // Reset speech synthesis if it's in a paused state
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
        // Set up speech events to track speaking state
        speech.onstart = () => {
          setIsSpeaking(true);
          console.log("Speech started");
        };
        
        speech.onend = () => {
          setIsSpeaking(false);
          console.log("Speech ended successfully");
          processingRef.current = false;
          setIsProcessingState(false);
          utteranceRef.current = null;
          
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
          utteranceRef.current = null;
          
          // Try again if we haven't reached max attempts
          const textKey = text.substring(0, 20); // Use part of the text as key
          const attempts = attemptCountRef.current.get(textKey) || 0;
          
          if (attempts < maxAttempts) {
            console.log(`Retrying speech attempt ${attempts + 1}/${maxAttempts}`);
            attemptCountRef.current.set(textKey, attempts + 1);
            
            // Put the text back at the front of the queue
            speakingQueue.current.unshift(text);
          } else {
            console.warn(`Max retry attempts reached for speech: "${textKey}..."`);
            attemptCountRef.current.delete(textKey);
            toast.error("Error al reproducir anuncio de voz");
          }
          
          processingRef.current = false;
          setIsProcessingState(false);
          
          // Try to continue processing the queue even after an error
          setTimeout(() => {
            if (speakingQueue.current.length > 0) {
              processQueue();
            }
          }, 500);
        };
        
        // Ensure utterance is spoken
        window.speechSynthesis.speak(speech);
        
        // Double-check that speech synthesis is active after a short delay
        const retryTimeout = setTimeout(() => {
          if (!window.speechSynthesis.speaking && processingRef.current && utteranceRef.current === speech) {
            console.log("Speech didn't start properly, retrying...");
            
            try {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(speech);
              
              // If it still doesn't start after another attempt, fail gracefully
              setTimeout(() => {
                if (!window.speechSynthesis.speaking && utteranceRef.current === speech) {
                  console.error("Speech failed to start after retry, skipping...");
                  processingRef.current = false;
                  setIsProcessingState(false);
                  utteranceRef.current = null;
                  
                  // Continue with next item in queue
                  setTimeout(processQueue, 500);
                }
              }, 1000);
            } catch (error) {
              console.error("Error during speech retry:", error);
              processingRef.current = false;
              setIsProcessingState(false);
              utteranceRef.current = null;
              setTimeout(processQueue, 500);
            }
          }
        }, 500);
        
        // Store timeout reference for cleanup
        speech.addEventListener('start', () => clearTimeout(retryTimeout));
        speech.addEventListener('end', () => clearTimeout(retryTimeout));
        speech.addEventListener('error', () => clearTimeout(retryTimeout));
        
      } catch (error) {
        console.error("Error speaking:", error);
        processingRef.current = false;
        setIsProcessingState(false);
        utteranceRef.current = null;
        
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
    console.log("Queueing speech:", text);
    
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not available, cannot queue speech");
      return;
    }
    
    speakingQueue.current.push(text);
    
    // Start processing queue if not already processing
    if (!processingRef.current) {
      processQueue();
    }
  }, [processQueue]);

  return {
    queueSpeech,
    isProcessing: isProcessingState,
    queueLength: speakingQueue.current.length
  };
}

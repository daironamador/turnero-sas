
import { useCallback, useState, useRef } from 'react';
import { findBestSpanishVoice, createAnnouncementText } from '../utils/voiceUtils';
import { useSpeechConfig } from './useSpeechConfig';
import { toast } from 'sonner';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { getConfig } = useSpeechConfig();
  const lastAnnouncementRef = useRef<string | null>(null);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  
  const initializeAudio = useCallback(async (): Promise<void> => {
    // Return existing promise if initialization is in progress
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }
    
    // Return immediately if already initialized
    if (isInitialized) {
      return Promise.resolve();
    }
    
    // Create new initialization promise
    initializationPromiseRef.current = new Promise<void>((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }
      
      try {
        // Clear any pending speech
        window.speechSynthesis.cancel();
        
        // Test with a silent utterance
        const testUtterance = new SpeechSynthesisUtterance(' ');
        testUtterance.volume = 0.01;
        
        testUtterance.onend = () => {
          setIsInitialized(true);
          resolve();
        };
        
        testUtterance.onerror = (error) => {
          console.error('Speech synthesis initialization failed:', error);
          reject(error);
        };
        
        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error('Speech synthesis initialization timeout'));
        }, 3000);
        
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
      await initializationPromiseRef.current;
    } finally {
      initializationPromiseRef.current = null;
    }
  }, [isInitialized]);
  
  const announceTicket = useCallback(async (
    ticketNumber: string,
    counterName: string,
    redirectedFrom?: string,
    originalRoomName?: string
  ): Promise<string> => {
    try {
      // Ensure audio is initialized
      await initializeAudio();
      
      const announcementText = createAnnouncementText(
        ticketNumber,
        counterName,
        redirectedFrom,
        originalRoomName
      );
      
      // Prevent duplicate announcements
      if (lastAnnouncementRef.current === announcementText) {
        console.log('Skipping duplicate announcement');
        return announcementText;
      }
      
      lastAnnouncementRef.current = announcementText;
      
      // Clear any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create and configure utterance
      const utterance = new SpeechSynthesisUtterance(announcementText);
      const config = getConfig();
      
      utterance.volume = config.volume;
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.lang = config.lang;
      
      // Set voice if available
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = findBestSpanishVoice(voices);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      // Set up event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('Speech started:', announcementText);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('Speech ended');
        // Clear last announcement after a delay to allow re-announcements
        setTimeout(() => {
          lastAnnouncementRef.current = null;
        }, 3000);
      };
      
      utterance.onerror = (error) => {
        setIsSpeaking(false);
        console.error('Speech error:', error);
        toast.error('Error en el anuncio de voz');
        lastAnnouncementRef.current = null;
      };
      
      // Speak the utterance
      window.speechSynthesis.speak(utterance);
      
      return announcementText;
    } catch (error) {
      console.error('Error announcing ticket:', error);
      setIsSpeaking(false);
      lastAnnouncementRef.current = null;
      toast.error('Error al inicializar anuncio de voz');
      throw error;
    }
  }, [initializeAudio, getConfig]);
  
  return {
    announceTicket,
    isSpeaking,
    isInitialized,
    initializeAudio
  };
}

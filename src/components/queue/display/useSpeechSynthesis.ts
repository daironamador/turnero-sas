import { useCallback, useState, useEffect, useRef } from 'react';
import { useSpeechInit } from './hooks/useSpeechInit';
import { useSpeechQueue } from './hooks/useSpeechQueue';
import { formatTicketNumber } from './utils/voiceUtils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AnnouncementRecord {
  text: string;
  timestamp: number;
}

export function useSpeechSynthesis() {
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const { voices, isReady, initialize } = useSpeechInit();
  const { queueSpeech, isProcessing } = useSpeechQueue({ 
    voices, 
    setIsSpeaking: (speaking) => setIsSpeakingState(speaking) 
  });
  const lastAnnouncementRef = useRef<AnnouncementRecord | null>(null);
  const useNativeRef = useRef<boolean>(true);
  const audioInitializedRef = useRef<boolean>(false);
  
  // Initialize speech synthesis when component mounts
  useEffect(() => {
    const initAudio = async () => {
      if (!isReady && !audioInitializedRef.current) {
        console.log("Initializing speech synthesis...");
        
        try {
          // Request audio permission early
          await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Initialize speech synthesis
          await initialize();
          
          // Test audio system
          const testUtterance = new SpeechSynthesisUtterance(" ");
          testUtterance.volume = 0.1;
          testUtterance.onend = () => {
            console.log("Audio system initialized successfully");
            audioInitializedRef.current = true;
          };
          testUtterance.onerror = (error) => {
            console.error("Audio initialization error:", error);
            useNativeRef.current = false;
            toast.error("Error al inicializar audio, usando alternativa");
          };
          
          window.speechSynthesis.speak(testUtterance);
        } catch (error) {
          console.error("Failed to initialize audio:", error);
          useNativeRef.current = false;
          toast.error("Error al inicializar audio");
        }
      }
    };

    initAudio();
    
    // Keep audio system alive
    const keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    }, 5000);

    return () => clearInterval(keepAliveInterval);
  }, [isReady, initialize]);

  // Handle visibility changes to prevent audio from getting stuck
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (window.speechSynthesis?.speaking) {
          window.speechSynthesis.pause();
        }
      } else {
        window.speechSynthesis?.resume();
        if (!audioInitializedRef.current) {
          initialize();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [initialize]);

  // Function to test if speech synthesis works properly
  const testSpeechSynthesis = useCallback(() => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported in this browser");
      useNativeRef.current = false;
      return;
    }
    
    try {
      const testUtterance = new SpeechSynthesisUtterance(" ");
      testUtterance.volume = 0.1;
      testUtterance.onend = () => {
        console.log("Speech synthesis test successful");
        useNativeRef.current = true;
      };
      testUtterance.onerror = (error) => {
        console.error("Speech synthesis test failed:", error);
        useNativeRef.current = false;
        toast.error("Error al inicializar el sistema de voz, usando fallback");
      };
      window.speechSynthesis.speak(testUtterance);
    } catch (error) {
      console.error("Error during speech synthesis test:", error);
      useNativeRef.current = false;
    }
  }, []);

  // Function to use the OpenAI TTS API via Supabase Edge Function
  const useOpenAITTS = useCallback(async (text: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { text, voice: 'nova' },
      });
      
      if (error) {
        console.error("OpenAI TTS API error:", error);
        return false;
      }
      
      if (data?.audioContent) {
        const audioBlob = b64ToBlob(data.audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);
        
        audioElement.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeakingState(false);
        };
        
        audioElement.onplay = () => {
          setIsSpeakingState(true);
        };
        
        audioElement.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeakingState(false);
          console.error("Error playing audio from OpenAI TTS");
          return false;
        };
        
        // Play the audio
        setIsSpeakingState(true);
        audioElement.play();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error using OpenAI TTS:", error);
      return false;
    }
  }, []);

  // Helper to convert base64 to blob
  const b64ToBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  };

  // Function to announce ticket via speech synthesis
  const announceTicket = useCallback(async (
    ticketNumber: string, 
    counterName: string, 
    redirectedFrom?: string, 
    originalRoomName?: string
  ) => {
    if (!window.speechSynthesis && !supabase) {
      console.error("Speech synthesis not supported and no fallback available");
      return;
    }
    
    // Format the ticket number for better pronunciation
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
    
    // Avoid repeating the exact same announcement too quickly
    if (lastAnnouncementRef.current && lastAnnouncementRef.current.text === announcementText) {
      const timeSinceLastAnnouncement = Date.now() - lastAnnouncementRef.current.timestamp;
      if (timeSinceLastAnnouncement < 5000) { // 5 seconds
        console.log("Skipping duplicate announcement that was just made");
        return announcementText;
      }
    }
    
    // Update the last announcement with text and timestamp
    lastAnnouncementRef.current = {
      text: announcementText,
      timestamp: Date.now()
    };
    
    console.log(`Announcing: "${announcementText}" using ${useNativeRef.current ? 'native' : 'OpenAI'} synthesis`);
    
    if (useNativeRef.current) {
      // Use native speech synthesis
      try {
        queueSpeech(announcementText);
      } catch (error) {
        console.error("Native speech synthesis failed:", error);
        useNativeRef.current = false;
        
        // Try OpenAI TTS as fallback
        const success = await useOpenAITTS(announcementText);
        if (!success) {
          toast.error("Error al reproducir el anuncio de voz");
        }
      }
    } else {
      // Use OpenAI TTS directly
      const success = await useOpenAITTS(announcementText);
      if (!success) {
        // Try native synthesis as a last resort
        try {
          queueSpeech(announcementText);
        } catch (error) {
          console.error("Both speech synthesis methods failed:", error);
          toast.error("Error al reproducir el anuncio de voz");
        }
      }
    }
    
    return announcementText;
  }, [queueSpeech, useOpenAITTS]);

  return { 
    announceTicket, 
    isSpeaking: isSpeakingState,
    isProcessing: isProcessing,
    isInitialized: audioInitializedRef.current
  };
}


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
  const initializationAttempts = useRef<number>(0);
  const maxInitAttempts = 3;
  
  // Función para inicializar el sistema de audio
  const initializeAudio = useCallback(async () => {
    if (audioInitializedRef.current) {
      console.log("El audio ya está inicializado, no es necesario reinicializar");
      return;
    }
    
    if (initializationAttempts.current >= maxInitAttempts) {
      console.warn(`Demasiados intentos de inicialización (${initializationAttempts.current}/${maxInitAttempts}), cambiando a modo alternativo`);
      useNativeRef.current = false;
      return;
    }
    
    initializationAttempts.current++;
    console.log(`Inicializando sistema de audio (intento ${initializationAttempts.current}/${maxInitAttempts})...`);
    
    try {
      // Solicitar permiso de audio temprano
      if (navigator.mediaDevices) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("Permiso de audio concedido");
        } catch (error) {
          console.warn("No se pudo acceder al audio:", error);
          // Continuar de todos modos, ya que sólo necesitamos reproducción, no grabación
        }
      }
      
      // Inicializar el sistema de síntesis de voz
      await initialize();
      
      // Si ya tenemos voces, considerar el sistema inicializado
      if (voices.length > 0) {
        audioInitializedRef.current = true;
        return;
      }
      
      // Probar el sistema de audio con una utterance silenciosa
      const testUtterance = new SpeechSynthesisUtterance(" ");
      testUtterance.volume = 0.1;
      
      // Crear una promesa que se resuelva cuando termine la utterance o falle
      await new Promise<void>((resolve, reject) => {
        testUtterance.onend = () => {
          console.log("Sistema de audio inicializado correctamente");
          audioInitializedRef.current = true;
          resolve();
        };
        
        testUtterance.onerror = (error) => {
          console.error("Error en la inicialización del audio:", error);
          reject(error);
        };
        
        // Establecer un timeout por si la utterance no termina
        const timeout = setTimeout(() => {
          console.warn("Timeout en la inicialización del audio");
          reject(new Error("Timeout en la inicialización del audio"));
        }, 3000);
        
        // Hablar y limpiar el timeout cuando termine
        window.speechSynthesis.speak(testUtterance);
        
        testUtterance.onend = () => {
          clearTimeout(timeout);
          console.log("Sistema de audio inicializado correctamente");
          audioInitializedRef.current = true;
          resolve();
        };
        
        testUtterance.onerror = (error) => {
          clearTimeout(timeout);
          console.error("Error en la inicialización del audio:", error);
          reject(error);
        };
      });
      
    } catch (error) {
      console.error("Error al inicializar el audio:", error);
      
      // Intentar nuevamente después de un retraso si no hemos alcanzado el máximo
      if (initializationAttempts.current < maxInitAttempts) {
        const retryDelay = 1000 * Math.pow(2, initializationAttempts.current - 1); // Backoff exponencial
        console.log(`Reintentando inicialización en ${retryDelay}ms...`);
        setTimeout(() => {
          initializeAudio();
        }, retryDelay);
      } else {
        useNativeRef.current = false;
        toast.error("Error al inicializar audio, usando alternativa");
      }
    }
  }, [voices, isReady, initialize]);
  
  // Inicializar la síntesis de voz cuando el componente se monta
  useEffect(() => {
    initializeAudio();
    
    // Mantener vivo el sistema de audio
    const keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    }, 5000);

    return () => clearInterval(keepAliveInterval);
  }, [initializeAudio]);

  // Manejar cambios de visibilidad para evitar que el audio se quede atascado
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (window.speechSynthesis?.speaking) {
          window.speechSynthesis.pause();
        }
      } else {
        window.speechSynthesis?.resume();
        if (!audioInitializedRef.current) {
          initializeAudio();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [initializeAudio]);

  // Función para probar si la síntesis de voz funciona correctamente
  const testSpeechSynthesis = useCallback(() => {
    if (!window.speechSynthesis) {
      console.error("La síntesis de voz no está soportada en este navegador");
      useNativeRef.current = false;
      return false;
    }
    
    try {
      const testUtterance = new SpeechSynthesisUtterance("Prueba de audio");
      testUtterance.volume = 0.5;
      testUtterance.onend = () => {
        console.log("Prueba de síntesis de voz exitosa");
        useNativeRef.current = true;
        return true;
      };
      testUtterance.onerror = (error) => {
        console.error("Error en la prueba de síntesis de voz:", error);
        useNativeRef.current = false;
        toast.error("Error al inicializar el sistema de voz, usando fallback");
        return false;
      };
      window.speechSynthesis.cancel(); // Limpiar cualquier síntesis pendiente
      window.speechSynthesis.speak(testUtterance);
      return true;
    } catch (error) {
      console.error("Error durante la prueba de síntesis de voz:", error);
      useNativeRef.current = false;
      return false;
    }
  }, []);

  // Función para usar la API TTS de OpenAI a través de Supabase Edge Function
  const useOpenAITTS = useCallback(async (text: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { text, voice: 'nova' },
      });
      
      if (error) {
        console.error("Error en la API TTS de OpenAI:", error);
        return false;
      }
      
      if (data?.audioContent) {
        const audioBlob = b64ToBlob(data.audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);
        
        // Amplificar el volumen
        audioElement.volume = 1.0;
        
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
          console.error("Error al reproducir audio desde OpenAI TTS");
          return false;
        };
        
        // Reproducir el audio
        setIsSpeakingState(true);
        
        // Forzar la reproducción, incluso en móviles
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error al reproducir audio:", error);
            
            // Intentar reproducir nuevamente con interacción de usuario
            document.addEventListener('click', function playOnClick() {
              audioElement.play();
              document.removeEventListener('click', playOnClick);
            }, { once: true });
            
            toast.error("Haz clic en la pantalla para permitir audio");
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error usando OpenAI TTS:", error);
      return false;
    }
  }, []);

  // Helper para convertir base64 a blob
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

  // Función para anunciar ticket mediante síntesis de voz
  const announceTicket = useCallback(async (
    ticketNumber: string, 
    counterName: string, 
    redirectedFrom?: string, 
    originalRoomName?: string
  ) => {
    console.log("Intentando anunciar ticket con:", { ticketNumber, counterName, redirectedFrom, originalRoomName });
    
    // Si no tenemos síntesis de voz y no hay fallback, fallar silenciosamente
    if (!window.speechSynthesis && !supabase) {
      console.error("La síntesis de voz no está soportada y no hay fallback disponible");
      return;
    }
    
    // Formatear el número de ticket para mejor pronunciación
    const formattedNumber = formatTicketNumber(ticketNumber);
    
    // Construir el texto del anuncio
    let announcementText = '';
    if (redirectedFrom && originalRoomName) {
      // Para tickets redirigidos
      announcementText = `Turno ${formattedNumber}, referido de ${originalRoomName}, pasar a ${counterName}`;
    } else {
      // Para tickets regulares
      announcementText = `Turno ${formattedNumber}, pasar a ${counterName}`;
    }
    
    // Evitar repetir el mismo anuncio demasiado rápido
    if (lastAnnouncementRef.current && lastAnnouncementRef.current.text === announcementText) {
      const timeSinceLastAnnouncement = Date.now() - lastAnnouncementRef.current.timestamp;
      if (timeSinceLastAnnouncement < 3000) { // 3 segundos
        console.log("Omitiendo anuncio duplicado reciente");
        return announcementText;
      }
    }
    
    // Actualizar el último anuncio con texto y timestamp
    lastAnnouncementRef.current = {
      text: announcementText,
      timestamp: Date.now()
    };
    
    console.log(`Anunciando: "${announcementText}" usando síntesis ${useNativeRef.current ? 'nativa' : 'OpenAI'}`);
    
    // Intentar inicializar el audio si aún no está inicializado
    if (!audioInitializedRef.current && useNativeRef.current) {
      try {
        await initializeAudio();
      } catch (error) {
        console.warn("No se pudo inicializar el audio:", error);
      }
    }
    
    if (useNativeRef.current) {
      // Usar síntesis de voz nativa
      try {
        // Cancelar cualquier síntesis en curso
        window.speechSynthesis.cancel();
        
        // Crear y configurar la utterance
        const utterance = new SpeechSynthesisUtterance(announcementText);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9; // Un poco más lento para mayor claridad
        utterance.pitch = 1.0;
        utterance.volume = 1.0; // Volumen máximo
        
        // Si tenemos voces disponibles, elegir una voz española
        if (voices.length > 0) {
          const spanishVoices = voices.filter(voice => voice.lang.startsWith('es'));
          if (spanishVoices.length > 0) {
            utterance.voice = spanishVoices[0];
          }
        }
        
        queueSpeech(announcementText);
        return announcementText;
      } catch (error) {
        console.error("Error en síntesis de voz nativa:", error);
        useNativeRef.current = false;
        
        // Intentar OpenAI TTS como fallback
        const success = await useOpenAITTS(announcementText);
        if (!success) {
          toast.error("Error al reproducir el anuncio de voz");
        }
      }
    } else {
      // Usar OpenAI TTS directamente
      const success = await useOpenAITTS(announcementText);
      if (!success) {
        // Intentar síntesis nativa como último recurso
        try {
          queueSpeech(announcementText);
        } catch (error) {
          console.error("Ambos métodos de síntesis de voz fallaron:", error);
          toast.error("Error al reproducir el anuncio de voz");
        }
      }
    }
    
    return announcementText;
  }, [queueSpeech, useOpenAITTS, voices, initializeAudio]);

  return { 
    announceTicket, 
    isSpeaking: isSpeakingState,
    isProcessing: isProcessing,
    isInitialized: audioInitializedRef.current,
    initializeAudio, // Exponemos esta función para inicializar manualmente
    testSpeechSynthesis // Exponemos esta función para probar manualmente
  };
}

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AudioInitializerProps {
  onAudioReady?: (ready: boolean) => void;
}

const AudioInitializer: React.FC<AudioInitializerProps> = ({ onAudioReady }) => {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeAudio = async (): Promise<boolean> => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return false;
    }

    setIsInitializing(true);

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Test with a very quiet utterance
      const testUtterance = new SpeechSynthesisUtterance(' ');
      testUtterance.volume = 0.01;
      testUtterance.rate = 1;
      testUtterance.lang = 'es-419';

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Audio initialization timeout');
          resolve(false);
        }, 2000);

        testUtterance.onend = () => {
          clearTimeout(timeout);
          setIsAudioReady(true);
          toast.success('Audio activado correctamente');
          resolve(true);
        };

        testUtterance.onerror = (error) => {
          clearTimeout(timeout);
          console.error('Audio initialization error:', error);
          toast.error('Error al activar audio');
          resolve(false);
        };

        window.speechSynthesis.speak(testUtterance);

        // Retry once if it doesn't start - faster retry for real-time
        setTimeout(() => {
          if (!window.speechSynthesis.speaking) {
            console.log('Retrying audio initialization...');
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(testUtterance);
          }
        }, 200);
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
      toast.error('Error al inicializar audio');
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  const handleInitializeClick = async () => {
    const success = await initializeAudio();
    if (onAudioReady) {
      onAudioReady(success);
    }
  };

  // Check if audio is already working
  useEffect(() => {
    const checkAudio = () => {
      if (window.speechSynthesis && window.speechSynthesis.getVoices().length > 0) {
        // Audio might be ready, but we still need user interaction
        return;
      }
    };

    checkAudio();
    
    // Listen for voices changed event
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = checkAudio;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // If audio is already ready, don't show the button
  if (isAudioReady) {
    return null;
  }

  // If speech synthesis is not supported, don't show the button
  if (!window.speechSynthesis) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleInitializeClick}
        disabled={isInitializing}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        {isInitializing ? (
          <>
            <VolumeX className="w-3 h-3 mr-1 animate-pulse" />
            Activando...
          </>
        ) : (
          <>
            <Volume2 className="w-3 h-3 mr-1" />
            Activar Audio
          </>
        )}
      </Button>
      <span className="text-xs text-muted-foreground">
        Requerido para anuncios de voz
      </span>
    </div>
  );
};

export default AudioInitializer;

import { useCallback, useRef } from 'react';

interface SpeechConfig {
  volume: number;
  rate: number;
  pitch: number;
  lang: string;
}

const DEFAULT_CONFIG: SpeechConfig = {
  volume: 1.0,
  rate: 0.9,
  pitch: 1.0,
  lang: 'es-ES'
};

export function useSpeechConfig() {
  const configRef = useRef<SpeechConfig>(DEFAULT_CONFIG);
  
  const updateConfig = useCallback((newConfig: Partial<SpeechConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
  }, []);
  
  const getConfig = useCallback(() => configRef.current, []);
  
  const resetConfig = useCallback(() => {
    configRef.current = DEFAULT_CONFIG;
  }, []);
  
  return {
    getConfig,
    updateConfig,
    resetConfig
  };
}


import React, { useEffect } from 'react';
import DisplayScreen from '@/components/queue/DisplayScreen';
import { Helmet } from 'react-helmet';

const Display: React.FC = () => {
  // Inicializar sintetizador de voz al cargar la página
  useEffect(() => {
    // Crear un objeto de síntesis de voz para inicializar el motor de voz
    // Esto es importante en algunos navegadores que requieren interacción del usuario
    const synth = window.speechSynthesis;
    // Obtener voces disponibles para precargarlas
    synth.getVoices();
    
    // Intentar inicializar el audio con un sonido silencioso
    const initAudio = () => {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      utterance.rate = 0;
      synth.speak(utterance);
    };
    
    // Inicializar en carga de página
    initAudio();
    
    return () => {
      // Limpiar al desmontar
      synth.cancel();
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Sistema de Turnos - Display</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <DisplayScreen />
    </>
  );
};

export default Display;

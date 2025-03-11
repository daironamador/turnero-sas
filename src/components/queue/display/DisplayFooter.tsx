
import React, { useState, useEffect } from 'react';
import { getCompanySettings } from '@/services/settingsService';
import { CompanySettings } from '@/lib/types';

const DisplayFooter: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cargar la configuración de la empresa
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getCompanySettings();
        setSettings(data);
      } catch (error) {
        console.error('Error al cargar la configuración:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  return (
    <div className="bg-ocular-800 text-white py-4">
      <div className="container mx-auto text-center">
        <p>{!loading && settings?.name ? settings.name : 'Centro Oftalmológico'}</p>
        <p className="mt-1 text-sm">
          Sistema de Gestión de Turnos creado por{' '}
          <a 
            href="https://daironamador.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-ocular-300 transition-colors"
          >
            Dairon Amador
          </a>
        </p>
      </div>
    </div>
  );
};

export default DisplayFooter;

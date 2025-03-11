
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CompanySettings } from '@/lib/types';
import { getCompanySettings } from '@/services/settingsService';

const DisplayHeader: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
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
  
  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gray-200 text-gray-800 p-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          {!loading && settings?.logo && (
            <img 
              src={settings.logo} 
              alt="Logo" 
              className="h-12 w-auto object-contain"
            />
          )}
          <h1 className="text-3xl font-bold">{settings?.name || 'Centro Oftalmológico'}</h1>
        </div>
        <div className="text-xl font-medium">{format(currentTime, "HH:mm - EEEE, dd 'de' MMMM, yyyy")}</div>
      </div>
    </div>
  );
};

export default DisplayHeader;

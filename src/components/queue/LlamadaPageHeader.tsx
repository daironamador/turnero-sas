
import React, { useState, useEffect } from 'react';
import { PhoneCall } from 'lucide-react';
import { CompanySettings } from '@/lib/types';
import { getCompanySettings } from '@/services/settingsService';

const LlamadaPageHeader: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getCompanySettings();
        setSettings(data);
      } catch (error) {
        console.error('Error al cargar la configuración:', error);
      }
    };
    
    loadSettings();
  }, []);

  return (
    <div className="mb-6 flex items-center">
      {settings?.logo && (
        <img 
          src={settings.logo} 
          alt="Logo" 
          className="h-10 w-auto mr-4 object-contain"
        />
      )}
      <h1 className="text-3xl font-bold flex items-center">
        <PhoneCall className="mr-2 h-6 w-6 text-primary" />
        Llamada de Tickets
      </h1>
    </div>
  );
};

export default LlamadaPageHeader;


import React from 'react';
import { PhoneCall } from 'lucide-react';

const LlamadaPageHeader: React.FC = () => {
  return (
    <div className="mb-6 bg-gradient-to-r from-ocular-600 to-ocular-700 p-6 rounded-lg shadow-md text-white">
      <h1 className="text-3xl font-bold flex items-center">
        <PhoneCall className="mr-3 h-7 w-7" />
        Llamada de Tickets
      </h1>
      <p className="mt-2 text-sm opacity-80">
        Gestione la atención de tickets y la llamada a pacientes
      </p>
    </div>
  );
};

export default LlamadaPageHeader;

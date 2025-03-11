
import React from 'react';
import { PhoneCall } from 'lucide-react';

const LlamadaPageHeader: React.FC = () => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold flex items-center">
        <PhoneCall className="mr-2 h-6 w-6 text-primary" />
        Llamada de Tickets
      </h1>
    </div>
  );
};

export default LlamadaPageHeader;

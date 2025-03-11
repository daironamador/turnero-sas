
import React from 'react';

const LlamadaError: React.FC = () => {
  return (
    <div className="p-4 border border-destructive rounded-md text-center">
      <p className="text-destructive">Error al cargar datos</p>
    </div>
  );
};

export default LlamadaError;

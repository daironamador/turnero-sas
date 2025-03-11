
import React from 'react';

const DisplayFooter: React.FC = () => {
  return (
    <div className="bg-ocular-800 text-white py-4">
      <div className="container mx-auto text-center">
        <p>Sistema de Gestión de Turnos • Centro Oftalmológico</p>
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

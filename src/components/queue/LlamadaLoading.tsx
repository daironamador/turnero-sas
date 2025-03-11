
import React from 'react';

const LlamadaLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default LlamadaLoading;

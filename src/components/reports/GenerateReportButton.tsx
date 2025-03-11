
import React from 'react';
import { Button } from '@/components/ui/button';

interface GenerateReportButtonProps {
  loading: boolean;
  onClick: () => void;
}

const GenerateReportButton: React.FC<GenerateReportButtonProps> = ({
  loading,
  onClick
}) => {
  return (
    <Button 
      className="w-full mb-6" 
      onClick={onClick}
      disabled={loading}
    >
      {loading ? 'Generando reporte...' : 'Generar Reporte'}
    </Button>
  );
};

export default GenerateReportButton;

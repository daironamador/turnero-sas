
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Printer } from 'lucide-react';

interface ReportActionsProps {
  loading: boolean;
  ticketsCount: number;
  onRefresh: () => void;
  onPrint: () => void;
}

const ReportActions: React.FC<ReportActionsProps> = ({
  loading,
  ticketsCount,
  onRefresh,
  onPrint
}) => {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Actualizar
      </Button>
      <Button 
        variant="outline" 
        onClick={onPrint}
        disabled={ticketsCount === 0}
      >
        <Printer className="w-4 h-4 mr-2" />
        Imprimir
      </Button>
    </div>
  );
};

export default ReportActions;

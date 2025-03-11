
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface TableControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onPrintReport: () => void;
}

const TableControls: React.FC<TableControlsProps> = ({ 
  searchTerm, 
  onSearchChange, 
  onPrintReport 
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <Input 
        placeholder="Buscar tickets..." 
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      
      <Button 
        onClick={onPrintReport}
        variant="outline" 
        className="flex items-center"
      >
        <Download className="w-4 h-4 mr-2" />
        Imprimir Reporte
      </Button>
    </div>
  );
};

export default TableControls;

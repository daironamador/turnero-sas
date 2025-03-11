
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReportTypeSelectorProps {
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  handleTabChange: (value: string) => void;
}

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  reportType,
  handleTabChange
}) => {
  return (
    <Tabs value={reportType} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="daily">Hoy</TabsTrigger>
        <TabsTrigger value="weekly">Esta Semana</TabsTrigger>
        <TabsTrigger value="monthly">Este Mes</TabsTrigger>
        <TabsTrigger value="yearly">Este Año</TabsTrigger>
        <TabsTrigger value="custom">Personalizado</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ReportTypeSelector;

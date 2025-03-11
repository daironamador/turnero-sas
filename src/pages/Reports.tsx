
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { printReport } from '@/utils/printUtils';
import ReportsTable from '@/components/reports/ReportsTable';
import ReportTypeSelector from '@/components/reports/ReportTypeSelector';
import DateRangeSelector from '@/components/reports/date/DateRangeSelector';
import GenerateReportButton from '@/components/reports/GenerateReportButton';
import NoData from '@/components/reports/NoData';
import ReportActions from '@/components/reports/ReportActions';
import { useReportData } from '@/hooks/useReportData';

const Reports: React.FC = () => {
  const {
    reportType,
    customRange,
    isCustomRangeOpen,
    loading,
    tickets,
    dateRange,
    setCustomRange,
    setIsCustomRangeOpen,
    setDateRange,
    fetchReportData,
    handleTabChange
  } = useReportData();

  const handlePrintReport = () => {
    printReport(tickets, dateRange.from, dateRange.to);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <ReportActions
            loading={loading}
            ticketsCount={tickets.length}
            onRefresh={fetchReportData}
            onPrint={handlePrintReport}
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Generar Reportes</CardTitle>
            <CardDescription>
              Seleccione el período para generar el reporte de tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportTypeSelector
              reportType={reportType}
              handleTabChange={handleTabChange}
            />
            
            <DateRangeSelector
              dateRange={dateRange}
              customRange={customRange}
              isCustomRangeOpen={isCustomRangeOpen}
              setIsCustomRangeOpen={setIsCustomRangeOpen}
              setCustomRange={setCustomRange}
              setDateRange={setDateRange}
              reportType={reportType}
            />
            
            {reportType === 'custom' && (
              <GenerateReportButton
                loading={loading}
                onClick={fetchReportData}
              />
            )}
            
            {tickets.length > 0 ? (
              <ReportsTable 
                tickets={tickets} 
                startDate={dateRange.from} 
                endDate={dateRange.to} 
              />
            ) : (
              <NoData loading={loading} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;

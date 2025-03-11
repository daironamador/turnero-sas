
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Calendar as CalendarIcon, Printer, Download, RefreshCw, BarChart3, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReportsTable from '@/components/reports/ReportsTable';
import { getTicketsReport } from '@/services/ticketService';
import { Ticket } from '@/lib/types';
import { printReport } from '@/utils/printUtils';
import { DateRange } from 'react-day-picker';

const Reports: React.FC = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const data = await getTicketsReport(dateRange.from, dateRange.to);
      setTickets(data);
      toast({
        title: "Reporte generado",
        description: `${data.length} tickets encontrados en el período seleccionado`,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar los datos del reporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    const today = new Date();
    let newDateRange = {from: new Date(), to: new Date()};
    
    switch(value) {
      case 'daily':
        newDateRange = {
          from: startOfDay(today),
          to: endOfDay(today)
        };
        break;
      case 'weekly':
        newDateRange = {
          from: startOfWeek(today, {weekStartsOn: 1}),
          to: endOfWeek(today, {weekStartsOn: 1})
        };
        break;
      case 'monthly':
        newDateRange = {
          from: startOfMonth(today),
          to: endOfMonth(today)
        };
        break;
      case 'yearly':
        newDateRange = {
          from: startOfYear(today),
          to: endOfYear(today)
        };
        break;
      case 'custom':
        if (customRange?.from) {
          newDateRange = {
            from: startOfDay(customRange.from),
            to: endOfDay(customRange.to || customRange.from)
          };
        }
        setIsCustomRangeOpen(true);
        break;
    }
    
    setReportType(value as any);
    setDateRange(newDateRange);
  };

  const handlePrintReport = () => {
    printReport(tickets, dateRange.from, dateRange.to);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchReportData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePrintReport}
              disabled={tickets.length === 0}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Generar Reportes</CardTitle>
            <CardDescription>
              Seleccione el período para generar el reporte de tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={reportType} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="daily">Hoy</TabsTrigger>
                <TabsTrigger value="weekly">Esta Semana</TabsTrigger>
                <TabsTrigger value="monthly">Este Mes</TabsTrigger>
                <TabsTrigger value="yearly">Este Año</TabsTrigger>
                <TabsTrigger value="custom">Personalizado</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium">Período seleccionado:</p>
                  <p className="text-2xl font-bold">
                    {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                  </p>
                </div>
                
                {reportType === 'custom' && (
                  <Popover open={isCustomRangeOpen} onOpenChange={setIsCustomRangeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="ml-auto">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Seleccionar fechas
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={customRange}
                        onSelect={(selectedRange) => {
                          setCustomRange(selectedRange);
                          if (selectedRange?.from) {
                            setDateRange({
                              from: startOfDay(selectedRange.from),
                              to: endOfDay(selectedRange.to || selectedRange.from)
                            });
                          }
                          setIsCustomRangeOpen(false);
                        }}
                        numberOfMonths={2}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              
              <Button 
                className="w-full mb-6" 
                onClick={fetchReportData}
                disabled={loading}
              >
                {loading ? 'Generando reporte...' : 'Generar Reporte'}
              </Button>
              
              {tickets.length > 0 ? (
                <ReportsTable tickets={tickets} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loading 
                    ? 'Cargando datos...' 
                    : 'Genere un reporte para ver los datos de tickets'}
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;

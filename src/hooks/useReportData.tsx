
import { useState, useEffect } from 'react';
import { Ticket } from '@/lib/types';
import { getTicketsReport, getReportByPeriod } from '@/services/ticketService';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear 
} from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export const useReportData = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });

  // Load data automatically on init
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Use the specific function for reports by period
      if (reportType === 'custom' && customRange?.from) {
        const data = await getTicketsReport(dateRange.from, dateRange.to);
        setTickets(data);
      } else {
        const data = await getReportByPeriod(reportType);
        setTickets(data);
      }
      
      toast({
        title: "Reporte generado",
        description: `${tickets.length} tickets encontrados en el período seleccionado`,
      });
    } catch (error) {
      console.error('Error al cargar datos del reporte:', error);
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
    
    setReportType(value as ReportType);
    setDateRange(newDateRange);
    
    // Generate report automatically when changing tabs
    // except for custom which requires selecting dates
    if (value !== 'custom') {
      setTimeout(() => {
        fetchReportData();
      }, 100);
    }
  };

  return {
    reportType,
    customRange,
    isCustomRangeOpen,
    loading,
    tickets,
    dateRange,
    setReportType,
    setCustomRange,
    setIsCustomRangeOpen,
    setLoading,
    setTickets,
    setDateRange,
    fetchReportData,
    handleTabChange
  };
};

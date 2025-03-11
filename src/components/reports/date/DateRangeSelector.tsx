import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface DateRangeSelectorProps {
  dateRange: { from: Date, to: Date };
  customRange: DateRange | undefined;
  isCustomRangeOpen: boolean;
  setIsCustomRangeOpen: (open: boolean) => void;
  setCustomRange: (range: DateRange | undefined) => void;
  setDateRange: (range: { from: Date, to: Date }) => void;
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  customRange,
  isCustomRangeOpen,
  setIsCustomRangeOpen,
  setCustomRange,
  setDateRange,
  reportType
}) => {
  return (
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
  );
};

export default DateRangeSelector;


import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Clock, 
  CalendarClock, 
  CheckCircle2, 
  XCircle, 
  User, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Appointment, Patient } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (id: string, status: Appointment['status']) => void;
  className?: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onStatusChange,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);

  const statusColor = {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    'no-show': 'bg-amber-100 text-amber-800 border-amber-200',
  };

  const typeLabels = {
    consultation: 'Consulta',
    examination: 'Examen',
    'follow-up': 'Seguimiento',
    surgery: 'Cirugía',
    other: 'Otro',
  };

  const handleStatusChange = (status: Appointment['status']) => {
    if (onStatusChange) {
      onStatusChange(appointment.id, status);
    }
  };

  return (
    <Card className={cn('hover-scale overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {appointment.patient?.firstName} {appointment.patient?.lastName}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <User className="w-3.5 h-3.5 mr-1" />
              ID: {appointment.patient?.recordNumber || 'N/A'}
            </CardDescription>
          </div>
          <Badge 
            className={cn(
              'px-2 py-1 font-medium border rounded-full',
              statusColor[appointment.status]
            )}
          >
            {appointment.status === 'scheduled' && 'Programado'}
            {appointment.status === 'completed' && 'Completado'}
            {appointment.status === 'cancelled' && 'Cancelado'}
            {appointment.status === 'no-show' && 'No asistió'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <CalendarClock className="w-4 h-4 mr-2 text-ocular-600" />
            <span>{format(appointment.date, 'EEEE, dd MMMM yyyy')}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 mr-2 text-ocular-600" />
            <span>{appointment.time} ({appointment.duration} min)</span>
          </div>
          
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {typeLabels[appointment.type]}
            </Badge>
          </div>
        </div>
        
        {expanded && appointment.doctorNotes && (
          <div className="mt-4 p-3 bg-muted rounded-md text-sm">
            <p className="font-medium text-xs uppercase text-muted-foreground mb-1">Notas:</p>
            <p>{appointment.doctorNotes}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2 pt-0">
        {appointment.status === 'scheduled' && (
          <div className="flex justify-between w-full gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleStatusChange('cancelled')}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-green-500 border-green-200 hover:bg-green-50 hover:text-green-700"
              onClick={() => handleStatusChange('completed')}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Completar
            </Button>
          </div>
        )}
        
        {appointment.doctorNotes && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Ocultar notas
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Ver notas
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AppointmentCard;

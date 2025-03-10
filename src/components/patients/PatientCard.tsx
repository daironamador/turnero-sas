
import React from 'react';
import { format } from 'date-fns';
import { Phone, Mail, Calendar, Clock } from 'lucide-react';
import { Patient } from '@/lib/types';
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

interface PatientCardProps {
  patient: Patient;
  onScheduleAppointment?: (patientId: string) => void;
  onViewDetails?: (patientId: string) => void;
  className?: string;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onScheduleAppointment,
  onViewDetails,
  className,
}) => {
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card className={cn('hover-scale', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {patient.firstName} {patient.lastName}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal">
            #{patient.recordNumber}
          </Badge>
          <span>{calculateAge(patient.birthDate)} años</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Phone className="w-4 h-4 mr-2 text-ocular-600" />
            <span>{patient.phone}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Mail className="w-4 h-4 mr-2 text-ocular-600" />
            <span className="text-sm">{patient.email}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 mr-2 text-ocular-600" />
            <span>Nacimiento: {format(patient.birthDate, 'dd/MM/yyyy')}</span>
          </div>
          
          {patient.lastVisit && (
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 mr-2 text-ocular-600" />
              <span>Última visita: {format(patient.lastVisit, 'dd/MM/yyyy')}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2 pt-0">
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails?.(patient.id)}
        >
          Ver detalles
        </Button>
        <Button 
          variant="default" 
          size="sm"
          className="flex-1"
          onClick={() => onScheduleAppointment?.(patient.id)}
        >
          Agendar turno
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PatientCard;

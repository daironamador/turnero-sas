
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Patient } from '@/lib/types';

// Mock data for demonstration
const mockPatients: Patient[] = [
  {
    id: '101',
    firstName: 'Ana',
    lastName: 'González',
    email: 'ana@example.com',
    phone: '555-123-4567',
    birthDate: new Date(1985, 5, 15),
    recordNumber: 'OCL-1001',
    createdAt: new Date(2022, 5, 10),
  },
  {
    id: '102',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    email: 'carlos@example.com',
    phone: '555-987-6543',
    birthDate: new Date(1972, 8, 21),
    recordNumber: 'OCL-1002',
    createdAt: new Date(2022, 6, 15),
  },
  {
    id: '103',
    firstName: 'María',
    lastName: 'Rodríguez',
    email: 'maria@example.com',
    phone: '555-456-7890',
    birthDate: new Date(1990, 3, 10),
    recordNumber: 'OCL-1003',
    createdAt: new Date(2022, 7, 20),
  },
];

const formSchema = z.object({
  patientId: z.string({
    required_error: 'Por favor seleccione un paciente',
  }),
  date: z.date({
    required_error: 'Por favor seleccione una fecha',
  }),
  time: z.string({
    required_error: 'Por favor seleccione una hora',
  }),
  duration: z.string({
    required_error: 'Por favor seleccione una duración',
  }),
  type: z.string({
    required_error: 'Por favor seleccione un tipo de turno',
  }),
  notes: z.string().optional(),
});

const AppointmentForm: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration: '30',
      type: 'consultation',
    },
  });
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Form values:', values);
    
    // In a real app, this would save the appointment
    
    toast({
      title: "Turno agendado",
      description: "El turno ha sido agendado exitosamente.",
    });
    
    setTimeout(() => {
      navigate('/appointments');
    }, 1500);
  }
  
  // Generate time options
  const generateTimeOptions = () => {
    const options = [];
    let hour = 8; // Starting at 8 AM
    
    while (hour < 19) { // Until 7 PM
      ['00', '30'].forEach(minutes => {
        const timeString = `${String(hour).padStart(2, '0')}:${minutes}`;
        options.push(timeString);
      });
      hour++;
    }
    
    return options;
  };
  
  const timeOptions = generateTimeOptions();

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agendar nuevo turno</h1>
        <p className="text-muted-foreground mt-1">Complete los detalles para agendar una nueva cita</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Paciente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} ({patient.recordNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Seleccione el paciente para este turno
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una hora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración (minutos)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione duración" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de turno</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="consultation">Consulta</SelectItem>
                      <SelectItem value="examination">Examen</SelectItem>
                      <SelectItem value="follow-up">Seguimiento</SelectItem>
                      <SelectItem value="surgery">Cirugía</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ingrese notas o detalles adicionales sobre el turno" 
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/appointments')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-ocular-600 hover:bg-ocular-700"
            >
              Agendar turno
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AppointmentForm;

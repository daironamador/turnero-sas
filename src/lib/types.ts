
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: Date;
  recordNumber: string;
  notes?: string;
  lastVisit?: Date;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  date: Date;
  time: string;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'consultation' | 'examination' | 'follow-up' | 'surgery' | 'other';
  doctorId?: string;
  doctorNotes?: string;
  createdAt: Date;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
  phone: string;
}

export interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  completedToday: number;
  cancelledToday: number;
  newPatientsToday: number;
}

export type ServiceType = 'CG' | 'RX' | 'RR' | 'EX' | 'OT';

export const ServiceTypeLabels: Record<ServiceType, string> = {
  CG: 'Consulta General',
  RX: 'Rayos X',
  RR: 'Recoger Resultados',
  EX: 'Exámenes',
  OT: 'Otros Servicios'
};

export interface Ticket {
  id: string;
  ticketNumber: string;
  serviceType: ServiceType;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled' | 'redirected';
  isVip?: boolean;
  createdAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  counterNumber?: number;
  patientName?: string;
  redirectedTo?: ServiceType;
  redirectedFrom?: ServiceType;
  previousTicketNumber?: string;
}

export interface QueueStatus {
  serviceType: ServiceType;
  currentTicket?: Ticket;
  waitingCount: number;
  lastCalledTicket?: Ticket;
}

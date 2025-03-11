
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
  counterNumber?: string | number; // Update to accept both string and number
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

export interface Service {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Room {
  id: string;
  number: string;
  name: string;
  serviceId: string;
  service?: Service;
  isActive: boolean;
  createdAt: Date;
}

export interface CompanySettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  ticketFooter?: string;
  displayMessage?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  isActive: boolean;
  serviceIds: string[];
  services?: Service[];
  createdAt: Date;
}

export type NotificationType = 'text' | 'image' | 'youtube';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  imageUrl?: string;
  youtubeUrl?: string;
  active: boolean;
  intervalInSeconds: number;
  createdAt: Date;
}

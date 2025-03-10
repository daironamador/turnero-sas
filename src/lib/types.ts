
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

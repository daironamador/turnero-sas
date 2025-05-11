
import { initializeFirebase } from '@/lib/firebase';
import { Ticket, ServiceType } from '@/lib/types';

// Helper function to convert Firestore ticket data to our Ticket type
const convertFirestoreTicket = (id: string, data: any): Ticket => {
  return {
    id,
    ticketNumber: data.ticket_number,
    serviceType: data.service_type as ServiceType,
    status: data.status,
    isVip: data.is_vip,
    createdAt: new Date(data.created_at),
    calledAt: data.called_at ? new Date(data.called_at) : undefined,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    counterNumber: data.counter_number,
    patientName: data.patient_name,
    redirectedTo: data.redirected_to,
    redirectedFrom: data.redirected_from,
    previousTicketNumber: data.previous_ticket_number,
  };
};

// Get tickets by status
export const getTicketsByStatus = async (status: string): Promise<Ticket[]> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    const ticketsRef = collection(db, 'tickets');
    const ticketsQuery = query(
      ticketsRef,
      where('status', '==', status),
      orderBy('created_at', 'asc')
    );
    
    const snapshot = await getDocs(ticketsQuery);
    
    return snapshot.docs.map(doc => convertFirestoreTicket(doc.id, doc.data()));
  } catch (error) {
    console.error(`Error getting ${status} tickets:`, error);
    return [];
  }
};

// Generate new ticket
export const generateTicket = async (
  serviceType: ServiceType,
  isVip: boolean,
  patientName?: string
): Promise<Ticket | null> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Get the last ticket number for this service type
    const ticketsRef = collection(db, 'tickets');
    const lastTicketQuery = query(
      ticketsRef,
      where('service_type', '==', serviceType),
      orderBy('created_at', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(lastTicketQuery);
    
    // Generate new ticket number
    const prefix = serviceType.substring(0, 1).toUpperCase();
    const nextNumber = snapshot.empty ? 1 : parseInt(snapshot.docs[0].data().ticket_number.substring(1)) + 1;
    const ticketNumber = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    
    // Create the new ticket
    const newTicket = {
      ticket_number: ticketNumber,
      service_type: serviceType,
      status: 'waiting',
      is_vip: isVip,
      created_at: new Date().toISOString(),
      patient_name: patientName || null,
      counter_number: null,
      called_at: null,
      completed_at: null,
      redirected_to: null,
      redirected_from: null,
      previous_ticket_number: null,
    };
    
    // Add to Firestore
    const docRef = await addDoc(ticketsRef, newTicket);
    
    // Return the created ticket
    return {
      id: docRef.id,
      ticketNumber,
      serviceType,
      status: 'waiting',
      isVip,
      createdAt: new Date(),
      patientName: patientName,
    };
  } catch (error) {
    console.error('Error generating ticket:', error);
    return null;
  }
};

// Call a ticket
export const callTicket = async (ticketId: string, counterNumber: string): Promise<boolean> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Update the ticket
    await updateDoc(doc(db, 'tickets', ticketId), {
      status: 'serving',
      counter_number: counterNumber,
      called_at: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error calling ticket:', error);
    throw new Error('No se pudo llamar al ticket');
  }
};

// Complete a ticket
export const completeTicket = async (ticketId: string): Promise<boolean> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Update the ticket
    await updateDoc(doc(db, 'tickets', ticketId), {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error completing ticket:', error);
    throw new Error('No se pudo completar el ticket');
  }
};

// Cancel a ticket
export const cancelTicket = async (ticketId: string): Promise<boolean> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Update the ticket
    await updateDoc(doc(db, 'tickets', ticketId), {
      status: 'cancelled',
      completed_at: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    throw new Error('No se pudo cancelar el ticket');
  }
};

// Redirect a ticket
export const redirectTicket = async (ticketId: string, newServiceType: ServiceType): Promise<boolean> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, getDoc, updateDoc, collection, addDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Get current ticket
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (!ticketSnap.exists()) {
      throw new Error('El ticket no existe');
    }
    
    const ticketData = ticketSnap.data();
    
    // Generate new ticket number for the redirected service
    const prefix = newServiceType.substring(0, 1).toUpperCase();
    const lastTicketQuery = query(
      collection(db, 'tickets'),
      where('service_type', '==', newServiceType),
      orderBy('created_at', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(lastTicketQuery);
    const nextNumber = snapshot.empty ? 1 : parseInt(snapshot.docs[0].data().ticket_number.substring(1)) + 1;
    const newTicketNumber = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    
    // Create new ticket
    const newTicket = {
      ticket_number: newTicketNumber,
      service_type: newServiceType,
      status: 'waiting',
      is_vip: ticketData.is_vip,
      created_at: new Date().toISOString(),
      patient_name: ticketData.patient_name,
      counter_number: null,
      called_at: null,
      completed_at: null,
      redirected_to: null,
      redirected_from: ticketData.service_type,
      previous_ticket_number: ticketData.ticket_number,
    };
    
    // Add new ticket to Firestore
    await addDoc(collection(db, 'tickets'), newTicket);
    
    // Update original ticket as redirected
    await updateDoc(ticketRef, {
      status: 'redirected',
      completed_at: new Date().toISOString(),
      redirected_to: newServiceType
    });
    
    return true;
  } catch (error) {
    console.error('Error redirecting ticket:', error);
    throw new Error('No se pudo redirigir el ticket');
  }
};

// Recall a ticket
export const recallTicket = async (ticketId: string, counterNumber: string): Promise<boolean> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, doc, getDoc, collection, addDoc } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Get current ticket
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (!ticketSnap.exists()) {
      throw new Error('El ticket no existe');
    }
    
    const ticketData = ticketSnap.data();
    
    // Create new ticket with same number but serving status
    const newTicket = {
      ticket_number: ticketData.ticket_number,
      service_type: ticketData.service_type,
      status: 'serving',
      is_vip: ticketData.is_vip,
      created_at: new Date().toISOString(),
      called_at: new Date().toISOString(),
      completed_at: null,
      counter_number: counterNumber,
      patient_name: ticketData.patient_name,
      redirected_to: null,
      redirected_from: null,
      previous_ticket_number: null,
    };
    
    // Add new ticket to Firestore
    const docRef = await addDoc(collection(db, 'tickets'), newTicket);
    
    return true;
  } catch (error) {
    console.error('Error recalling ticket:', error);
    throw new Error('No se pudo rellamar al ticket');
  }
};

// Get tickets for reports
export const getTicketsReport = async (startDate: Date, endDate: Date): Promise<Ticket[]> => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      throw new Error('Firebase not configured');
    }
    
    const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Query tickets within date range
    const ticketsRef = collection(db, 'tickets');
    const ticketsQuery = query(
      ticketsRef,
      where('created_at', '>=', startDate.toISOString()),
      where('created_at', '<=', endDate.toISOString())
    );
    
    const snapshot = await getDocs(ticketsQuery);
    
    return snapshot.docs.map(doc => convertFirestoreTicket(doc.id, doc.data()));
  } catch (error) {
    console.error('Error getting ticket report:', error);
    return [];
  }
};

// Get report by period
export const getReportByPeriod = async (period: string): Promise<Ticket[]> => {
  try {
    const now = new Date();
    let startDate: Date;
    
    switch(period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        // Set to Monday of current week
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    return await getTicketsReport(startDate, now);
  } catch (error) {
    console.error(`Error getting ${period} report:`, error);
    return [];
  }
};

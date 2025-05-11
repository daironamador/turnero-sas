
import { initializeFirebase } from '@/lib/firebase';

export const setupRealtimeSubscriptions = async () => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      console.warn('Firebase not configured, realtime subscriptions not set up');
      return () => {};
    }
    
    const { getFirestore, collection, onSnapshot } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Set up realtime listeners for tickets
    const ticketsUnsubscribe = onSnapshot(
      collection(db, 'tickets'), 
      (snapshot) => {
        console.log('Cambio en tickets recibido!');
        window.dispatchEvent(new CustomEvent('tickets-updated', { detail: snapshot }));
      },
      (error) => {
        console.error('Error in tickets subscription:', error);
      }
    );
    
    // Set up realtime listeners for services
    const servicesUnsubscribe = onSnapshot(
      collection(db, 'services'), 
      (snapshot) => {
        console.log('Cambio en servicios recibido!');
        window.dispatchEvent(new CustomEvent('services-updated', { detail: snapshot }));
      },
      (error) => {
        console.error('Error in services subscription:', error);
      }
    );
    
    // Set up realtime listeners for rooms
    const roomsUnsubscribe = onSnapshot(
      collection(db, 'rooms'), 
      (snapshot) => {
        console.log('Cambio en salas recibido!');
        window.dispatchEvent(new CustomEvent('rooms-updated', { detail: snapshot }));
      },
      (error) => {
        console.error('Error in rooms subscription:', error);
      }
    );
    
    // Return cleanup function
    return () => {
      ticketsUnsubscribe();
      servicesUnsubscribe();
      roomsUnsubscribe();
    };
  } catch (error) {
    console.error('Error setting up realtime subscriptions:', error);
    return () => {};
  }
};

export const initializeFirestoreData = async () => {
  try {
    const app = await initializeFirebase();
    
    if (!app) {
      console.warn('Firebase not configured, data initialization skipped');
      return;
    }
    
    const { getFirestore, doc, setDoc, collection, getDocs } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    // Check if collections exist and have data
    const checkAndInitialize = async (collectionName: string, initialData: any[]) => {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        console.log(`Initializing ${collectionName} collection with sample data`);
        
        // Create sample data
        for (const item of initialData) {
          await setDoc(doc(db, collectionName, item.id), item);
        }
      }
    };
    
    // Initialize company settings if not exist
    await checkAndInitialize('company_settings', [{
      id: '1',
      name: 'OcularClinic',
      address: 'Av. Principal #123, Ciudad',
      phone: '(123) 456-7890',
      email: 'contacto@ocularclinic.com',
      logo: '',
      ticket_footer: 'Gracias por su visita. Por favor conserve este ticket.',
      display_message: 'Bienvenido a OcularClinic. Por favor espere a ser llamado.',
    }]);
    
    console.log('Firebase data initialization completed');
  } catch (error) {
    console.error('Error initializing Firestore data:', error);
  }
};

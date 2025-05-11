
// Firebase configuration
// Replace these placeholder values with your Firebase project credentials
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// IMPORTANT: Replace this with your actual Firebase config
const firebaseConfig: FirebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Function to check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return (
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.authDomain !== "YOUR_PROJECT_ID.firebaseapp.com" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
};

// Function to initialize Firebase
export const initializeFirebase = async () => {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not yet configured. Please add your Firebase credentials.');
    return null;
  }
  
  try {
    // Dynamic import of Firebase to avoid loading it unnecessarily
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    
    // Initialize Firebase only once
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    console.log('Firebase initialized successfully');
    return app;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

export default firebaseConfig;

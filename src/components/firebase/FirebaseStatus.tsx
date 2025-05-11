
import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, initializeFirebase } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface FirebaseStatusProps {
  onConfigured?: () => void;
}

const FirebaseStatus: React.FC<FirebaseStatusProps> = ({ onConfigured }) => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConfiguration = () => {
      const configured = isFirebaseConfigured();
      setIsConfigured(configured);
      return configured;
    };

    if (checkConfiguration()) {
      initializeFirebaseApp();
    }
  }, []);

  const initializeFirebaseApp = async () => {
    try {
      const app = await initializeFirebase();
      if (app) {
        setIsInitialized(true);
        onConfigured?.();
        setError(null);
      } else {
        setError('Firebase could not be initialized. Check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error initializing Firebase');
      setIsInitialized(false);
    }
  };

  if (!isConfigured) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Firebase aún no está configurado. Por favor edita el archivo <code>src/lib/firebase.ts</code> 
          y actualiza las credenciales con los valores de tu proyecto de Firebase.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al inicializar Firebase: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (isInitialized) {
    return (
      <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-700">
          Firebase configurado correctamente
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Button onClick={initializeFirebaseApp} className="mb-4">
      Inicializar Firebase
    </Button>
  );
};

export default FirebaseStatus;

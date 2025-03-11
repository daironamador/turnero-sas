
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import NotificationManager from '@/components/notifications/NotificationManager';

const Notification: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
        <p className="text-muted-foreground">
          Gestione la información y contenido que se mostrará en la pantalla de Display
        </p>
        
        <NotificationManager />
      </div>
    </MainLayout>
  );
};

export default Notification;

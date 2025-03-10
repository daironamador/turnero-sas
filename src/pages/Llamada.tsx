
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TicketManager from '@/components/queue/TicketManager';

const Llamada: React.FC = () => {
  return (
    <MainLayout>
      <TicketManager />
    </MainLayout>
  );
};

export default Llamada;

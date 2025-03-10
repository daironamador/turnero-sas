
import React from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import TicketGenerator from '@/components/queue/TicketGenerator';
import TicketManager from '@/components/queue/TicketManager';

const Tickets: React.FC = () => {
  const { action } = useParams<{ action?: string }>();
  
  return (
    <MainLayout>
      {action === 'generate' ? <TicketGenerator /> : <TicketManager />}
    </MainLayout>
  );
};

export default Tickets;

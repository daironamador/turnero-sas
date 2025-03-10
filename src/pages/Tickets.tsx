
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TicketGenerator from '@/components/queue/TicketGenerator';

const Tickets: React.FC = () => {
  return (
    <MainLayout>
      <TicketGenerator />
    </MainLayout>
  );
};

export default Tickets;

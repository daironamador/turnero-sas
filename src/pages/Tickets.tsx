
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TicketGenerator from '@/components/queue/TicketGenerator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with more frequent refetch settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 10000, // 10 seconds before data is considered stale
    },
  },
});

const Tickets: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <TicketGenerator />
      </MainLayout>
    </QueryClientProvider>
  );
};

export default Tickets;
